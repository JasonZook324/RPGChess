import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useGLTF, Html } from "@react-three/drei";
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
  const [showInfo, setShowInfo] = useState(false);
  
  const isSelected = Boolean(selectedSquare?.row === row && selectedSquare?.col === col);
  const isCurrentPlayerPiece = piece.color === currentPlayer;
  const canHeal = piece.type === 'bishop' && isCurrentPlayerPiece;
  
  // Load model at top level
  const modelPath = `/models/${piece.type}.glb`;
  const { scene } = useGLTF(modelPath);
  
  // Calculate piece stats
  const effectiveStats = getEffectiveStats(piece);
  const maxHealth = getMaxHealth(piece);
  const healthPercentage = piece.health / maxHealth;

  // Selection animation only
  useFrame((state) => {
    if (groupRef.current) {
      const selectOffset = isSelected ? 0.3 : 0;
      
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        selectOffset,
        0.1
      );
    }
  });

  // Get piece color with selection feedback and create model
  let pieceColor = piece.color === 'white' ? '#ffffff' : '#333333';
  if (isSelected) {
    pieceColor = piece.color === 'white' ? '#ffff80' : '#8080ff'; // Brighter when selected
  }
  
  // Memoized piece model and bottom UI position
  const { pieceModel, bottomUIY } = useMemo(() => {
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
    
    // Calculate bottom UI position based on model height
    const box = new THREE.Box3().setFromObject(clonedScene);
    const modelBottom = box.min.y;
    const uiY = Math.max(modelBottom + 0.05, 0.05); // Place UI above model base with clearance
    
    return { pieceModel: clonedScene, bottomUIY: uiY };
  }, [scene, pieceColor]);
  
  const handleHealToggle = (e: any) => {
    e.stopPropagation();
    toggleHealMode();
  };

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Visual model (no interaction) */}
        <primitive object={pieceModel} />
        
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
        
        {/* HP Bar */}
        <group position={[0, bottomUIY, 0]} rotation={[-Math.PI / 4, 0, 0]}>
          {/* Background bar */}
          <mesh position={[0, 0, 0]} raycast={() => null}>
            <planeGeometry args={[0.8, 0.1]} />
            <meshBasicMaterial color="#333333" transparent opacity={0.8} />
          </mesh>
          {/* Health bar */}
          <mesh position={[-0.4 + (0.8 * healthPercentage / 2), 0, 0.01]} raycast={() => null}>
            <planeGeometry args={[0.8 * healthPercentage, 0.08]} />
            <meshBasicMaterial 
              color={healthPercentage > 0.6 ? "#00ff00" : healthPercentage > 0.3 ? "#ffff00" : "#ff0000"} 
              transparent 
              opacity={0.9} 
            />
          </mesh>
          {/* HP Text */}
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.06}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            raycast={() => null}
          >
            {`${piece.health}/${maxHealth}`}
          </Text>
        </group>
        
        {/* Info Button */}
        <group position={[0.5, bottomUIY, 0]} rotation={[-Math.PI / 4, 0, 0]}>
          <mesh 
            onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
          >
            <circleGeometry args={[0.1]} />
            <meshBasicMaterial color="#0066cc" transparent opacity={0.8} />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.08}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
            raycast={() => null}
          >
            i
          </Text>
        </group>
        
        {/* Heal Button for Bishops */}
        {canHeal && (
          <group position={[-0.5, bottomUIY, 0]} rotation={[-Math.PI / 4, 0, 0]}>
            <mesh 
              onClick={handleHealToggle}
            >
              <circleGeometry args={[0.1]} />
              <meshBasicMaterial color={isHealMode ? "#00ff00" : "#ff6600"} transparent opacity={0.8} />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.07}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              onClick={handleHealToggle}
              raycast={() => null}
            >
              H
            </Text>
          </group>
        )}
        
        {/* Level Up Indicator */}
        {piece.unspentPoints > 0 && (
          <group position={[0, 1.0, 0]}>
            <mesh raycast={() => null}>
              <circleGeometry args={[0.08]} />
              <meshBasicMaterial color="#ffff00" />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.06}
              color="#000000"
              anchorX="center"
              anchorY="middle"
              raycast={() => null}
            >
              !
            </Text>
          </group>
        )}
        
        {/* Info Panel */}
        {showInfo && (
          <Html
            position={[0, 1.5, 0]}
            center
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              minWidth: '160px',
              textAlign: 'center',
              border: '1px solid #444',
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ffff80' }}>
                {piece.type.toUpperCase()}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>HP:</strong> {piece.health}/{maxHealth}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>ATK:</strong> {effectiveStats.attack} | <strong>DEF:</strong> {effectiveStats.defense}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Level:</strong> {piece.level} | <strong>XP:</strong> {piece.xp}/{xpToNext(piece.level)}
              </div>
              {piece.unspentPoints > 0 && (
                <div style={{ color: '#80ff80', marginBottom: '8px', fontWeight: 'bold' }}>
                  {piece.unspentPoints} unspent points available!
                </div>
              )}
              {canHeal && (
                <div style={{ color: '#80ffff', marginBottom: '8px' }}>
                  <strong>Heal Mode:</strong> {isHealMode ? 'ACTIVE' : 'Available'}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setShowInfo(false); }}
                style={{
                  background: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Close
              </button>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}