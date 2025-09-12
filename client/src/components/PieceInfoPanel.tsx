import { ChessPiece } from "../lib/stores/useChessGame";
import { getEffectiveStats, getMaxHealth, xpToNext, getPieceAbilities } from "../lib/chess/pieceData";

interface PieceInfoPanelProps {
  piece: ChessPiece | null;
}

export default function PieceInfoPanel({ piece }: PieceInfoPanelProps) {
  if (!piece) return (
    <div style={{ minHeight: 180, padding: 16, background: "#222", color: "#fff", borderRadius: 8 }}>
      <em>Select a piece to view its stats.</em>
    </div>
  );

  const effectiveStats = getEffectiveStats(piece);
  const maxHealth = getMaxHealth(piece);
  const abilities = getPieceAbilities(piece.type);

  return (
    <div style={{ minHeight: 180, padding: 16, background: "#222", color: "#fff", borderRadius: 8 }}>
      <h3 style={{ margin: 0, fontSize: 22 }}>{piece.type.toUpperCase()} ({piece.color})</h3>
      <div>HP: {piece.health} / {maxHealth}</div>
      <div>ATK: {effectiveStats.attack} | DEF: {effectiveStats.defense}</div>
      <div>Level: {piece.level} | XP: {piece.xp} / {xpToNext(piece.level)}</div>
      {piece.unspentPoints > 0 && (
        <div style={{ color: "#80ff80" }}>{piece.unspentPoints} unspent points!</div>
      )}
      {abilities.length > 0 && (
        <div>
          <strong>Abilities:</strong> {abilities.map(a => a.name).join(", ")}
        </div>
      )}
    </div>
  );
}