import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getValidMoves, isInCheck, isCheckmate, isStalemate } from "../chess/chessLogic";
import { makeAIMove } from "../chess/chessAI";
import { resolveBattle as battleResolve, BattleResult } from "../chess/battleSystem";
import { getPieceStats, xpToNext, calculateXPAward, getMaxHealth, calculateHealAmount } from "../chess/pieceData";
import { v4 as uuidv4 } from 'uuid';
import { useMultiplayer } from "./useMultiplayer"; // already imported

// Point values for defeated pieces (matches server-side values)
const PIECE_POINT_VALUES: Record<ChessPiece['type'], number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 8,
  king: 15
};

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
  // Poison system
  poisonStatus?: {
    turnsRemaining: number;
    damagePercentage: number; // Base 10% + 5% per knight level
    appliedBy: string; // ID of the knight that applied the poison
  };
  poisonCooldown?: number; // Turns remaining until can poison again (for knights)
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
  
  // Poison system state
  isPoisonMode: boolean;
  selectedPieceForPoison: Position | null;
  
  // Promotion state
  promotionPosition: Position | null;
  promotingPiece: ChessPiece | null;
  
  // Point tracking state
  gamePoints: {
    white: number;
    black: number;
  };
  lastPointAward: {
    player: 'white' | 'black';
    points: number;
    pieceType: string;
  } | null;

  // Timer state
  moveTimer: number; // seconds remaining for current turn
  timerActive: boolean; // whether timer is counting down
  totalMoveTime: number; // total time per move (90 seconds)
  
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
  autoAllocateAIAttributes: (pieceId: string) => void;
  setActiveLevelUpPiece: (pieceId: string | null) => void;
  
  // Heal system actions
  toggleHealMode: () => void;
  performHeal: (bishopPosition: Position, targetPosition: Position) => void;
  
  // Poison system actions
  togglePoisonMode: () => void;
  performPoisonAttack: (knightPosition: Position, targetPosition: Position) => void;
  processPoisonAndCooldowns: () => void;
  
  // Promotion actions
  promotePawn: (pieceType: PromotionPieceType) => void;
  
  // Point tracking actions
  awardPoints: (player: 'white' | 'black', points: number, pieceType: string) => void;
  updateGamePoints: (whitePoints: number, blackPoints: number) => void;

  // Timer actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  handleTimerExpire: () => void;
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

        // Timer initial state
        moveTimer: 90,
        timerActive: false,
        totalMoveTime: 90,

        // Heal system initial state
        isHealMode: false,
        selectedPieceForHeal: null,
        
        // Poison system initial state
        isPoisonMode: false,
        selectedPieceForPoison: null,

        // Promotion initial state
        promotionPosition: null,
        promotingPiece: null,

        // Point tracking initial state
        gamePoints: {
            white: 0,
            black: 0
        },
        lastPointAward: null,

        setGameMode: (mode) => set({
            gameMode: mode,
            gamePhase: mode ? 'playing' : 'ready',
            // Reset point tracking when starting a new game mode
            gamePoints: {
                white: 0,
                black: 0
            },
            lastPointAward: null
        }),

        setAIDifficulty: (difficulty) => set({ aiDifficulty: difficulty }),

        handleSquareClick: (row, col) => {
            const state = get();
            if (state.gamePhase !== 'playing') return;

            const { board, selectedSquare, currentPlayer, isHealMode, isPoisonMode } = state;
            const clickedPiece = board[row][col];

            // If no piece is selected
            if (!selectedSquare) {
                if (clickedPiece && clickedPiece.color === currentPlayer) {
                    // In multiplayer, also validate against player role
                    const multiplayerState = useMultiplayer.getState();
                    if (state.gameMode === 'pvp' && multiplayerState.isInMultiplayerMode) {
                        if (clickedPiece.color !== multiplayerState.playerRole) {
                            console.log("Prevented selection of opponent's piece:", clickedPiece.color, "vs role:", multiplayerState.playerRole);
                            return; // Prevent selection of opponent's pieces
                        }
                    }
                    
                    const validMoves = getValidMoves(board, { row, col }, isHealMode || isPoisonMode);
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

            // Special case: poison attack in poison mode
            if (isPoisonMode && selectedPiece && selectedPiece.type === 'knight' && clickedPiece && clickedPiece.color !== currentPlayer) {
                // Check if this is a valid poison target
                const isValidPoisonTarget = state.validMoves.some(move => move.row === row && move.col === col);
                if (isValidPoisonTarget) {
                    get().performPoisonAttack(selectedSquare, { row, col });
                    return;
                }
            }

            // If clicking another piece of the same color, select it
            if (clickedPiece && clickedPiece.color === currentPlayer) {
                // In multiplayer, also validate against player role
                const multiplayerState = useMultiplayer.getState();
                if (state.gameMode === 'pvp' && multiplayerState.isInMultiplayerMode) {
                    if (clickedPiece.color !== multiplayerState.playerRole) {
                        console.log("Prevented selection of opponent's piece:", clickedPiece.color, "vs role:", multiplayerState.playerRole);
                        return; // Prevent selection of opponent's pieces
                    }
                }
                
                const validMoves = getValidMoves(board, { row, col }, isHealMode || isPoisonMode);
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
                    gamePhase: 'battle',
                    timerActive: false
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
                            validMoves: [],
                            timerActive: false
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

                // Process poison damage and cooldowns before switching turns
                get().processPoisonAndCooldowns();

                // Switch to next player (no checkmate check - victory only through king defeat)
                const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';

                set({
                    board: newBoard,
                    currentPlayer: nextPlayer,
                    selectedSquare: null,
                    validMoves: [],
                    moveHistory: [...state.moveHistory, moveNotation],
                    moveTimer: state.totalMoveTime,
                    timerActive: true
                });

                const multiplayerState = useMultiplayer.getState();
                if (
                    state.gameMode === 'pvp' &&
                    multiplayerState.isInMultiplayerMode &&
                    multiplayerState.playerRole // 'white' or 'black'
                ) {
                    // Only allow selecting/moving pieces that match the player's role
                    //  Console.WriteLine("Multiplayer move attempted");
                    //if (
                    //  (!selectedSquare && clickedPiece && clickedPiece.color !== multiplayerState.playerRole) ||
                    //  (selectedSquare && board[selectedSquare.row][selectedSquare.col]?.color !== multiplayerState.playerRole)
                    //) {
                    //  // Prevent selection or movement of opponent's pieces
                    //  return;
                    //}
                }

                if (state.gameMode === 'pvp' && useMultiplayer.getState().isInMultiplayerMode) {
                  const multiplayerState = useMultiplayer.getState();
                  const moveNumber =
                    multiplayerState.gameRoom?.moveCount !== undefined
                      ? multiplayerState.gameRoom.moveCount + 1
                      : 1;
                  const move = {
                    from: positionToString(selectedSquare),
                    to: positionToString({ row, col }),
                    piece: selectedPiece.type,
                    player: multiplayerState.playerRole,
                    moveNumber
                  };
                  useMultiplayer.getState().makeMove(move, newBoard);
                }
              }
            },
    
    resolveBattle: () => {
        const state = get();
        console.log("Resolving battle:", state.battleState);
      if (!state.battleState) return;
      
      const { battleState, board, currentPlayer } = state;
      const { attackerPosition, defenderPosition } = battleState;
      
      let newBoard = board.map(r => [...r]);
      
      if (battleState.result === 'attacker_wins') {
        // Attacker wins, move to defender's position
        newBoard[defenderPosition.row][defenderPosition.col] = battleState.attacker;
        newBoard[attackerPosition.row][attackerPosition.col] = null;
        // Mark piece as moved
        newBoard[defenderPosition.row][defenderPosition.col]!.hasMoved = true;
        
        // Award points for defeating the defender
        const pointsAwarded = PIECE_POINT_VALUES[battleState.defender.type];
        get().awardPoints(battleState.attacker.color, pointsAwarded, battleState.defender.type);
        
        // Check for pawn promotion after capturing (but not if a king was defeated)
        if (battleState.attacker.type === 'pawn' && battleState.defender.type !== 'king') {
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
        
        // Award points for defeating the attacker
        const pointsAwarded = PIECE_POINT_VALUES[battleState.attacker.type];
        get().awardPoints(battleState.defender.color, pointsAwarded, battleState.attacker.type);
        newBoard[defenderPosition.row][defenderPosition.col] = battleState.defender;
      } else {
        // Both survive, update health but stay in original positions
        newBoard[attackerPosition.row][attackerPosition.col] = battleState.attacker;
        newBoard[defenderPosition.row][defenderPosition.col] = battleState.defender;
      }
      
      // Award XP for victories and apply immediately to newBoard
      if (battleState.result === 'attacker_wins') {
        const xpAward = calculateXPAward(battleState.attacker.level, battleState.defender.level, battleState.defender.type);
        console.log(`Battle XP: ${battleState.attacker.type} (${battleState.attacker.id}) defeats ${battleState.defender.type} and gains ${xpAward} XP`);
        // Apply XP immediately to the newBoard so it's included in multiplayer sync
        newBoard = newBoard.map(row => row.map(piece => {
          if (!piece || piece.id !== battleState.attacker.id) return piece;
          
          let newPiece = { ...piece, xp: piece.xp + xpAward };
          let leveledUp = false;
          
          // Check for level ups
          while (newPiece.xp >= xpToNext(newPiece.level)) {
            newPiece.xp -= xpToNext(newPiece.level);
            newPiece.level++;
            newPiece.unspentPoints++;
            leveledUp = true;
          }
          
          // Queue level up modal if needed
          if (leveledUp) {
            setTimeout(() => {
              const currentState = get();
              if (!currentState.levelUpQueue.includes(battleState.attacker.id)) {
                set({ levelUpQueue: [...currentState.levelUpQueue, battleState.attacker.id] });
              }
            }, 0);
          }
          
          return newPiece;
        }));
      } else if (battleState.result === 'defender_wins') {
        const xpAward = calculateXPAward(battleState.defender.level, battleState.attacker.level, battleState.attacker.type);
        console.log(`Battle XP: ${battleState.defender.type} (${battleState.defender.id}) defeats ${battleState.attacker.type} and gains ${xpAward} XP`);
        // Apply XP immediately to the newBoard so it's included in multiplayer sync
        newBoard = newBoard.map(row => row.map(piece => {
          if (!piece || piece.id !== battleState.defender.id) return piece;
          
          let newPiece = { ...piece, xp: piece.xp + xpAward };
          let leveledUp = false;
          
          // Check for level ups
          while (newPiece.xp >= xpToNext(newPiece.level)) {
            newPiece.xp -= xpToNext(newPiece.level);
            newPiece.level++;
            newPiece.unspentPoints++;
            leveledUp = true;
          }
          
          // Queue level up modal if needed
          if (leveledUp) {
            setTimeout(() => {
              const currentState = get();
              if (!currentState.levelUpQueue.includes(battleState.defender.id)) {
                set({ levelUpQueue: [...currentState.levelUpQueue, battleState.defender.id] });
              }
            }, 0);
          }
          
          return newPiece;
        }));
      }
      
      const moveNotation = `${battleState.attacker.type} battles ${battleState.defender.type} - ${battleState.result.replace('_', ' ')}`;
      
      // Process poison damage and cooldowns before switching turns
      get().processPoisonAndCooldowns();
      
      // Check for immediate game end if a king was defeated in battle
      const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
      let winner = null;
      let phase: GamePhase = 'playing';
      
      // If a king was defeated in battle, end the game immediately
      if (battleState.result === 'attacker_wins' && battleState.defender.type === 'king') {
        winner = battleState.attacker.color as 'white' | 'black';
        phase = 'ended';
        console.log(`Game over! ${winner} wins by defeating the ${battleState.defender.color} king in battle!`);
      } else if (battleState.result === 'defender_wins' && battleState.attacker.type === 'king') {
        winner = battleState.defender.color as 'white' | 'black';
        phase = 'ended';
        console.log(`Game over! ${winner} wins by defeating the ${battleState.attacker.color} king in battle!`);
      } else {
        // Standard chess endgame checks if no king was defeated
        if (isCheckmate(newBoard, nextPlayer)) {
          winner = currentPlayer;
          phase = 'ended';
        } else if (isStalemate(newBoard, nextPlayer)) {
          phase = 'ended';
        }
      }
      
      set({ 
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedSquare: null,
        validMoves: [],
        battleState: null,
        gamePhase: phase,
        moveHistory: [...state.moveHistory, moveNotation],
        winner,
        moveTimer: state.totalMoveTime,
        timerActive: phase === 'playing'
      });
        // Multiplayer sync: emit move after battle
        const multiplayerState = useMultiplayer.getState();
        console.log("state: ", state.gameMode, multiplayerState.isInMultiplayerMode, multiplayerState.playerRole);
        
        if (
            state.gameMode === 'pvp' &&
            multiplayerState.isInMultiplayerMode &&
            multiplayerState.playerRole
        ) {
            console.log("Emitting multiplayer move after battle");
            const moveNumber =
                multiplayerState.gameRoom?.moveCount !== undefined
                    ? multiplayerState.gameRoom.moveCount + 1
                    : 1;
            // Use the battleState that was stored before setting it to null
            const move = {
                from: positionToString(battleState.attackerPosition),
                to: positionToString(battleState.defenderPosition),
                piece: battleState.attacker.type,
                player: multiplayerState.playerRole,
                moveNumber,
                battle: battleState // Send battle details
            };
            console.log("Multiplayer move data:", move.battle);
            console.log("New board state after battle:", newBoard);
            useMultiplayer.getState().makeMove(move, newBoard);
        }
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
    
    restartGame: () => {
      set({
        board: createInitialBoard(),
        currentPlayer: 'white',
        gamePhase: 'playing',
        winner: null,
        selectedSquare: null,
        validMoves: [],
        battleState: null,
        moveHistory: [],
        aiThinkingTime: 0,
        // Reset point tracking for new game
        gamePoints: {
          white: 0,
          black: 0
        },
        lastPointAward: null,
        moveTimer: 90,
        timerActive: true,
        totalMoveTime: 90
      });
      
      // Start the timer
      get().startTimer();
    },
    
    backToMenu: () => set({
      gameMode: null,
      gamePhase: 'ready',
      // Reset point tracking when returning to menu
      gamePoints: {
        white: 0,
        black: 0
      },
      lastPointAward: null,
      board: createInitialBoard(),
      currentPlayer: 'white',
      winner: null,
      selectedSquare: null,
      validMoves: [],
      battleState: null,
      moveHistory: [],
      aiThinkingTime: 0,
      levelUpQueue: [],
      activeLevelUpPieceId: null,
      moveTimer: 90,
      timerActive: false,
      totalMoveTime: 90
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
    
    // Automatic AI attribute allocation
    autoAllocateAIAttributes: (pieceId: string) => {
      const state = get();
      const piece = state.board.flat().find(p => p?.id === pieceId);
      if (!piece || piece.unspentPoints === 0) return;
      
      // AI allocation strategy based on piece type
      let allocation = { attack: 0, defense: 0, maxHealth: 0 };
      const totalPoints = piece.unspentPoints;
      
      switch (piece.type) {
        case 'pawn':
          // Pawns focus on balanced growth with slight attack preference
          allocation.attack = Math.ceil(totalPoints * 0.4);
          allocation.defense = Math.ceil(totalPoints * 0.3);
          allocation.maxHealth = totalPoints - allocation.attack - allocation.defense;
          break;
        case 'knight':
        case 'bishop':
          // Light pieces focus on attack and mobility (represented by health for survivability)
          allocation.attack = Math.ceil(totalPoints * 0.5);
          allocation.maxHealth = Math.ceil(totalPoints * 0.3);
          allocation.defense = totalPoints - allocation.attack - allocation.maxHealth;
          break;
        case 'rook':
          // Rooks focus on attack power
          allocation.attack = Math.ceil(totalPoints * 0.6);
          allocation.defense = Math.ceil(totalPoints * 0.2);
          allocation.maxHealth = totalPoints - allocation.attack - allocation.defense;
          break;
        case 'queen':
          // Queens get balanced allocation but favor attack
          allocation.attack = Math.ceil(totalPoints * 0.4);
          allocation.defense = Math.ceil(totalPoints * 0.3);
          allocation.maxHealth = totalPoints - allocation.attack - allocation.defense;
          break;
        case 'king':
          // Kings prioritize defense and health
          allocation.defense = Math.ceil(totalPoints * 0.4);
          allocation.maxHealth = Math.ceil(totalPoints * 0.4);
          allocation.attack = totalPoints - allocation.defense - allocation.maxHealth;
          break;
        default:
          // Fallback to balanced allocation
          const perStat = Math.floor(totalPoints / 3);
          allocation.attack = perStat;
          allocation.defense = perStat;
          allocation.maxHealth = totalPoints - allocation.attack - allocation.defense;
      }
      
      console.log(`AI auto-allocating for ${piece.type}: +${allocation.attack} attack, +${allocation.defense} defense, +${allocation.maxHealth} maxHealth`);
      
      // Apply the allocation
      get().allocateAttributes(pieceId, allocation);
    },

    setActiveLevelUpPiece: (pieceId: string | null) => set({ 
      activeLevelUpPieceId: pieceId,
      timerActive: pieceId === null && get().gamePhase === 'playing'
    }),
    
    // Heal system actions
    toggleHealMode: () => {
      set((state) => ({
        isHealMode: !state.isHealMode,
        selectedSquare: null,
        validMoves: [],
        selectedPieceForHeal: null,
        // Turn off poison mode when toggling heal mode
        isPoisonMode: false,
        selectedPieceForPoison: null
      }));
    },

    togglePoisonMode: () => {
      set((state) => ({
        isPoisonMode: !state.isPoisonMode,
        selectedSquare: null,
        validMoves: [],
        selectedPieceForPoison: null,
        // Turn off heal mode when toggling poison mode
        isHealMode: false,
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
      const healedPiece = {
        ...target,
        health: newHealth
      };
      
      // Remove poison effect when healed (if it exists)
      if (healedPiece.poisonStatus) {
        delete healedPiece.poisonStatus;
      }
      
      newBoard[targetPosition.row][targetPosition.col] = healedPiece;
      
      const moveNotation = `${bishop.type} heals ${target.type} for ${healAmount} HP`;
      const nextPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
      
      set({
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedSquare: null,
        validMoves: [],
        isHealMode: false,
        selectedPieceForHeal: null,
        moveHistory: [...state.moveHistory, moveNotation],
        moveTimer: state.totalMoveTime,
        timerActive: true
      });

      // CRITICAL FIX: Add multiplayer synchronization for healing moves
      if (state.gameMode === 'pvp' && useMultiplayer.getState().isInMultiplayerMode) {
        const multiplayerState = useMultiplayer.getState();
        const moveNumber = multiplayerState.gameRoom?.moveCount !== undefined 
          ? multiplayerState.gameRoom.moveCount + 1 
          : 1;
        const move = {
          from: positionToString(bishopPosition),
          to: positionToString(targetPosition),
          piece: bishop.type,
          player: multiplayerState.playerRole,
          moveNumber,
          heal: {
            healAmount,
            targetHealth: newHealth
          }
        };
        console.log('Syncing healing move to opponent:', move);
        useMultiplayer.getState().makeMove(move, newBoard);
      }
    },

    performPoisonAttack: (knightPosition: Position, targetPosition: Position) => {
      // TODO: Implement poison attack logic
      const state = get();
      const knight = state.board[knightPosition.row][knightPosition.col];
      const target = state.board[targetPosition.row][targetPosition.col];
      
      if (!knight || !target || knight.type !== 'knight' || knight.color === target.color) {
        return;
      }
      
      // Check if knight is on cooldown
      if (knight.poisonCooldown && knight.poisonCooldown > 0) {
        console.log('Knight is on poison cooldown');
        return;
      }
      
      // Calculate poison damage percentage (base 10% + 5% per knight level)
      const basePoisonDamage = 10;
      const levelBonus = (knight.level - 1) * 5;
      const poisonDamagePercentage = basePoisonDamage + levelBonus;
      
      const newBoard = state.board.map(row => [...row]);
      
      // Apply poison to target
      newBoard[targetPosition.row][targetPosition.col] = {
        ...target,
        poisonStatus: {
          turnsRemaining: 3,
          damagePercentage: poisonDamagePercentage,
          appliedBy: knight.id
        }
      };
      
      // Set knight on cooldown
      newBoard[knightPosition.row][knightPosition.col] = {
        ...knight,
        poisonCooldown: 3
      };
      
      const moveNotation = `${knight.type} poisons ${target.type}`;
      const nextPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
      
      set({
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedSquare: null,
        validMoves: [],
        isPoisonMode: false,
        selectedPieceForPoison: null,
        moveHistory: [...state.moveHistory, moveNotation],
        moveTimer: state.totalMoveTime,
        timerActive: true
      });
    },

    // Process poison damage and cooldowns during turn transitions
    processPoisonAndCooldowns: () => {
      const state = get();
      const newBoard = state.board.map(row => [...row]);
      let boardChanged = false;
      
      // Process each piece on the board
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = newBoard[row][col];
          if (!piece) continue;
          
          let pieceChanged = false;
          
          // Process poison damage
          if (piece.poisonStatus) {
            const poisonDamage = Math.floor(piece.health * (piece.poisonStatus.damagePercentage / 100));
            const newHealth = Math.max(1, piece.health - poisonDamage); // Poison can't kill
            
            console.log(`${piece.type} (${piece.color}) takes ${poisonDamage} poison damage (${piece.poisonStatus.damagePercentage}%). Health: ${piece.health} -> ${newHealth}`);
            
            newBoard[row][col] = {
              ...piece,
              health: newHealth,
              poisonStatus: {
                ...piece.poisonStatus,
                turnsRemaining: piece.poisonStatus.turnsRemaining - 1
              }
            };
            
            // Remove poison if duration expired
            if (piece.poisonStatus.turnsRemaining <= 1) {
              console.log(`Poison effect on ${piece.type} (${piece.color}) has expired`);
              delete newBoard[row][col]!.poisonStatus;
            }
            
            pieceChanged = true;
            boardChanged = true;
          }
          
          // Process poison cooldown reduction
          if (piece.poisonCooldown && piece.poisonCooldown > 0) {
            const newCooldown = piece.poisonCooldown - 1;
            
            // Ensure we're working with the updated piece (if poison was processed)
            if (!pieceChanged) {
              newBoard[row][col] = { ...piece };
            } else {
              // If piece was already modified for poison, update the current piece
              newBoard[row][col] = { ...newBoard[row][col]! };
            }
            
            console.log(`${piece.type} (${piece.color}) poison cooldown: ${piece.poisonCooldown} -> ${newCooldown}`);
            
            if (newCooldown > 0) {
              newBoard[row][col]!.poisonCooldown = newCooldown;
            } else {
              delete newBoard[row][col]!.poisonCooldown;
              console.log(`${piece.type} (${piece.color}) poison cooldown expired`);
            }
            
            pieceChanged = true;
            boardChanged = true;
          }
        }
      }
      
      // Update board if any changes were made
      if (boardChanged) {
        set({ board: newBoard });
      }
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
      
      // Switch to next player (no checkmate check - victory only through king defeat)
      const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
      
      set({
        board: newBoard,
        currentPlayer: nextPlayer,
        selectedSquare: null,
        validMoves: [],
        promotionPosition: null,
        promotingPiece: null,
        gamePhase: 'playing',
        moveHistory: [...state.moveHistory, moveNotation],
        moveTimer: state.totalMoveTime,
        timerActive: true
      });

      // Sync promotion with multiplayer opponent
      if (state.gameMode === 'pvp' && useMultiplayer.getState().isInMultiplayerMode) {
        const multiplayerState = useMultiplayer.getState();
        const moveNumber =
          multiplayerState.gameRoom?.moveCount !== undefined
            ? multiplayerState.gameRoom.moveCount + 1
            : 1;
        const move = {
          from: positionToString(promotionPosition),
          to: positionToString(promotionPosition), // Same position for promotion
          piece: pieceType, // The promoted piece type
          player: multiplayerState.playerRole,
          moveNumber,
          promotion: {
            pieceType,
            position: promotionPosition
          }
        };
        console.log("Emitting pawn promotion move:", move);
        useMultiplayer.getState().makeMove(move, newBoard);
      }
    },

    // Point tracking actions
    awardPoints: (player: 'white' | 'black', points: number, pieceType: string) => {
      set(state => ({
        gamePoints: {
          ...state.gamePoints,
          [player]: state.gamePoints[player] + points
        },
        lastPointAward: {
          player,
          points,
          pieceType
        }
      }));
      console.log(`${player} awarded ${points} points for defeating ${pieceType}. Total: ${get().gamePoints[player] + points}`);
    },

    updateGamePoints: (whitePoints: number, blackPoints: number) => {
      set({
        gamePoints: {
          white: whitePoints,
          black: blackPoints
        }
      });
      console.log(`Game points updated: white=${whitePoints}, black=${blackPoints}`);
    },

    // Timer actions
    startTimer: () => {
      set(state => ({ 
        timerActive: true,
        moveTimer: state.moveTimer > 0 ? state.moveTimer : state.totalMoveTime
      }));
    },

    pauseTimer: () => {
      set({ timerActive: false });
    },

    resetTimer: () => {
      set(state => ({ 
        moveTimer: state.totalMoveTime,
        timerActive: false 
      }));
    },

    tickTimer: () => {
      set(state => {
        if (!state.timerActive || state.moveTimer <= 0) return {};
        
        const newTimer = state.moveTimer - 1;
        if (newTimer <= 0) {
          // Timer expired - handle forfeited turn
          get().handleTimerExpire();
          return { moveTimer: 0, timerActive: false };
        }
        
        return { moveTimer: newTimer };
      });
    },

    handleTimerExpire: () => {
      const state = get();
      if (state.gamePhase !== 'playing') return;
      
      console.log(`Timer expired for ${state.currentPlayer}. Forfeiting turn.`);
      
      // Switch to next player and reset timer
      const nextPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
      set({ 
        currentPlayer: nextPlayer,
        selectedSquare: null,
        validMoves: [],
        moveTimer: state.totalMoveTime,
        timerActive: true,
        moveHistory: [...state.moveHistory, `${state.currentPlayer} forfeited turn (time expired)`]
      });
    }
  }))
);

function positionToString(pos: { row: number, col: number }): string {
  return String.fromCharCode(97 + pos.col) + (8 - pos.row);
}
