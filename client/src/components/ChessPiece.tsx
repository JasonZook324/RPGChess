import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ChessPiece as PieceType } from "../lib/stores/useChessGame";
import { getPieceStats } from "../lib/chess/pieceData";

interface ChessPieceProps {
  piece: PieceType;
  position: [number, number, number];
  row: number;
  col: number;
}

export default function ChessPiece({ piece, position, row, col }: ChessPieceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const stats = getPieceStats(piece.type);

  // Hover animation
  useFrame((state) => {
    if (meshRef.current) {
      const targetY = hovered ? position[1] + 0.2 : position[1];
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        0.1
      );
    }
  });

  // Get piece color
  const pieceColor = piece.color === 'white' ? '#ffffff' : '#333333';
  
  // Get piece shape based on type
  const getPieceGeometry = () => {
    switch (piece.type) {
      case 'pawn':
        return <sphereGeometry args={[0.25, 8, 6]} />;
      case 'rook':
        return <boxGeometry args={[0.4, 0.6, 0.4]} />;
      case 'knight':
        return <coneGeometry args={[0.3, 0.8, 4]} />;
      case 'bishop':
        return <coneGeometry args={[0.3, 0.9, 8]} />;
      case 'queen':
        return <octahedronGeometry args={[0.35]} />;
      case 'king':
        return <cylinderGeometry args={[0.35, 0.35, 0.8, 8]} />;
      default:
        return <sphereGeometry args={[0.25, 8, 6]} />;
    }
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {getPieceGeometry()}
        <meshStandardMaterial 
          color={pieceColor}
          metalness={0.1}
          roughness={0.7}
        />
      </mesh>
      
      {/* Piece symbol */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.3}
        color={piece.color === 'white' ? '#000000' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {piece.type.charAt(0).toUpperCase()}
      </Text>
      
      {/* Stats display when hovered */}
      {hovered && (
        <group position={[0, 1.5, 0]} rotation={[-Math.PI / 4, 0, 0]}>
          <mesh>
            <planeGeometry args={[2, 1]} />
            <meshStandardMaterial color="#000000" transparent opacity={0.8} />
          </mesh>
          <Text
            position={[0, 0.2, 0.01]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {`${piece.type.toUpperCase()}`}
          </Text>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {`HP: ${piece.health}/${stats.maxHealth}`}
          </Text>
          <Text
            position={[0, -0.2, 0.01]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {`ATK: ${stats.attack} | DEF: ${stats.defense}`}
          </Text>
        </group>
      )}
    </group>
  );
}
