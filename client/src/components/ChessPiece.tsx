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
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const effectiveStats = getEffectiveStats(piece);
  const maxHealth = getMaxHealth(piece);
  const { handleSquareClick, selectedSquare, currentPlayer, isHealMode, toggleHealMode } = useChessGame();
  
  const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
  const isCurrentPlayerPiece = piece.color === currentPlayer;
  const abilities = getPieceAbilities(piece.type);
  const canHeal = piece.type === 'bishop' && abilities.some(ability => ability.name === 'Heal');
  
  const handleHealToggle = (e: any) => {
    e.stopPropagation();
    toggleHealMode();
  };

  // Hover and selection animation
  useFrame((state) => {
    if (meshRef.current) {
      const baseY = position[1];
      const hoverOffset = hovered ? 0.2 : 0;
      const selectOffset = isSelected ? 0.3 : 0;
      const targetY = baseY + Math.max(hoverOffset, selectOffset);
      
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        0.1
      );
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    handleSquareClick(row, col);
  };

  // Get piece color with selection feedback
  let pieceColor = piece.color === 'white' ? '#ffffff' : '#333333';
  if (isSelected) {
    pieceColor = piece.color === 'white' ? '#ffff80' : '#8080ff'; // Brighter when selected
  } else if (hovered && isCurrentPlayerPiece) {
    pieceColor = piece.color === 'white' ? '#f0f0f0' : '#505050'; // Slightly highlighted when hoverable
  }
  
  // Get piece model based on type
  const getPieceModel = () => {
    const modelPath = `/models/${piece.type}.glb`;
    const { scene } = useGLTF(modelPath);
    
    // Clone the scene to avoid sharing materials between instances
    const clonedScene = scene.clone();
    
    // Scale the model appropriately (generated models might need scaling)
    const scale = 2.5; // Scale up as recommended in guidelines
    clonedScene.scale.set(scale, scale, scale);
    
    // Apply piece color to all materials in the model
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
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
      <group
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={handleClick}
      >
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
      
      {/* Stats display when hovered */}
      {hovered && (
        <group 
          position={[0, 1.5, 0]} 
          rotation={[-Math.PI / 4, 0, 0]}
          onPointerEnter={(e) => e.stopPropagation()}
          onPointerLeave={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
        >
          <mesh>
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
          {canHeal && isCurrentPlayerPiece && (
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
