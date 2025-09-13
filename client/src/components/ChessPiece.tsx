import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ChessPiece as PieceType } from "../lib/stores/useChessGame";
import { useChessGame } from "../lib/stores/useChessGame";
import { getEffectiveStats, getMaxHealth, xpToNext } from "../lib/chess/pieceData";

interface ChessPieceProps {
  piece: PieceType;
  position: [number, number, number];
  row: number;
  col: number;
}

export default function ChessPiece({ piece, position, row, col }: ChessPieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { selectedSquare, currentPlayer, isHealMode, toggleHealMode } = useChessGame();
  
  const isSelected = Boolean(selectedSquare?.row === row && selectedSquare?.col === col);
  const isCurrentPlayerPiece = piece.color === currentPlayer;
  const canHeal = piece.type === 'bishop' && isCurrentPlayerPiece;
  
  // Calculate piece stats for overlay
  const effectiveStats = getEffectiveStats(piece);
  const maxHealth = getMaxHealth(piece);

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
  
  const handleHealToggle = (e: any) => {
    e.stopPropagation();
    toggleHealMode();
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
        raycast={() => null}
      >
        {piece.type.charAt(0).toUpperCase()}
      </Text>
      
      {/* Stats display when selected */}
      {isSelected && (
        <group 
          position={[0, 1.5, 0]} 
          rotation={[-Math.PI / 4, 0, 0]}
        >
          <mesh
            raycast={() => null}
          >
            <planeGeometry args={[2, 1.4]} />
            <meshStandardMaterial color="#000000" transparent opacity={0.8} />
          </mesh>
          <Text
            position={[0, 0.2, 0.01]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            raycast={() => null}
          >
            {`${piece.type.toUpperCase()}`}
          </Text>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            raycast={() => null}
          >
            {`HP: ${piece.health}/${maxHealth}`}
          </Text>
          <Text
            position={[0, -0.1, 0.01]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            raycast={() => null}
          >
            {`ATK: ${effectiveStats.attack} | DEF: ${effectiveStats.defense}`}
          </Text>
          <Text
            position={[0, -0.3, 0.01]}
            fontSize={0.12}
            color="#ffff80"
            anchorX="center"
            anchorY="middle"
            raycast={() => null}
          >
            {`Level ${piece.level} | XP: ${piece.xp}/${xpToNext(piece.level)}`}
          </Text>
          {piece.unspentPoints > 0 && (
            <Text
              position={[0, -0.5, 0.01]}
              fontSize={0.11}
              color="#80ff80"
              anchorX="center"
              anchorY="middle"
              raycast={() => null}
            >
              {`${piece.unspentPoints} unspent points!`}
            </Text>
          )}
          {canHeal && (
            <>
              <Text
                position={[0, -0.65, 0.01]}
                fontSize={0.1}
                color="#80ffff"
                anchorX="center"
                anchorY="middle"
                raycast={() => null}
              >
                {`[H] ${isHealMode ? 'HEAL MODE' : 'Heal ability available'}`}
              </Text>
              <mesh
                position={[0, -0.8, 0.01]}
                onClick={handleHealToggle}
              >
                <planeGeometry args={[1, 0.2]} />
                <meshStandardMaterial 
                  color={isHealMode ? "#00ff00" : "#0080ff"}
                  transparent 
                  opacity={0.7}
                />
              </mesh>
              <Text
                position={[0, -0.8, 0.02]}
                fontSize={0.08}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                onClick={handleHealToggle}
                raycast={() => null}
              >
                {isHealMode ? 'EXIT HEAL' : 'HEAL MODE'}
              </Text>
            </>
          )}
        </group>
      )}
    </group>
  );
}
