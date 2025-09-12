import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ChessPiece as PieceType } from "../lib/stores/useChessGame";
import { getPieceStats, getEffectiveStats, getMaxHealth, xpToNext, getPieceAbilities } from "../lib/chess/pieceData";
import { useChessGame } from "../lib/stores/useChessGame";

interface ChessPieceProps {
  piece: PieceType;
  position: [number, number, number];
  row: number;
  col: number;
}

export default function ChessPiece({ piece, position, row, col }: ChessPieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const effectiveStats = getEffectiveStats(piece);
  const maxHealth = getMaxHealth(piece);
  const { handleSquareClick, selectedSquare, currentPlayer, isHealMode, toggleHealMode } = useChessGame();

  const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;

  // Selection and hover animation
  useFrame(() => {
    if (groupRef.current) {
      const baseY = position[1];
      const selectOffset = isSelected ? 0.3 : 0;
      const hoverOffset = hovered ? 0.15 : 0;
      const targetY = baseY + selectOffset + hoverOffset;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        0.1
      );
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    handleSquareClick(row, col);
  };

  // Get piece color with selection and hover feedback
  let pieceColor = piece.color === 'white' ? '#ffffff' : '#333333';
  if (isSelected) {
    pieceColor = piece.color === 'white' ? '#ffff80' : '#8080ff';
  } else if (hovered) {
    pieceColor = piece.color === 'white' ? '#e0e0ff' : '#5050ff'; // Highlight on hover
  }

  // Get piece model and collider
  const getPieceModel = () => {
    const modelPath = `/models/${piece.type}.glb`;
    const { scene } = useGLTF(modelPath);
    const clonedScene = scene.clone();
    const scale = 2.5;
    clonedScene.scale.set(scale, scale, scale);
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.raycast = () => null;
        if (mesh.material) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: pieceColor,
            metalness: 0.1,
            roughness: 0.7
          });
        }
      }
    });
    return <primitive object={clonedScene} />;
  };

  // Invisible collider for selection and hover
  const getCollider = () => {
    const colliderSizes = {
      pawn: [0.8, 1.2, 0.8],
      rook: [1.0, 1.4, 1.0],
      knight: [1.0, 1.6, 1.0],
      bishop: [0.9, 1.8, 0.9],
      queen: [1.1, 1.9, 1.1],
      king: [1.2, 2.0, 1.2]
    };
    const size = colliderSizes[piece.type] || [1.0, 1.5, 1.0];
    return (
      <mesh
        position={[0, size[1] / 2, 0]}
        onClick={handleClick}
      >
        <boxGeometry args={size as [number, number, number]} />
        <meshBasicMaterial
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    );
  };

  // Optional: highlight outline on hover
  const getOutline = () => {
    if (!hovered || isSelected) return null;
    const colliderSizes = {
      pawn: [0.9, 1.3, 0.9],
      rook: [1.1, 1.5, 1.1],
      knight: [1.1, 1.7, 1.1],
      bishop: [1.0, 1.9, 1.0],
      queen: [1.2, 2.0, 1.2],
      king: [1.3, 2.1, 1.3]
    };
    const size = colliderSizes[piece.type] || [1.1, 1.6, 1.1];
    return (
      <mesh position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size as [number, number, number]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.5} />
      </mesh>
    );
  };

  return (
    <group position={position}>
      <group ref={groupRef}>
        {getCollider()}
        {getOutline()}
        {getPieceModel()}
      </group>

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
    </group>
  );
}
