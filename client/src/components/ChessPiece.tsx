import { useRef, useState, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { ChessPiece as PieceType } from "../lib/stores/useChessGame";
import { useChessGame } from "../lib/stores/useChessGame";
import { getEffectiveStats, getMaxHealth, xpToNext } from "../lib/chess/pieceData";
import { useIsMobile } from "../hooks/use-is-mobile";

interface ChessPieceProps {
  piece: PieceType;
  position: [number, number, number];
  row: number;
  col: number;
}

export default function ChessPiece({ piece, position, row, col }: ChessPieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { selectedSquare, currentPlayer, isHealMode, toggleHealMode, isPoisonMode, togglePoisonMode } = useChessGame();
  const [showInfo, setShowInfo] = useState(false);
  const isMobile = useIsMobile();
  
  // Animation state for smooth movement - using refs to avoid re-renders
  const animatedPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  const targetPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  const isAnimatingRef = useRef<boolean>(false);
  const animationTimeRef = useRef<number>(0);
  
  const isSelected = Boolean(selectedSquare?.row === row && selectedSquare?.col === col);
  const isCurrentPlayerPiece = piece.color === currentPlayer;
  const canHeal = piece.type === 'bishop' && isCurrentPlayerPiece;
  const canPoison = piece.type === 'knight' && isCurrentPlayerPiece;
  const isOnPoisonCooldown = canPoison && !!(piece.poisonCooldown && piece.poisonCooldown > 0);
  
  // Initialize position on mount
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
    }
  }, []);
  
  // Update target position when position prop changes (piece moves)
  useEffect(() => {
    const newTargetPosition = new THREE.Vector3(...position);
    const currentPosition = animatedPositionRef.current.clone();
    
    // Check if position actually changed
    if (!currentPosition.equals(newTargetPosition)) {
      targetPositionRef.current.copy(newTargetPosition);
      isAnimatingRef.current = true;
    }
  }, [position]);
  
  // Load model at top level
  const modelPath = `/models/${piece.type}.glb`;
  const { scene } = useGLTF(modelPath);
  
  // Calculate piece stats
  const effectiveStats = getEffectiveStats(piece);
  const maxHealth = getMaxHealth(piece);
  const healthPercentage = piece.health / maxHealth;

  // Animation logic for movement, selection, and pulsing glow
  useFrame((state) => {
    // Update animation time for effects (using ref to avoid re-renders)
    animationTimeRef.current = state.clock.elapsedTime;
    
    if (groupRef.current) {
      // Handle position animation (movement between squares)
      if (isAnimatingRef.current) {
        const currentPos = animatedPositionRef.current.clone();
        const targetPos = targetPositionRef.current.clone();
        
        // Smooth interpolation towards target position
        const newPos = currentPos.lerp(targetPos, 0.12); // Animation speed
        animatedPositionRef.current.copy(newPos);
        
        // Update the group's base position
        groupRef.current.position.set(newPos.x, newPos.y, newPos.z);
        
        // Check if we've reached the target (within a small threshold)
        if (currentPos.distanceTo(targetPos) < 0.01) {
          isAnimatingRef.current = false;
          animatedPositionRef.current.copy(targetPos);
          groupRef.current.position.set(targetPos.x, targetPos.y, targetPos.z);
        }
      } else {
        // Apply selection offset on top of base position when not moving
        const baseY = animatedPositionRef.current.y;
        const selectOffset = isSelected ? 0.3 : 0;
        
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          baseY + selectOffset,
          0.15
        );
      }
      
      // Add pulsing glow effect for selected pieces
      if (isSelected) {
        const pulseIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.15; // Pulse between 0.15 and 0.45
        
        groupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).emissive) {
              (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = pulseIntensity;
            }
          }
        });
      }
    }
  });

  // Get piece color with selection feedback
  const baseColor = piece.color === 'white' ? '#ffffff' : '#333333';
  const selectedColor = piece.color === 'white' ? '#ffff80' : '#8080ff';
  const pieceColor = isSelected ? selectedColor : baseColor;
  
  // Memoized piece model and bottom UI position
  const { pieceModel, bottomUIY, bottomUIZ } = useMemo(() => {
    // Clone the scene to avoid sharing materials between instances
    const clonedScene = scene.clone();
    
    // Scale the model smaller for better selection on larger spaced board
    const scale = 0.8; // Smaller scale for better piece selection
    clonedScene.scale.set(scale, scale, scale);
    
    // Apply piece color and selection effects to all materials
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Disable raycasting on all child meshes to prevent hover conflicts
        mesh.raycast = () => null;
        if (mesh.material) {
          // Create enhanced material with glow effects for selection
          const emissiveColor = isSelected ? 
            (piece.color === 'white' ? '#ffff40' : '#4040ff') : 
            '#000000';
          
          mesh.material = new THREE.MeshStandardMaterial({
            color: pieceColor,
            emissive: emissiveColor,
            emissiveIntensity: isSelected ? 0.3 : 0,
            metalness: 0.1,
            roughness: 0.7,
            transparent: isSelected,
            opacity: 1
          });
        }
      }
    });
    
    // Calculate bottom UI position and offset based on model dimensions
    const box = new THREE.Box3().setFromObject(clonedScene);
    const modelBottom = box.min.y;
    const uiY = Math.max(modelBottom + 0.02, 0.02); // Keep UI above board level
    
    // Calculate Z offset to place UI in front of model base
    const modelDepth = box.max.z - box.min.z;
    const uiZ = (modelDepth / 2) + 0.15; // Place UI in front of piece
    
    return { pieceModel: clonedScene, bottomUIY: uiY, bottomUIZ: uiZ };
  }, [scene, pieceColor]);
  
  const handleHealToggle = (e: any) => {
    e.stopPropagation();
    toggleHealMode();
  };

  const handlePoisonToggle = (e: any) => {
    e.stopPropagation();
    if (!isOnPoisonCooldown) {
      togglePoisonMode();
    }
  };

  return (
    <group position={[0, 0, 0]}>
      <group ref={groupRef}>
        {/* Visual model (no interaction) */}
        <primitive object={pieceModel} />
        
        {/* Piece symbol */}
        {/*<Text*/}
        {/*  position={[0, 0.8, 0]}*/}
        {/*  fontSize={0.3}*/}
        {/*  color={piece.color === 'white' ? '#000000' : '#ffffff'}*/}
        {/*  anchorX="center"*/}
        {/*  anchorY="middle"*/}
        {/*  rotation={[-Math.PI / 2, 0, 0]}*/}
        {/*  raycast={() => null}*/}
        {/*>*/}
        {/*  {piece.type.charAt(0).toUpperCase()}*/}
        {/*</Text>*/}
        
        {/* HP Bar */}
        <group position={[0, bottomUIY, bottomUIZ + 0.25]} rotation={[-Math.PI / 3, 0, 0]}>
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
            fontSize={0.09}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            raycast={() => null}
          >
            {`${piece.health}/${maxHealth}`}
          </Text>
        </group>
        
        {/* Info & Action Buttons - Desktop Only */}
        {!isMobile && (canHeal || canPoison) && (
          <group 
            position={[0.5, bottomUIY, bottomUIZ]} 
            rotation={[-Math.PI / 4, 0, 0]}
          >
            {/* Heal Button for Bishops */}
            {canHeal && (
              <group position={[-0.22, 0, 0]}>
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
            
            {/* Poison Button for Knights */}
            {canPoison && (
              <group position={[-0.22, 0, 0]}>
                <mesh 
                  onClick={isOnPoisonCooldown ? undefined : handlePoisonToggle}
                >
                  <circleGeometry args={[0.1]} />
                  <meshBasicMaterial 
                    color={
                      isOnPoisonCooldown 
                        ? "#666666" 
                        : isPoisonMode 
                          ? "#00ff00" 
                          : "#cc00cc"
                    } 
                    transparent 
                    opacity={isOnPoisonCooldown ? 0.5 : 0.8} 
                  />
                </mesh>
                <Text
                  position={[0, 0, 0.01]}
                  fontSize={0.07}
                  color={isOnPoisonCooldown ? "#999999" : "#ffffff"}
                  anchorX="center"
                  anchorY="middle"
                  onClick={isOnPoisonCooldown ? undefined : handlePoisonToggle}
                  raycast={() => null}
                >
                  P
                </Text>
              </group>
            )}
            
            {/* Info Button */}
            <group position={[0, 0, 0]}>
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
          </group>
        )}
        
        {/* Level Up Indicator */}
        {piece.unspentPoints > 0 && (
          <group position={[0, 1.0, 0]}>
            {/* Glowing background ring */}
            <mesh raycast={() => null}>
              <ringGeometry args={[0.1, 0.15, 16]} />
              <meshBasicMaterial 
                color="#ffd700" 
                transparent 
                opacity={0.8} 
              />
            </mesh>
            {/* Main level up indicator */}
            <mesh raycast={() => null}>
              <circleGeometry args={[0.08]} />
              <meshStandardMaterial 
                color="#ffff00" 
                emissive="#ffaa00" 
                emissiveIntensity={0.5}
              />
            </mesh>
            {/* Level up text */}
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.06}
              color="#000000"
              anchorX="center"
              anchorY="middle"
              raycast={() => null}
            >
              ⭐
            </Text>
          </group>
        )}
        
        {/* Poison Status Indicator */}
        {piece.poisonStatus && (
          <group position={[0, 1.2, 0]}>
            {/* Poison glow ring */}
            <mesh raycast={() => null}>
              <ringGeometry args={[0.08, 0.12, 16]} />
              <meshBasicMaterial 
                color="#00ff00" 
                transparent 
                opacity={0.7} 
              />
            </mesh>
            {/* Main poison indicator */}
            <mesh raycast={() => null}>
              <circleGeometry args={[0.06]} />
              <meshStandardMaterial 
                color="#00aa00" 
                emissive="#00ff00" 
                emissiveIntensity={0.6}
              />
            </mesh>
            {/* Poison symbol */}
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.05}
              color="#000000"
              anchorX="center"
              anchorY="middle"
              raycast={() => null}
            >
              ☠
            </Text>
            {/* Turn counter */}
            <Text
              position={[0, -0.15, 0.02]}
              fontSize={0.03}
              color="#00ff00"
              anchorX="center"
              anchorY="middle"
              raycast={() => null}
            >
              {piece.poisonStatus.turnsRemaining}
            </Text>
          </group>
        )}
        
        {/* Poison Cooldown Indicator - Only for Knights */}
        {piece.type === 'knight' && piece.poisonCooldown && piece.poisonCooldown > 0 && (
          <group position={[0, 1.4, 0]}>
            {/* Cooldown glow ring */}
            <mesh raycast={() => null}>
              <ringGeometry args={[0.06, 0.10, 16]} />
              <meshBasicMaterial 
                color="#8a2be2" 
                transparent 
                opacity={0.6} 
              />
            </mesh>
            {/* Main cooldown indicator */}
            <mesh raycast={() => null}>
              <circleGeometry args={[0.04]} />
              <meshStandardMaterial 
                color="#663399" 
                emissive="#8a2be2" 
                emissiveIntensity={0.4}
              />
            </mesh>
            {/* Cooldown counter */}
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.03}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              raycast={() => null}
            >
              {piece.poisonCooldown}
            </Text>
          </group>
        )}
        
        {/* Info Panel */}
        {showInfo && (
          <Html
            position={[0, row <= 2 ? -1.5 : 1.5, 0]}
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