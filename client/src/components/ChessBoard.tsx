import { useRef, useState } from "react";
import { useTexture, Text } from "@react-three/drei";
import * as THREE from "three";
import ChessPiece from "./ChessPiece";
import { useChessGame } from "../lib/stores/useChessGame";

export default function ChessBoard() {
  const boardRef = useRef<THREE.Group>(null);
  const woodTexture = useTexture("/textures/wood.jpg");
  const { board, selectedSquare, validMoves, handleSquareClick, isHealMode } = useChessGame();

  // Track hovered square
  const [hoveredSquare, setHoveredSquare] = useState<{ row: number; col: number } | null>(null);

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
      
      // Check if this is a heal target (occupied square with friendly piece when in heal mode)
      const isHealTarget = isValidMove && isHealMode && piece && selectedSquare && 
        board[selectedSquare.row][selectedSquare.col] &&
        board[selectedSquare.row][selectedSquare.col]?.type === 'bishop' &&
        piece.color === board[selectedSquare.row][selectedSquare.col]?.color;
      
      let color = isLight ? '#f0d9b5' : '#b58863';
      if (isSelected) color = '#7fb069';
      if (isValidMove) {
        if (isHealTarget) {
          color = '#40e0d0'; // Turquoise for heal targets
        } else {
          color = '#90ee90'; // Light green for normal moves
        }
      }
      // Highlight on hover (only if not already selected or a valid move)
      const isHovered = hoveredSquare && hoveredSquare.row === row && hoveredSquare.col === col;
      let highlightOpacity = 0;
      if (isHovered && !isSelected && !isValidMove) {
        // Lighter for dark, brighter yellow for light
        color = isLight ? "#ffe066" : "#e2b97f"; // #ffe066 is a bright yellow
        highlightOpacity = 0.7;
      }

      // Always allow clicking on squares - either to select pieces or make moves
      const handleSquareClickWrapper = () => {
        handleSquareClick(row, col);
      };

      squares.push(
        <mesh
          key={`${row}-${col}`}
          position={[(col - 3.5) * 1.5, 0, (row - 3.5) * 1.5]}
          receiveShadow
          onClick={handleSquareClickWrapper}
          onPointerOver={() => setHoveredSquare({ row, col })}
          onPointerOut={() => setHoveredSquare(null)}
        >
          <boxGeometry args={[1.4, 0.1, 1.4]} />
          <meshStandardMaterial 
            color={color}
            map={isLight ? woodTexture : null}
            transparent={!!(isValidMove || isHovered)}
            opacity={isValidMove ? 0.9 : isHovered ? highlightOpacity : 1}
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
            position={[(col - 3.5) * 1.5, 0.30, (row - 3.5) * 1.5]}
            row={row}
            col={col}
          />
        );
      }
    }
  }

  return (
    <group ref={boardRef} position={[0, 0, 0]}>
      {/* Board border frame */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[13, 0.1, 13]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      
      {/* Board base */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[12, 0.3, 12]} />
        <meshStandardMaterial color="#8B4513" map={woodTexture} />
      </mesh>
      
      {/* Board squares */}
      {squares}
      
      {/* Chess pieces */}
      {pieces}
    </group>
  );
}
