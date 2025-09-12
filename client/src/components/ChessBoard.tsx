import { useRef } from "react";
import { useTexture, Text } from "@react-three/drei";
import * as THREE from "three";
import ChessPiece from "./ChessPiece";
import { useChessGame } from "../lib/stores/useChessGame";

export default function ChessBoard() {
  const boardRef = useRef<THREE.Group>(null);
  const woodTexture = useTexture("/textures/wood.jpg");
  const { board, selectedSquare, validMoves, handleSquareClick } = useChessGame();

  // Configure wood texture
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(4, 4);

  // Create board squares
  const squares = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
      const isValidMove = validMoves.some(move => move.row === row && move.col === col);
      const piece = board[row][col];
      
      let color = isLight ? '#f0d9b5' : '#b58863';
      if (isSelected) color = '#7fb069';
      if (isValidMove) color = '#90ee90';

      // Only allow clicking on empty squares or valid moves
      const handleSquareClickWrapper = () => {
        if (!piece || isValidMove) {
          handleSquareClick(row, col);
        }
      };

      squares.push(
        <mesh
          key={`${row}-${col}`}
          position={[col - 3.5, 0, row - 3.5]}
          receiveShadow
          onClick={handleSquareClickWrapper}
        >
          <boxGeometry args={[1, 0.1, 1]} />
          <meshStandardMaterial 
            color={color}
            map={isLight ? woodTexture : null}
            transparent={isValidMove}
            opacity={isValidMove ? 0.9 : 1}
          />
        </mesh>
      );
    }
  }

  // Create chess pieces
  const pieces = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        pieces.push(
          <ChessPiece
            key={`${row}-${col}-${piece.type}-${piece.color}`}
            piece={piece}
            position={[col - 3.5, 0.05, row - 3.5]}
            row={row}
            col={col}
          />
        );
      }
    }
  }

  return (
    <group ref={boardRef} position={[0, 0, 0]}>
      {/* Board base */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[10, 0.3, 10]} />
        <meshStandardMaterial color="#8B4513" map={woodTexture} />
      </mesh>
      
      {/* Board squares */}
      {squares}
      
      {/* Chess pieces */}
      {pieces}
    </group>
  );
}
