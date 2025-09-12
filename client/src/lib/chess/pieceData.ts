import { ChessPiece } from "../stores/useChessGame";

export interface PieceStats {
  maxHealth: number;
  attack: number;
  defense: number;
}

export function getPieceStats(type: ChessPiece['type']): PieceStats {
  const stats: Record<ChessPiece['type'], PieceStats> = {
    pawn: {
      maxHealth: 25,
      attack: 8,
      defense: 5
    },
    rook: {
      maxHealth: 60,
      attack: 15,
      defense: 12
    },
    knight: {
      maxHealth: 45,
      attack: 12,
      defense: 8
    },
    bishop: {
      maxHealth: 40,
      attack: 10,
      defense: 7
    },
    queen: {
      maxHealth: 80,
      attack: 18,
      defense: 15
    },
    king: {
      maxHealth: 100,
      attack: 12,
      defense: 18
    }
  };
  
  return stats[type];
}

export function getPieceDescription(type: ChessPiece['type']): string {
  const descriptions: Record<ChessPiece['type'], string> = {
    pawn: "Foot soldier with basic combat training",
    rook: "Heavy fortress defender with strong armor",
    knight: "Mobile cavalry unit with balanced stats",
    bishop: "Agile warrior with moderate combat skills",
    queen: "Elite commander with superior combat abilities",
    king: "Royal leader with exceptional defensive capabilities"
  };
  
  return descriptions[type];
}

export function getPieceHealthColor(health: number, maxHealth: number): string {
  const percentage = health / maxHealth;
  
  if (percentage > 0.7) return '#4ade80'; // Green
  if (percentage > 0.4) return '#fbbf24'; // Yellow
  if (percentage > 0.2) return '#fb923c'; // Orange
  return '#ef4444'; // Red
}
