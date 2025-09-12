import { ChessPiece, Position } from "../stores/useChessGame";
import { getValidMoves, isInCheck } from "./chessLogic";
import { getPieceStats } from "./pieceData";

interface Move {
  from: Position;
  to: Position;
  score: number;
  captureValue?: number;
}

export function makeAIMove(board: (ChessPiece | null)[][], difficulty: 'easy' | 'medium' | 'hard'): { from: Position; to: Position } | null {
  const aiColor = 'black';
  const possibleMoves = getAllPossibleMoves(board, aiColor);
  
  if (possibleMoves.length === 0) return null;
  
  switch (difficulty) {
    case 'easy':
      return makeRandomMove(possibleMoves);
    case 'medium':
      return makeBasicStrategyMove(board, possibleMoves, aiColor);
    case 'hard':
      return makeAdvancedMove(board, possibleMoves, aiColor);
    default:
      return makeRandomMove(possibleMoves);
  }
}

function getAllPossibleMoves(board: (ChessPiece | null)[][], color: 'white' | 'black'): Move[] {
  const moves: Move[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const validMoves = getValidMoves(board, { row, col });
        validMoves.forEach(to => {
          const captureValue = board[to.row][to.col] ? getPieceValue(board[to.row][to.col]!.type) : 0;
          moves.push({
            from: { row, col },
            to,
            score: 0,
            captureValue
          });
        });
      }
    }
  }
  
  return moves;
}

function makeRandomMove(moves: Move[]): { from: Position; to: Position } {
  const randomIndex = Math.floor(Math.random() * moves.length);
  const move = moves[randomIndex];
  return { from: move.from, to: move.to };
}

function makeBasicStrategyMove(board: (ChessPiece | null)[][], moves: Move[], aiColor: 'white' | 'black'): { from: Position; to: Position } {
  // Score moves based on basic strategy
  const scoredMoves = moves.map(move => {
    let score = 0;
    
    // Prioritize captures
    if (move.captureValue && move.captureValue > 0) {
      score += move.captureValue * 10;
    }
    
    // Avoid moves that put king in check
    const testBoard = simulateMove(board, move);
    if (isInCheck(testBoard, aiColor)) {
      score -= 1000;
    }
    
    // Prefer center control
    const centerDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
    score += (7 - centerDistance) * 2;
    
    // Random factor for unpredictability
    score += Math.random() * 5;
    
    return { ...move, score };
  });
  
  // Sort by score and pick the best
  scoredMoves.sort((a, b) => b.score - a.score);
  const bestMove = scoredMoves[0];
  
  return { from: bestMove.from, to: bestMove.to };
}

function makeAdvancedMove(board: (ChessPiece | null)[][], moves: Move[], aiColor: 'white' | 'black'): { from: Position; to: Position } {
  // Advanced strategy with deeper analysis
  const scoredMoves = moves.map(move => {
    let score = 0;
    
    // Simulate the move
    const testBoard = simulateMove(board, move);
    
    // Avoid illegal moves
    if (isInCheck(testBoard, aiColor)) {
      score -= 10000;
      return { ...move, score };
    }
    
    // High value for captures
    if (move.captureValue && move.captureValue > 0) {
      score += move.captureValue * 15;
    }
    
    // Piece development (move pieces from starting positions)
    const piece = board[move.from.row][move.from.col];
    if (piece && !piece.hasMoved) {
      score += 5;
    }
    
    // King safety
    const opponentColor = aiColor === 'white' ? 'black' : 'white';
    if (isInCheck(testBoard, opponentColor)) {
      score += 50; // Putting opponent in check is valuable
    }
    
    // Control center squares
    const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
    if (centerSquares.some(([r, c]) => r === move.to.row && c === move.to.col)) {
      score += 10;
    }
    
    // Piece coordination (pieces supporting each other)
    score += countSupportingPieces(testBoard, move.to, aiColor) * 3;
    
    // Tactical patterns
    score += evaluatePosition(testBoard, aiColor);
    
    // Small random factor
    score += Math.random() * 2;
    
    return { ...move, score };
  });
  
  // Sort by score and pick the best
  scoredMoves.sort((a, b) => b.score - a.score);
  const bestMove = scoredMoves[0];
  
  return { from: bestMove.from, to: bestMove.to };
}

function simulateMove(board: (ChessPiece | null)[][], move: Move): (ChessPiece | null)[][] {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[move.from.row][move.from.col];
  
  if (piece) {
    newBoard[move.to.row][move.to.col] = { ...piece, hasMoved: true };
    newBoard[move.from.row][move.from.col] = null;
  }
  
  return newBoard;
}

function getPieceValue(type: ChessPiece['type']): number {
  const values = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 100
  };
  return values[type];
}

function countSupportingPieces(board: (ChessPiece | null)[][], position: Position, color: 'white' | 'black'): number {
  let count = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color && !(row === position.row && col === position.col)) {
        const moves = getValidMoves(board, { row, col });
        if (moves.some(move => move.row === position.row && move.col === position.col)) {
          count++;
        }
      }
    }
  }
  
  return count;
}

function evaluatePosition(board: (ChessPiece | null)[][], color: 'white' | 'black'): number {
  let score = 0;
  
  // Material count
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = getPieceValue(piece.type);
        if (piece.color === color) {
          score += value;
        } else {
          score -= value;
        }
      }
    }
  }
  
  return score;
}
