import { Html } from "@react-three/drei";
import { Progress } from "./ui/progress";
import { getPieceHealthColor, getPieceDescription, getPieceAbilities } from "../lib/chess/pieceData";

import { useRef, useState, useMemo } from "react";
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
  hovered?: boolean; // <-- add this
}

export default function ChessPiece({ piece, position, row, col, hovered }: ChessPieceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { currentPlayer, isHealMode, toggleHealMode } = useChessGame();

  // Info modal state
  const [showInfo, setShowInfo] = useState(false);

  const isCurrentPlayerPiece = piece.color === currentPlayer;
  const canHeal = piece.type === 'bishop' && isCurrentPlayerPiece;

  // Calculate piece stats for overlay
  const effectiveStats = getEffectiveStats(piece);
  const maxHealth = getMaxHealth(piece);

  // Selection animation only
  useFrame((state) => {
    if (groupRef.current) {
      const baseY = position[1];
      const selectOffset = 0;
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

  // Get piece model and bounding box height
  const { scene } = useGLTF(`/models/${piece.type}.glb`);
  const pieceHeight = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    return box.max.y - box.min.y;
  }, [scene]);

  // Apply piece color to all materials and disable raycasting on child meshes
  scene.traverse((child) => {
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

  const handleHealToggle = (e: any) => {
    e.stopPropagation();
    toggleHealMode();
  };

  // Info modal content
  const infoDescription = getPieceDescription(piece.type);
  const infoAbilities = getPieceAbilities(piece.type);

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Visual model (no interaction) */}
        <primitive object={scene.clone()} />
      </group>

      {/* HP Bar and buttons, positioned just above the piece */}
      {hovered && (
        <Html distanceFactor={10} position={[0, pieceHeight + 0.2, 0]} center>
          <div className="flex flex-row items-center">
            {/* Info button */}
            <button
              onClick={e => {
                e.stopPropagation();
                setShowInfo(true);
              }}
              style={{
                background: "rgba(30,30,30,0.85)",
                border: "1px solid #ffd700",
                borderRadius: "50%",
                width: 24,
                height: 24,
                color: "#ffd700",
                fontWeight: "bold",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px #000a",
                marginRight: 8,
              }}
              title="Piece Info"
            >
              i
            </button>
            {/* HP Bar */}
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-2 rounded bg-gray-800"
                style={{ position: "relative", overflow: "hidden" }}
              >
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, (piece.health / maxHealth) * 100))}%`,
                    height: "100%",
                    background: getPieceHealthColor(piece.health, maxHealth),
                    transition: "width 0.2s",
                  }}
                />
              </div>
              <span className="text-[10px] text-green-100 font-bold drop-shadow-sm" style={{ textShadow: "0 0 2px #000" }}>
                {piece.health} / {maxHealth}
              </span>
            </div>
            {/* Heal button */}
            {canHeal && (
              <button
                onClick={handleHealToggle}
                style={{
                  background: isHealMode ? "#22c55e" : "#2563eb",
                  border: "1.5px solid #fff",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 20,
                  cursor: "pointer",
                  boxShadow: "0 1px 4px #000a",
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 8,
                  padding: 0,
                }}
                title="Toggle Heal Mode"
              >
                <span style={{
                  display: "inline-block",
                  fontSize: 20,
                  lineHeight: 1,
                  fontWeight: "bold",
                  color: "#fff",
                  textShadow: "0 1px 2px #000a"
                }}>
                  &#43;
                </span>
              </button>
            )}
          </div>
        </Html>
      )}

      {/* Info modal */}
      {showInfo && (
        <Html distanceFactor={10} position={[0, 2.2, 0]} center>
          <div
            style={{
              minWidth: 220,
              maxWidth: 320,
              background: "rgba(20,20,20,0.97)",
              border: "2px solid #ffd700",
              borderRadius: 12,
              padding: 16,
              color: "#fff",
              zIndex: 100,
              boxShadow: "0 2px 12px #000c",
              fontSize: 14,
              position: "relative"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: "bold", color: "#ffd700", fontSize: 18, marginBottom: 4 }}>
              {piece.type.toUpperCase()}
            </div>
            <div style={{ color: "#aaa", marginBottom: 8 }}>
              {infoDescription}
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: "#4ade80" }}>HP:</span> {maxHealth} &nbsp;
              <span style={{ color: "#f87171" }}>ATK:</span> {effectiveStats.attack} &nbsp;
              <span style={{ color: "#60a5fa" }}>DEF:</span> {effectiveStats.defense}
            </div>
            {infoAbilities.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: "#fbbf24", fontWeight: "bold" }}>Abilities:</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {infoAbilities.map((ab, idx) => (
                    <li key={idx} style={{ marginBottom: 2 }}>
                      <span style={{ color: "#fff" }}>{ab.name}</span>
                      {ab.description && (
                        <span style={{ color: "#aaa" }}> – {ab.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={e => {
                e.stopPropagation();
                setShowInfo(false);
              }}
              style={{
                marginTop: 8,
                background: "#ffd700",
                color: "#222",
                border: "none",
                borderRadius: 6,
                padding: "4px 16px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: 14,
                float: "right"
              }}
            >
              Close
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}
