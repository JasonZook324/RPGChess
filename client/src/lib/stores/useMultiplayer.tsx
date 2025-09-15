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
  isConnected: boolean;
  roomId: string | null;
  playerRole: 'white' | 'black' | null;
  opponent: Player | null;
  gameRoom: GameRoom | null;
  isWaitingForPlayer: boolean;
  error: string | null;
  
  // Actions
  connect: (userId: number, username: string) => void;
  disconnect: () => void;
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
}

export const useMultiplayer = create<MultiplayerState>()(
  subscribeWithSelector((set, get) => ({
    socket: null,
    isConnected: false,
    roomId: null,
    playerRole: null,
    opponent: null,
    gameRoom: null,
    isWaitingForPlayer: false,
    error: null,

    connect: (userId: number, username: string) => {
      const socket = io('/', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Connected to server');
        set({ isConnected: true });
        
        // Authenticate with the server
        socket.emit('authenticate', { userId, username });
      });

      socket.on('authenticated', (data: any) => {
        console.log('Authenticated with server:', data);
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
        set({ 
          isConnected: false,
          roomId: null,
          playerRole: null,
          opponent: null,
          gameRoom: null,
          isWaitingForPlayer: false
        });
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

      socket.on('error', (data: { message: string }) => {
        console.error('Socket error:', data.message);
        set({ error: data.message });
      });

      set({ socket });
    },

    disconnect: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ 
          socket: null,
          isConnected: false,
          roomId: null,
          playerRole: null,
          opponent: null,
          gameRoom: null,
          isWaitingForPlayer: false,
          error: null
        });
      }
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
        socket.emit('join_room', { roomId });
        set({ error: null });
      } else {
        set({ error: 'Not connected to server' });
      }
    },

    makeMove: (move: any, gameState: any) => {
      const { socket, roomId } = get();
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
    }
  }))
);