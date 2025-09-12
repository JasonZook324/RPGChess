import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getValidMoves, isInCheck, isCheckmate, isStalemate } from "../chess/chessLogic";
import { makeAIMove } from "../chess/chessAI";
import { resolveBattle as battleResolve, BattleResult } from "../chess/battleSystem";
import { getPieceStats } from "../chess/pieceData";

export interface ChessPiece {
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  health: number;
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface BattleState {
  attacker: ChessPiece;
  defender: ChessPiece;
  attackerRoll: number;
  defenderRoll: number;
  damage: number;
  result: 'attacker_wins' | 'defender_wins' | 'both_survive';
  attackerPosition: Position;
  defenderPosition: Position;
}

type GameMode = 'pvp' | 'pvc' | null;
type GamePhase = 'ready' | 'playing' | 'battle' | 'ended';
type AIDifficulty = 'easy' | 'medium' | 'hard';

interface ChessGameState {
  // Game state
  board: (ChessPiece | null)[][];
  currentPlayer: 'white' | 'black';
  gamePhase: GamePhase;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  winner: 'white' | 'black' | null;
  
  // UI state
  selectedSquare: Position | null;
  validMoves: Position[];
  battleState: BattleState | null;
  moveHistory: string[];
  
  // AI state
  aiThinkingTime: number;
  
  // Actions
  setGameMode: (mode: GameMode) => void;
  setAIDifficulty: (difficulty: AIDifficulty) => void;
  handleSquareClick: (row: number, col: number) => void;
  resolveBattle: () => void;
  restartGame: () => void;
  backToMenu: () => void;
  updateAI: (deltaTime: number) => void;
}

// Initial board setup
const createInitialBoard = (): (ChessPiece | null)[][] => {
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place pieces with full health
  const pieceOrder: ChessPiece['type'][] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  // Black pieces (top)
  for (let col = 0; col < 8; col++) {
    const stats = getPieceStats(pieceOrder[col]);
    board[0][col] = { 
      type: pieceOrder[col], 
      color: 'black', 
      health: stats.maxHealth 
    };
    board[1][col] = { 
      type: 'pawn', 
      color: 'black', 
      health: getPieceStats('pawn').maxHealth 
    };
  }
  
  // White pieces (bottom)
  for (let col = 0; col < 8; col++) {
    const stats = getPieceStats(pieceOrder[col]);
    board[7][col] = { 
      type: pieceOrder[col], 
      color: 'white', 
      health: stats.maxHealth 
    };
    board[6][col] = { 
      type: 'pawn', 
      color: 'white', 
      health: getPieceStats('pawn').maxHealth 
    };
  }
  
  return board;
};

export const useChessGame = create<ChessGameState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    board: createInitialBoard(),
    currentPlayer: 'white',
    gamePhase: 'ready',
    gameMode: null,
    aiDifficulty: 'medium',
    winner: null,
    selectedSquare: null,
    validMoves: [],
    battleState: null,
    moveHistory: [],
    aiThinkingTime: 0,
    
    setGameMode: (mode) => set({ 
      gameMode: mode, 
      gamePhase: mode ? 'playing' : 'ready' 
    }),
    
    setAIDifficulty: (difficulty) => set({ aiDifficulty: difficulty }),
    
    handleSquareClick: (row, col) => {
      const state = get();
      if (state.gamePhase !== 'playing') return;
      
      const { board, selectedSquare, currentPlayer } = state;
      const clickedPiece = board[row][col];
      
      // If no piece is selected
      if (!selectedSquare) {
        if (clickedPiece && clickedPiece.color === currentPlayer) {
          const validMoves = getValidMoves(board, { row, col });
          set({ 
            selectedSquare: { row, col }, 
            validMoves 
          });
        }
        return;
      }
      
      // If clicking the same square, deselect
      if (selectedSquare.row === row && selectedSquare.col === col) {
        set({ selectedSquare: null, validMoves: [] });
        return;
      }
      
      // If clicking another piece of the same color, select it
      if (clickedPiece && clickedPiece.color === currentPlayer) {
        const validMoves = getValidMoves(board, { row, col });
        set({ 
          selectedSquare: { row, col }, 
          validMoves 
        });
        return;
      }
      
      // Check if it's a valid move
      const isValidMove = state.validMoves.some(move => move.row === row && move.col === col);
      if (!isValidMove) return;
      
      const selectedPiece = board[selectedSquare.row][selectedSquare.col];
      if (!selectedPiece) return;
      
      // If there's a piece to capture, start battle
      if (clickedPiece) {
        const battleResult = battleResolve(selectedPiece, clickedPiece);
        const battleStateWithPositions: BattleState = {
          ...battleResult,
          attackerPosition: { row: selectedSquare.row, col: selectedSquare.col },
          defenderPosition: { row, col }
        };
        set({ 
          battleState: battleStateWithPositions,
          gamePhase: 'battle'
        });
      } else {
        // Regular move
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = selectedPiece;
        newBoard[selectedSquare.row][selectedSquare.col] = null;
        
        // Mark piece as moved
        if (newBoard[row][col]) {
          newBoard[row][col]!.hasMoved = true;
        }
        
        const moveNotation = `${selectedPiece.type} ${String.fromCharCode(97 + selectedSquare.col)}${8 - selectedSquare.row} → ${String.fromCharCode(97 + col)}${8 - row}`;
        
        // Check for game end
        const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
        let winner = null;
        let phase: GamePhase = 'playing';
        
        if (isCheckmate(newBoard, nextPlayer)) {
          winner = currentPlayer;
          phase = 'ended';
        } else if (isStalemate(newBoard, nextPlayer)) {
          phase = 'ended';
        }
        
        set({ 
          board: newBoard,
          currentPlayer: nextPlayer,
          selectedSquare: null,
          validMoves: [],
          moveHistory: [...state.moveHistory, moveNotation],
          winner,
          gamePhase: phase
        });
      }
    },
    
    resolveBattle: () => {
      const state = get();
      if (!state.battleState) return;
      
      const { battleState, board, currentPlayer } = state;
      const { attackerPosition, defenderPosition } = battleState;
      
      const newBoard = board.map(r => [...r]);
      
      if (battleState.result === 'attacker_wins') {
        // Attacker wins, move to defender's position
        newBoard[defenderPosition.row][defenderPosition.col] = battleState.attacker;
        newBoard[attackerPosition.row][attackerPosition.col] = null;
        // Mark piece as moved
        newBoard[defenderPosition.row][defenderPosition.col]!.hasMoved = true;
      } else if (battleState.result === 'defender_wins') {
        // Defender wins, attacker is destroyed (removed from original position)
        newBoard[attackerPosition.row][attackerPosition.col] = null;
        // Defender stays in place with updated health
        newBoard[defenderPosition.row][defenderPosition.col] = battleState.defender;
      } else {
        // Both survive, update health but stay in original positions
        newBoard[attackerPosition.row][attackerPosition.col] = battleState.attacker;
        newBoard[defenderPosition.row][defenderPosition.col] = battleState.defender;
      }
      
      const moveNotation = `${battleState.attacker.type} battles ${battleState.defender.type} - ${battleState.result.replace('_', ' ')}`;
      
      // Check for game end
      const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
      let winner = null;
      let phase: GamePhase = 'playing';
      
      if (isCheckmate(newBoard, nextPlayer)) {
        winner = currentPlayer;
        phase = 'ended';
      } else if (isStalemate(newBoard, nextPlayer)) {
        phase = 'ended';
      }
      
      set({ 
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedSquare: null,
        validMoves: [],
        battleState: null,
        gamePhase: phase,
        moveHistory: [...state.moveHistory, moveNotation],
        winner
      });
    },
    
    updateAI: (deltaTime) => {
      const state = get();
      if (state.gameMode !== 'pvc' || state.currentPlayer !== 'black' || state.gamePhase !== 'playing') {
        return;
      }
      
      const newThinkingTime = state.aiThinkingTime + deltaTime;
      
      // AI thinking delay based on difficulty
      const thinkingDelay = state.aiDifficulty === 'easy' ? 0.5 : 
                           state.aiDifficulty === 'medium' ? 1.0 : 1.5;
      
      if (newThinkingTime >= thinkingDelay) {
        const aiMove = makeAIMove(state.board, state.aiDifficulty);
        if (aiMove) {
          // Simulate AI move
          set({ selectedSquare: aiMove.from, validMoves: [aiMove.to] });
          setTimeout(() => {
            get().handleSquareClick(aiMove.to.row, aiMove.to.col);
          }, 100);
        }
        set({ aiThinkingTime: 0 });
      } else {
        set({ aiThinkingTime: newThinkingTime });
      }
    },
    
    restartGame: () => set({
      board: createInitialBoard(),
      currentPlayer: 'white',
      gamePhase: 'playing',
      winner: null,
      selectedSquare: null,
      validMoves: [],
      battleState: null,
      moveHistory: [],
      aiThinkingTime: 0
    }),
    
    backToMenu: () => set({
      gameMode: null,
      gamePhase: 'ready',
      board: createInitialBoard(),
      currentPlayer: 'white',
      winner: null,
      selectedSquare: null,
      validMoves: [],
      battleState: null,
      moveHistory: [],
      aiThinkingTime: 0
    })
  }))
);
