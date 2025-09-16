import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

interface Player {
  id: number;
  username: string;
  socketId: string;
}

interface GameRoom {
  id: string;
  players: {
    white?: Player;
    black?: Player;
  };
  status: 'waiting' | 'playing' | 'finished';
}

interface MultiplayerState {
  socket: Socket | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  isConnected: boolean; // Kept for backward compatibility
  roomId: string | null;
  playerRole: 'white' | 'black' | null;
  opponent: Player | null;
  gameRoom: GameRoom | null;
  isWaitingForPlayer: boolean;
  error: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isInMultiplayerMode: boolean; // Track if user is in multiplayer session
  
  // Actions
  connect: (userId: number, username: string) => void;
  disconnect: () => void;
  leaveRoom: () => void; // Leave current room but stay connected
  exitMultiplayer: () => void; // Exit multiplayer mode entirely
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  makeMove: (move: any, gameState: any) => void;
  endGame: (winner: string, gameState: any) => void;
  clearError: () => void;
  
  // Event handlers
  onOpponentMove: (callback: (data: { move: any; gameState: any; player: string }) => void) => void;
  onGameStart: (callback: (data: { players: { white: Player; black: Player } }) => void) => void;
  onGameEnd: (callback: (data: { winner: string }) => void) => void;
  onPlayerDisconnected: (callback: (data: { player: string }) => void) => void;
  onMoveAccepted: (callback: (data: any) => void) => void; // Add this line
}

export const useMultiplayer = create<MultiplayerState>()(
  subscribeWithSelector((set, get) => ({
    socket: null,
    connectionStatus: 'disconnected',
    isConnected: false,
    roomId: null,
    playerRole: null,
    opponent: null,
    gameRoom: null,
    isWaitingForPlayer: false,
    error: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    isInMultiplayerMode: false,

    connect: (userId: number, username: string) => {
      const { socket: existingSocket, connectionStatus } = get();
      
      // Prevent multiple connection attempts
      if (connectionStatus === 'connecting' || connectionStatus === 'connected') {
        console.log('Connection already in progress or established, skipping...');
        return;
      }
      
      // Clean up existing socket if any
      if (existingSocket) {
        console.log('Cleaning up existing socket before reconnecting...');
        existingSocket.removeAllListeners();
        existingSocket.disconnect();
      }
      
      set({ connectionStatus: 'connecting', error: null });
      
      const socket = io('/', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false // We'll handle reconnection manually
      });

      socket.on('connect', () => {
        console.log('Connected to server');
        set({ 
          connectionStatus: 'connected',
          isConnected: true,
          reconnectAttempts: 0,
          error: null,
          isInMultiplayerMode: true
        });
      });

      socket.on('authenticated', (data: any) => {
        console.log('Authenticated with server:', data);
        // Server sends back the authenticated user data
        if (data.success) {
          set({ error: null });
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from server, reason:', reason);
        const state = get();
        
        set({ 
          connectionStatus: 'disconnected',
          isConnected: false,
          roomId: null,
          playerRole: null,
          opponent: null,
          gameRoom: null,
          isWaitingForPlayer: false,
          isInMultiplayerMode: false
        });
        
        // Only attempt reconnection for unexpected disconnects (not manual disconnects)
        if (reason !== 'io client disconnect' && state.reconnectAttempts < state.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
          console.log(`Attempting reconnection in ${delay}ms (attempt ${state.reconnectAttempts + 1}/${state.maxReconnectAttempts})`);
          
          set({ reconnectAttempts: state.reconnectAttempts + 1 });
          
          setTimeout(() => {
            const currentState = get();
            if (currentState.connectionStatus === 'disconnected') {
              currentState.connect(userId, username);
            }
          }, delay);
        } else if (state.reconnectAttempts >= state.maxReconnectAttempts) {
          set({ error: 'Connection failed after multiple attempts. Please refresh and try again.' });
        }
      });

      socket.on('room_created', (data: { roomId: string; role: 'white' | 'black' }) => {
        console.log('Room created:', data);
        set({ 
          roomId: data.roomId,
          playerRole: data.role,
          isWaitingForPlayer: true,
          error: null
        });
      });

      socket.on('game_start', (data: { players: { white: Player; black: Player } }) => {
        console.log('Game starting:', data);
        const { playerRole } = get();
        const opponent = playerRole === 'white' ? data.players.black : data.players.white;
        
        set({ 
          opponent,
          gameRoom: {
            id: get().roomId!,
            players: data.players,
            status: 'playing'
          },
          isWaitingForPlayer: false,
          error: null
        });
      });

      socket.on('opponent_move', (data: { move: any; gameState: any; player: string }) => {
        console.log('Opponent move received:', data);
        // This will be handled by the game store
      });

      socket.on('game_ended', (data: { winner: string }) => {
        console.log('Game ended:', data);
        set((state) => ({
          gameRoom: state.gameRoom ? { ...state.gameRoom, status: 'finished' } : null
        }));
      });

      socket.on('player_disconnected', (data: { player: string }) => {
        console.log('Player disconnected:', data);
        set({ error: `${data.player} has disconnected` });
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        const state = get();
        set({ 
          connectionStatus: 'disconnected',
          isConnected: false,
          error: `Connection failed: ${error.message || error}` 
        });
        
        // Retry connection with exponential backoff
        if (state.reconnectAttempts < state.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
          console.log(`Retrying connection in ${delay}ms (attempt ${state.reconnectAttempts + 1}/${state.maxReconnectAttempts})`);
          
          set({ reconnectAttempts: state.reconnectAttempts + 1 });
          
          setTimeout(() => {
            const currentState = get();
            if (currentState.connectionStatus === 'disconnected') {
              currentState.connect(userId, username);
            }
          }, delay);
        }
      });

      socket.on('error', (data: { message: string }) => {
        console.error('Socket error:', data.message);
        set({ error: data.message });
      });

      set({ socket });
    },

    disconnect: () => {
      const { socket } = get();
      console.log('Manual disconnect requested');
      
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      
      set({ 
        socket: null,
        connectionStatus: 'disconnected',
        isConnected: false,
        roomId: null,
        playerRole: null,
        opponent: null,
        gameRoom: null,
        isWaitingForPlayer: false,
        error: null,
        reconnectAttempts: 0, // Reset reconnection attempts on manual disconnect
        isInMultiplayerMode: false
      });
    },

    leaveRoom: () => {
      const { socket, roomId } = get();
      console.log('Leaving room but staying connected');
      
      if (socket && socket.connected && roomId) {
        socket.emit('leave_room', { roomId });
      }
      
      set({ 
        roomId: null,
        playerRole: null,
        opponent: null,
        gameRoom: null,
        isWaitingForPlayer: false,
        error: null
      });
    },

    exitMultiplayer: () => {
      const { socket } = get();
      console.log('Exiting multiplayer mode entirely');
      
      // Leave room first if in one
      const state = get();
      if (state.roomId) {
        state.leaveRoom();
      }
      
      // Then disconnect
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      
      set({ 
        socket: null,
        connectionStatus: 'disconnected',
        isConnected: false,
        roomId: null,
        playerRole: null,
        opponent: null,
        gameRoom: null,
        isWaitingForPlayer: false,
        error: null,
        reconnectAttempts: 0,
        isInMultiplayerMode: false
      });
    },

    createRoom: () => {
      const { socket } = get();
      if (socket && socket.connected) {
        socket.emit('create_room');
      } else {
        set({ error: 'Not connected to server' });
      }
    },

    joinRoom: (roomId: string) => {
      const { socket } = get();
      if (socket && socket.connected) {
        console.log("Joining room:", roomId);
          socket.emit('join_room', { roomId });
          set({ roomId }); 
        set({ error: null });
      } else {
        set({ error: 'Not connected to server' });
      }
    },

      makeMove: (move: any, gameState: any) => {
          
          const { socket, roomId } = get();
          console.log(`Emitting opponent_move to room${roomId}. Sender: ${socket?.id}`);
      if (socket && socket.connected && roomId) {
        socket.emit('make_move', { roomId, move, gameState });
      } else {
        set({ error: 'Cannot make move: not connected or no room' });
      }
    },

    endGame: (winner: string, gameState: any) => {
      const { socket, roomId } = get();
      if (socket && socket.connected && roomId) {
        socket.emit('game_end', { roomId, winner, gameState });
      }
    },

    clearError: () => set({ error: null }),

    // Event handlers for components to subscribe to
    onOpponentMove: (callback) => {
      const { socket } = get();
      if (socket) {
        socket.on('opponent_move', callback);
      }
    },

    onGameStart: (callback) => {
      const { socket } = get();
      if (socket) {
        socket.on('game_start', callback);
      }
    },

    onGameEnd: (callback) => {
      const { socket } = get();
      if (socket) {
        socket.on('game_ended', callback);
      }
    },

    onPlayerDisconnected: (callback) => {
      const { socket } = get();
      if (socket) {
        socket.on('player_disconnected', callback);
      }
    },

    onMoveAccepted: (callback) => {
      const { socket } = get();
      if (socket) {
        socket.on('move_accepted', callback);
      }
    }
  }))
);