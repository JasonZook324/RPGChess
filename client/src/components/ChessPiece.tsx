import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ChessPiece as PieceType } from "../lib/stores/useChessGame";
import { useChessGame } from "../lib/stores/useChessGame";

interface ChessPieceProps {
  piece: PieceType;
  position: [number, number, number];
  row: number;
  col: number;
}

export default function ChessPiece({ piece, position, row, col }: ChessPieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { selectedSquare } = useChessGame();
  
  const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;

  // Selection animation only
  useFrame((state) => {
    if (groupRef.current) {
      const baseY = position[1];
      const selectOffset = isSelected ? 0.3 : 0;
      const targetY = baseY + selectOffset;
      
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        0.1
      );
    }
  });


  // Get piece color with selection feedback
  let pieceColor = piece.color === 'white' ? '#ffffff' : '#333333';
  if (isSelected) {
    pieceColor = piece.color === 'white' ? '#ffff80' : '#8080ff'; // Brighter when selected
  }
  
  // Get piece model
  const getPieceModel = () => {
    const modelPath = `/models/${piece.type}.glb`;
    const { scene } = useGLTF(modelPath);
    
    // Clone the scene to avoid sharing materials between instances
    const clonedScene = scene.clone();
    
    // Scale the model smaller for better selection on larger spaced board
    const scale = 0.8; // Smaller scale for better piece selection
    clonedScene.scale.set(scale, scale, scale);
    
    // Apply piece color to all materials and disable raycasting on child meshes
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Disable raycasting on all child meshes to prevent hover conflicts
        mesh.raycast = () => null;
        if (mesh.material) {
          // Create a new material with the piece color
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


  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Visual model (no interaction) */}
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
