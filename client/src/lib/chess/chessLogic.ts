import { ChessPiece, Position } from "../stores/useChessGame";

export function getValidMoves(board: (ChessPiece | null)[][], position: Position): Position[] {
  const piece = board[position.row][position.col];
  if (!piece) return [];

  switch (piece.type) {
    case 'pawn':
      return getPawnMoves(board, position, piece.color);
    case 'rook':
      return getRookMoves(board, position, piece.color);
    case 'knight':
      return getKnightMoves(board, position, piece.color);
    case 'bishop':
      return getBishopMoves(board, position, piece.color);
    case 'queen':
      return getQueenMoves(board, position, piece.color);
    case 'king':
      return getKingMoves(board, position, piece.color);
    default:
      return [];
  }
}

function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function getPawnMoves(board: (ChessPiece | null)[][], position: Position, color: 'white' | 'black'): Position[] {
  const moves: Position[] = [];
  const { row, col } = position;
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;

  // Move forward one square
  if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
    moves.push({ row: row + direction, col });

    // Move forward two squares from starting position
    if (row === startRow && !board[row + 2 * direction][col]) {
      moves.push({ row: row + 2 * direction, col });
    }
  }

  // Capture diagonally
  const capturePositions = [
    { row: row + direction, col: col - 1 },
    { row: row + direction, col: col + 1 }
  ];

  capturePositions.forEach(pos => {
    if (isValidPosition(pos.row, pos.col)) {
      const targetPiece = board[pos.row][pos.col];
      if (targetPiece && targetPiece.color !== color) {
        moves.push(pos);
      }
    }
  });

  return moves;
}

function getRookMoves(board: (ChessPiece | null)[][], position: Position, color: 'white' | 'black'): Position[] {
  const moves: Position[] = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  directions.forEach(([dRow, dCol]) => {
    for (let i = 1; i < 8; i++) {
      const newRow = position.row + i * dRow;
      const newCol = position.col + i * dCol;

      if (!isValidPosition(newRow, newCol)) break;

      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (targetPiece.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
    }
  });

  return moves;
}

function getKnightMoves(board: (ChessPiece | null)[][], position: Position, color: 'white' | 'black'): Position[] {
  const moves: Position[] = [];
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];

  knightMoves.forEach(([dRow, dCol]) => {
    const newRow = position.row + dRow;
    const newCol = position.col + dCol;

    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  });

  return moves;
}

function getBishopMoves(board: (ChessPiece | null)[][], position: Position, color: 'white' | 'black'): Position[] {
  const moves: Position[] = [];
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  directions.forEach(([dRow, dCol]) => {
    for (let i = 1; i < 8; i++) {
      const newRow = position.row + i * dRow;
      const newCol = position.col + i * dCol;

      if (!isValidPosition(newRow, newCol)) break;

      const targetPiece = board[newRow][newCol];
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol });
      } else {
        if (targetPiece.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
        break;
      }
    }
  });

  return moves;
}

function getQueenMoves(board: (ChessPiece | null)[][], position: Position, color: 'white' | 'black'): Position[] {
  return [...getRookMoves(board, position, color), ...getBishopMoves(board, position, color)];
}

function getKingMoves(board: (ChessPiece | null)[][], position: Position, color: 'white' | 'black'): Position[] {
  const moves: Position[] = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  directions.forEach(([dRow, dCol]) => {
    const newRow = position.row + dRow;
    const newCol = position.col + dCol;

    if (isValidPosition(newRow, newCol)) {
      const targetPiece = board[newRow][newCol];
      if (!targetPiece || targetPiece.color !== color) {
        moves.push({ row: newRow, col: newCol });
      }
    }
  });

  return moves;
}

export function findKing(board: (ChessPiece | null)[][], color: 'white' | 'black'): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

export function isInCheck(board: (ChessPiece | null)[][], color: 'white' | 'black'): boolean {
  const kingPosition = findKing(board, color);
  if (!kingPosition) return false;

  const opponentColor = color === 'white' ? 'black' : 'white';
  
  // Check if any opponent piece can attack the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor) {
        const moves = getValidMoves(board, { row, col });
        if (moves.some(move => move.row === kingPosition.row && move.col === kingPosition.col)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

export function isCheckmate(board: (ChessPiece | null)[][], color: 'white' | 'black'): boolean {
  if (!isInCheck(board, color)) return false;
  
  // Try all possible moves to see if any can get out of check
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getValidMoves(board, { row, col });
        for (const move of moves) {
          // Simulate the move
          const newBoard = board.map(r => [...r]);
          newBoard[move.row][move.col] = piece;
          newBoard[row][col] = null;
          
          if (!isInCheck(newBoard, color)) {
            return false; // Found a move that gets out of check
          }
        }
      }
    }
  }
  
  return true; // No moves can get out of check
}

export function isStalemate(board: (ChessPiece | null)[][], color: 'white' | 'black'): boolean {
  if (isInCheck(board, color)) return false; // Can't be stalemate if in check
  
  // Check if there are any valid moves
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const moves = getValidMoves(board, { row, col });
        if (moves.length > 0) {
          return false; // Found a valid move
        }
      }
    }
  }
  
  return true; // No valid moves available
}
