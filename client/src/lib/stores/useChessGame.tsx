import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getValidMoves, isInCheck, isCheckmate, isStalemate } from "../chess/chessLogic";
import { makeAIMove } from "../chess/chessAI";
import { resolveBattle as battleResolve, BattleResult } from "../chess/battleSystem";
import { getPieceStats, xpToNext, calculateXPAward, getMaxHealth, calculateHealAmount } from "../chess/pieceData";
import { v4 as uuidv4 } from 'uuid';

export interface ChessPiece {
  id: string;
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
  health: number;
  level: number;
  xp: number;
  unspentPoints: number;
  mods: {
    attack: number;
    defense: number;
    maxHealth: number;
  };
  hasMoved?: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface BattleState {
  attacker: ChessPiece;
  defender: ChessPiece;
  originalAttacker: ChessPiece;
  originalDefender: ChessPiece;
  attackerRoll: number;
  defenderRoll: number;
  damage: number;
  result: 'attacker_wins' | 'defender_wins' | 'both_survive';
  attackerPosition: Position;
  defenderPosition: Position;
}

type GameMode = 'pvp' | 'pvc' | null;
type GamePhase = 'ready' | 'playing' | 'battle' | 'promotion' | 'ended';
type AIDifficulty = 'easy' | 'medium' | 'hard';
type PromotionPieceType = 'queen' | 'rook' | 'knight' | 'bishop';

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
  
  // Experience system state
  levelUpQueue: string[];
  activeLevelUpPieceId: string | null;
  
  // Heal system state
  isHealMode: boolean;
  selectedPieceForHeal: Position | null;
  
  // Promotion state
  promotionPosition: Position | null;
  promotingPiece: ChessPiece | null;
  
  // Actions
  setGameMode: (mode: GameMode) => void;
  setAIDifficulty: (difficulty: AIDifficulty) => void;
  handleSquareClick: (row: number, col: number) => void;
  resolveBattle: () => void;
  restartGame: () => void;
  backToMenu: () => void;
  updateAI: (deltaTime: number) => void;
  
  // Experience system actions
  awardXP: (pieceId: string, amount: number) => void;
  allocateAttributes: (pieceId: string, allocation: { attack?: number; defense?: number; maxHealth?: number }) => void;
  setActiveLevelUpPiece: (pieceId: string | null) => void;
  
  // Heal system actions
  toggleHealMode: () => void;
  performHeal: (bishopPosition: Position, targetPosition: Position) => void;
  
  // Promotion actions
  promotePawn: (pieceType: PromotionPieceType) => void;
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
      id: uuidv4(),
      type: pieceOrder[col], 
      color: 'black', 
      health: stats.maxHealth,
      level: 1,
      xp: 0,
      unspentPoints: 0,
      mods: { attack: 0, defense: 0, maxHealth: 0 }
    };
    const pawnStats = getPieceStats('pawn');
    board[1][col] = { 
      id: uuidv4(),
      type: 'pawn', 
      color: 'black', 
      health: pawnStats.maxHealth,
      level: 1,
      xp: 0,
      unspentPoints: 0,
      mods: { attack: 0, defense: 0, maxHealth: 0 }
    };
  }
  
  // White pieces (bottom)
  for (let col = 0; col < 8; col++) {
    const stats = getPieceStats(pieceOrder[col]);
    board[7][col] = { 
      id: uuidv4(),
      type: pieceOrder[col], 
      color: 'white', 
      health: stats.maxHealth,
      level: 1,
      xp: 0,
      unspentPoints: 0,
      mods: { attack: 0, defense: 0, maxHealth: 0 }
    };
    const pawnStats = getPieceStats('pawn');
    board[6][col] = { 
      id: uuidv4(),
      type: 'pawn', 
      color: 'white', 
      health: pawnStats.maxHealth,
      level: 1,
      xp: 0,
      unspentPoints: 0,
      mods: { attack: 0, defense: 0, maxHealth: 0 }
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
    
    // Experience system initial state
    levelUpQueue: [],
    activeLevelUpPieceId: null,
    
    // Heal system initial state
    isHealMode: false,
    selectedPieceForHeal: null,
    
    // Promotion initial state
    promotionPosition: null,
    promotingPiece: null,
    
    setGameMode: (mode) => set({ 
      gameMode: mode, 
      gamePhase: mode ? 'playing' : 'ready' 
    }),
    
    setAIDifficulty: (difficulty) => set({ aiDifficulty: difficulty }),
    
    handleSquareClick: (row, col) => {
      const state = get();
      if (state.gamePhase !== 'playing') return;
      
      const { board, selectedSquare, currentPlayer, isHealMode } = state;
      const clickedPiece = board[row][col];
      
      // If no piece is selected
      if (!selectedSquare) {
        if (clickedPiece && clickedPiece.color === currentPlayer) {
          const validMoves = getValidMoves(board, { row, col }, isHealMode);
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
      
      // Get selected piece for heal check
      const selectedPiece = selectedSquare ? board[selectedSquare.row][selectedSquare.col] : null;
      
      // Special case: heal action in heal mode
      if (isHealMode && selectedPiece && selectedPiece.type === 'bishop' && clickedPiece && clickedPiece.color === currentPlayer) {
        // Check if this is a valid heal target
        const isValidHealTarget = state.validMoves.some(move => move.row === row && move.col === col);
        if (isValidHealTarget) {
          get().performHeal(selectedSquare, { row, col });
          return;
        }
      }
      
      // If clicking another piece of the same color, select it
      if (clickedPiece && clickedPiece.color === currentPlayer) {
        const validMoves = getValidMoves(board, { row, col }, isHealMode);
        set({ 
          selectedSquare: { row, col }, 
          validMoves 
        });
        return;
      }
      
      // Check if it's a valid move
      const isValidMove = state.validMoves.some(move => move.row === row && move.col === col);
      if (!isValidMove) return;
      
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
        
        // Check if pawn reaches promotion rank
        if (selectedPiece.type === 'pawn') {
          if ((selectedPiece.color === 'white' && row === 0) ||
              (selectedPiece.color === 'black' && row === 7)) {
            // Store promotion info and enter promotion phase
            set({
              board: newBoard, // Apply the move to show pawn on promotion square
              promotionPosition: { row, col },
              promotingPiece: selectedPiece,
              gamePhase: 'promotion',
              selectedSquare: null,
              validMoves: []
            });
            
            // Schedule AI promotion if in PvC mode and it's AI's piece
            const currentState = get();
            if (currentState.gameMode === 'pvc' && selectedPiece.color === 'black') {
              setTimeout(() => get().promotePawn('queen'), 500);
            }
            
            return; // Don't complete the move yet
          }
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
        
        // Check for pawn promotion after capturing
        if (battleState.attacker.type === 'pawn') {
          if ((battleState.attacker.color === 'white' && defenderPosition.row === 0) ||
              (battleState.attacker.color === 'black' && defenderPosition.row === 7)) {
            // Award XP before entering promotion phase
            const xpAward = calculateXPAward(battleState.attacker.level, battleState.defender.level, battleState.defender.type);
            console.log(`Battle XP: ${battleState.attacker.type} (${battleState.attacker.id}) defeats ${battleState.defender.type} and gains ${xpAward} XP`);
            
            // Enter promotion phase
            set({
              board: newBoard,
              promotionPosition: defenderPosition,
              promotingPiece: battleState.attacker,
              gamePhase: 'promotion',
              selectedSquare: null,
              validMoves: [],
              battleState: null
            });
            
            // Award XP after state is updated
            setTimeout(() => get().awardXP(battleState.attacker.id, xpAward), 0);
            
            // Schedule AI promotion if in PvC mode and it's AI's piece
            if (get().gameMode === 'pvc' && battleState.attacker.color === 'black') {
              setTimeout(() => get().promotePawn('queen'), 500);
            }
            
            return; // Don't continue with normal battle resolution
          }
        }
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
      
      // Award XP for victories
      if (battleState.result === 'attacker_wins') {
        const xpAward = calculateXPAward(battleState.attacker.level, battleState.defender.level, battleState.defender.type);
        console.log(`Battle XP: ${battleState.attacker.type} (${battleState.attacker.id}) defeats ${battleState.defender.type} and gains ${xpAward} XP`);
        // Use setTimeout to ensure XP is awarded after board state is updated
        setTimeout(() => get().awardXP(battleState.attacker.id, xpAward), 0);
      } else if (battleState.result === 'defender_wins') {
        const xpAward = calculateXPAward(battleState.defender.level, battleState.attacker.level, battleState.attacker.type);
        console.log(`Battle XP: ${battleState.defender.type} (${battleState.defender.id}) defeats ${battleState.attacker.type} and gains ${xpAward} XP`);
        // Use setTimeout to ensure XP is awarded after board state is updated
        setTimeout(() => get().awardXP(battleState.defender.id, xpAward), 0);
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
      aiThinkingTime: 0,
      levelUpQueue: [],
      activeLevelUpPieceId: null
    }),
    
    // Experience system actions
    awardXP: (pieceId: string, amount: number) => {
      set((state) => {
        const newBoard = state.board.map(row => row.map(piece => {
          if (!piece || piece.id !== pieceId) return piece;
          
          let newPiece = { ...piece, xp: piece.xp + amount };
          let leveledUp = false;
          
          // Check for level ups
          while (newPiece.xp >= xpToNext(newPiece.level)) {
            newPiece.xp -= xpToNext(newPiece.level);
            newPiece.level++;
            newPiece.unspentPoints++;
            leveledUp = true;
          }
          
          // Add to level up queue if leveled up
          const newLevelUpQueue = leveledUp && !state.levelUpQueue.includes(pieceId) 
            ? [...state.levelUpQueue, pieceId] 
            : state.levelUpQueue;
          
          if (leveledUp) {
            setTimeout(() => set({ levelUpQueue: newLevelUpQueue }), 0);
          }
          
          return newPiece;
        }));
        
        return { board: newBoard };
      });
    },
    
    allocateAttributes: (pieceId: string, allocation: { attack?: number; defense?: number; maxHealth?: number }) => {
      set((state) => {
        const newBoard = state.board.map(row => row.map(piece => {
          if (!piece || piece.id !== pieceId) return piece;
          
          const pointsUsed = (allocation.attack || 0) + (allocation.defense || 0) + (allocation.maxHealth || 0);
          if (pointsUsed > piece.unspentPoints) return piece;
          
          const newMods = {
            attack: piece.mods.attack + (allocation.attack || 0),
            defense: piece.mods.defense + (allocation.defense || 0),
            maxHealth: piece.mods.maxHealth + (allocation.maxHealth || 0)
          };
          
          // If maxHealth increased, increase current health by the same amount (capped at new max)
          let newHealth = piece.health;
          if (allocation.maxHealth && allocation.maxHealth > 0) {
            const newMaxHealth = getMaxHealth({ ...piece, mods: newMods });
            newHealth = Math.min(newMaxHealth, piece.health + allocation.maxHealth);
          }
          
          const updatedPiece = {
            ...piece,
            mods: newMods,
            health: newHealth,
            unspentPoints: piece.unspentPoints - pointsUsed
          };
          
          return updatedPiece;
        }));
        
        // Remove from queue if no more unspent points
        const updatedPiece = newBoard.flat().find(p => p?.id === pieceId);
        const newLevelUpQueue = updatedPiece && updatedPiece.unspentPoints === 0
          ? state.levelUpQueue.filter(id => id !== pieceId)
          : state.levelUpQueue;
        
        return { 
          board: newBoard, 
          levelUpQueue: newLevelUpQueue,
          activeLevelUpPieceId: newLevelUpQueue.length > 0 ? state.activeLevelUpPieceId : null
        };
      });
    },
    
    setActiveLevelUpPiece: (pieceId: string | null) => set({ activeLevelUpPieceId: pieceId }),
    
    // Heal system actions
    toggleHealMode: () => {
      set((state) => ({
        isHealMode: !state.isHealMode,
        selectedSquare: null,
        validMoves: [],
        selectedPieceForHeal: null
      }));
    },
    
    performHeal: (bishopPosition: Position, targetPosition: Position) => {
      const state = get();
      const bishop = state.board[bishopPosition.row][bishopPosition.col];
      const target = state.board[targetPosition.row][targetPosition.col];
      
      if (!bishop || !target || bishop.type !== 'bishop' || bishop.color !== target.color) {
        return;
      }
      
      const targetMaxHealth = getMaxHealth(target);
      const healAmount = calculateHealAmount(bishop.level, targetMaxHealth);
      const newHealth = Math.min(targetMaxHealth, target.health + healAmount);
      
      const newBoard = state.board.map(row => [...row]);
      newBoard[targetPosition.row][targetPosition.col] = {
        ...target,
        health: newHealth
      };
      
      const moveNotation = `${bishop.type} heals ${target.type} for ${healAmount} HP`;
      const nextPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
      
      set({
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedSquare: null,
        validMoves: [],
        isHealMode: false,
        selectedPieceForHeal: null,
        moveHistory: [...state.moveHistory, moveNotation]
      });
    },
    
    // Promotion actions
    promotePawn: (pieceType: PromotionPieceType) => {
      const state = get();
      if (!state.promotionPosition || !state.promotingPiece) return;
      
      const { promotionPosition, promotingPiece, currentPlayer, selectedSquare } = state;
      
      // Create the new promoted piece
      const stats = getPieceStats(pieceType);
      const promotedPiece: ChessPiece = {
        ...promotingPiece,
        type: pieceType,
        health: stats.maxHealth,
        hasMoved: true
      };
      
      // Update the board
      const newBoard = state.board.map(r => [...r]);
      newBoard[promotionPosition.row][promotionPosition.col] = promotedPiece;
      
      // Clear original position if pawn moved
      if (selectedSquare) {
        newBoard[selectedSquare.row][selectedSquare.col] = null;
      }
      
      const moveNotation = `${promotingPiece.type} promotes to ${pieceType} at ${String.fromCharCode(97 + promotionPosition.col)}${8 - promotionPosition.row}`;
      
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
        promotionPosition: null,
        promotingPiece: null,
        gamePhase: phase,
        moveHistory: [...state.moveHistory, moveNotation],
        winner
      });
    }
  }))
);
