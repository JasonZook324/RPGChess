import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { useChessGame } from "./useChessGame"; // <-- Import your chess game store
import { useAuth } from "./useAuth";

interface Player {
  id: number;
  username: string;
  socketId: string;
}

interface GameRoom {
  id: string;
  gameId?: number; // Database game record ID
  players: {
    white?: Player;
    black?: Player;
  };
  gameState: any;
  status: 'waiting' | 'playing' | 'finished';
  currentTurn: 'white' | 'black';
  moveCount: number;
  createdAt: Date;
  // Point tracking for server-side validation
  points?: {
    white: number;
    black: number;
  };
}

interface MultiplayerState {
  socket: Socket | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  isConnected: boolean;
  roomId: string | null;
  playerRole: 'white' | 'black' | null;
  opponent: Player | null;
  gameRoom: GameRoom | null;
  isWaitingForPlayer: boolean;
  error: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isInMultiplayerMode: boolean;
  // Actions
  connect: (userId: number, username: string) => void;
  disconnect: () => void;
  leaveRoom: () => void;
  exitMultiplayer: () => void;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  makeMove: (move: any, gameState: any) => void;
  endGame: (winner: string, gameState: any) => void;
  clearError: () => void;
  // Event handlers
  onOpponentMove: (callback: (data: { move: any; gameState: any; player: string; moveNumber: number }) => void) => void;
  onGameStart: (callback: (data: { players: { white: Player; black: Player } }) => void) => void;
  onGameEnd: (callback: (data: { winner: string }) => void) => void;
  onPlayerDisconnected: (callback: (data: { player: string }) => void) => void;
  onMoveAccepted: (callback: (data: any) => void) => void;
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
      if (connectionStatus === 'connecting' || connectionStatus === 'connected') {
        console.log('Connection already in progress or established, skipping...');
        return;
      }
      if (existingSocket) {
        existingSocket.removeAllListeners();
        existingSocket.disconnect();
      }
      set({ connectionStatus: 'connecting', error: null });
      const socket = io('/', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false
      });

      socket.on('connect', () => {
        set({
          connectionStatus: 'connected',
          isConnected: true,
          reconnectAttempts: 0,
          error: null,
          isInMultiplayerMode: true
        });
      });

      socket.on('authenticated', (data: any) => {
        if (data.success) set({ error: null });
      });

      socket.on('disconnect', (reason) => {
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
        if (reason !== 'io client disconnect' && state.reconnectAttempts < state.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
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
        set({
          roomId: data.roomId,
          playerRole: data.role,
          isWaitingForPlayer: true,
          error: null
        });
      });

      socket.on('game_start', (data: { players: { white: Player; black: Player } }) => {
        const { playerRole } = get();
        const opponent = playerRole === 'white' ? data.players.black : data.players.white;
        set({
          opponent,
          gameRoom: {
            id: get().roomId!,
            players: data.players,
            gameState: {},
            status: 'playing',
            currentTurn: 'white',
            moveCount: 0,
            createdAt: new Date()
          },
          isWaitingForPlayer: false,
          error: null
        });
      });

      // --- CRITICAL: Update board for opponent_move ---
      socket.on('opponent_move', (data: { move: any; gameState: any; player: string; moveNumber: number }) => {
        // It's now your turn, so set currentPlayer to your own role
        const myRole = get().playerRole;
        
        // If playerRole is somehow null, determine it from the opponent's move
        let nextPlayer = myRole;
        if (!nextPlayer) {
          nextPlayer = data.player === 'white' ? 'black' : 'white';
          // Also restore the playerRole if it was lost
          set({ playerRole: nextPlayer });
        }

        // Check if the move included a battle result that defeated a king
        let gamePhase: 'playing' | 'ended' = 'playing';
        let winner = null;
        
        if (data.move.battle) {
          const battleResult = data.move.battle;
          if (battleResult.result === 'attacker_wins' && battleResult.defender.type === 'king') {
            winner = battleResult.attacker.color;
            gamePhase = 'ended';
            console.log(`Game over! ${winner} wins by defeating the ${battleResult.defender.color} king in battle!`);
          } else if (battleResult.result === 'defender_wins' && battleResult.attacker.type === 'king') {
            winner = battleResult.defender.color;
            gamePhase = 'ended';
            console.log(`Game over! ${winner} wins by defeating the ${battleResult.attacker.color} king in battle!`);
          }
        } else {
          // Fallback: scan the board for missing kings if battle data is unavailable
          const board = data.gameState;
          let whiteKingExists = false;
          let blackKingExists = false;
          
          for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
              const piece = board[row][col];
              if (piece && piece.type === 'king') {
                if (piece.color === 'white') whiteKingExists = true;
                if (piece.color === 'black') blackKingExists = true;
              }
            }
          }
          
          if (!whiteKingExists) {
            winner = 'black';
            gamePhase = 'ended';
            console.log(`Game over! Black wins - White king was defeated!`);
          } else if (!blackKingExists) {
            winner = 'white';
            gamePhase = 'ended';
            console.log(`Game over! White wins - Black king was defeated!`);
          }
        }

        useChessGame.setState({
          board: data.gameState,
          currentPlayer: nextPlayer, // <-- Ensures you can move after opponent's attack
          selectedSquare: null,
          validMoves: [],
          battleState: null,
          gamePhase,
          winner
        });

        set((state) => ({
          gameRoom: state.gameRoom
            ? { ...state.gameRoom, moveCount: data.moveNumber }
            : state.gameRoom
        }));
      });

      socket.on('game_ended', (data: { winner: string }) => {
        set((state) => ({
          gameRoom: state.gameRoom ? { ...state.gameRoom, status: 'finished' } : null
        }));
      });

      socket.on('player_disconnected', (data: { player: string }) => {
        set({ error: `${data.player} has disconnected` });
      });

      socket.on('connect_error', (error) => {
        const state = get();
        set({
          connectionStatus: 'disconnected',
          isConnected: false,
          error: `Connection failed: ${error.message || error}`
        });
        if (state.reconnectAttempts < state.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
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
        set({ error: data.message });
      });

      // Listen for server-authoritative battle results and point updates
      socket.on('battle_resolved', (data: { battleResult: any; points: { white: number; black: number }; player: string; moveNumber: number }) => {
        console.log('Battle resolved from server:', data);
        
        // Update chess game points with server-authoritative values
        const chessGameState = useChessGame.getState();
        chessGameState.updateGamePoints(data.points.white, data.points.black);
        
        console.log(`Points synchronized from server: white=${data.points.white}, black=${data.points.black}`);
      });

      set({ socket });
    },

    disconnect: () => {
      const { socket } = get();
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

    leaveRoom: () => {
      const { socket, roomId } = get();
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
      const state = get();
      if (state.roomId) {
        state.leaveRoom();
      }
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
        socket.emit('join_room', { roomId });
        set({ roomId });
        set({ error: null });
      } else {
        set({ error: 'Not connected to server' });
      }
    },

    makeMove: (move: any, gameState: any) => {
        const { socket, roomId } = get();
        console.log(`Making move!: ${gameState}`);
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