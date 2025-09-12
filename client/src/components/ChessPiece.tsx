import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ChessPiece as PieceType, Position } from "../lib/stores/useChessGame";
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
  const effectiveStats = getEffectiveStats(piece);
  const maxHealth = getMaxHealth(piece);
  const { handleSquareClick, selectedSquare, currentPlayer, isHealMode, toggleHealMode, hoveredSquare, setHoveredSquare } = useChessGame();

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
    if (groupRef.current) {
      const baseY = position[1];
      const hoverOffset = hoveredSquare && hoveredSquare.row === row && hoveredSquare.col === col ? 0.2 : 0;
      const selectOffset = isSelected ? 0.3 : 0;
      const targetY = baseY + Math.max(hoverOffset, selectOffset);

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

  // Get piece color with selection feedback
  let pieceColor = piece.color === 'white' ? '#ffffff' : '#333333';
  if (isSelected) {
    pieceColor = piece.color === 'white' ? '#ffff80' : '#8080ff'; // Brighter when selected
  } else if (hoveredSquare && hoveredSquare.row === row && hoveredSquare.col === col && isCurrentPlayerPiece) {
    pieceColor = piece.color === 'white' ? '#f0f0f0' : '#505050'; // Slightly highlighted when hoverable
  }

  // Get piece model and collider
  const getPieceModel = () => {
    const modelPath = `/models/${piece.type}.glb`;
    const { scene } = useGLTF(modelPath);

    // Clone the scene to avoid sharing materials between instances
    const clonedScene = scene.clone();

    // Scale the model appropriately
    let scale = 2.0; // Default scale for most pieces
    let yOffset = 0;
    if (piece.type === "knight") {
      scale = 1.5; // 25% smaller
      yOffset = (1.6 * scale) / 2 - (1.6 / 2); // Adjust for reduced height
    }
    clonedScene.scale.set(scale, scale, scale);

    // Apply piece color to all materials and disable raycasting on child meshes
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.raycast = () => null;
        if (mesh.material) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: pieceColor,
            metalness: 0.1,
            roughness: 0.7,
          });
        }
      }
    });

    // Wrap in a group to apply yOffset only for knights
    return (
      <group position={[0, yOffset, 0]}>
        <primitive object={clonedScene} />
      </group>
    );
  };

  // Create invisible collider for stable hover detection
  const getCollider = () => {
    // Different collider sizes based on piece type
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
        onPointerEnter={() => setHoveredSquare({ row, col })}
        onPointerLeave={() => setHoveredSquare(null)}
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

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Invisible collider for stable hover detection */}
        {getCollider()}
        {/* Visual model (no interaction) */}
        {getPieceModel()}
      </group>

      {/* Stats display when hovered */}
      {hoveredSquare && hoveredSquare.row === row && hoveredSquare.col === col && (
        <group
          position={[0, 2.5, 0]} // Move overlay above the piece
          rotation={[-Math.PI / 4, 0, 0]}
        >
          <mesh raycast={() => null} renderOrder={999}>
            <planeGeometry args={[2, 1.4]} />
            <meshStandardMaterial color="#000000" transparent opacity={0.8} depthTest={false} />
          </mesh>
          <Text
            position={[0, 0.2, 0.01]}
            fontSize={0.15}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            raycast={() => null}
            renderOrder={1000}
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
            renderOrder={1000}
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
            renderOrder={1000}
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
            renderOrder={1000}
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
              renderOrder={1000}
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
                renderOrder={1000}
              >
                {`[H] ${isHealMode ? 'HEAL MODE' : 'Heal ability available'}`}
              </Text>
              <mesh
                position={[0, -0.8, 0.01]}
                onClick={handleHealToggle}
                onPointerEnter={(e) => { e.stopPropagation(); setHoveredSquare({ row, col }); }}
                onPointerLeave={(e) => { e.stopPropagation(); setHoveredSquare(null); }}
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
                onPointerEnter={(e) => { e.stopPropagation(); setHoveredSquare({ row, col }); }}
                onPointerLeave={(e) => { e.stopPropagation(); setHoveredSquare(null); }}
                raycast={() => null}
                renderOrder={1000}
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
