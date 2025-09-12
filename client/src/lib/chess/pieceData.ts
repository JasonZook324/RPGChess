import { ChessPiece } from "../stores/useChessGame";

export interface PieceStats {
  maxHealth: number;
  attack: number;
  defense: number;
}

export interface PieceAbility {
  name: string;
  description: string;
  cooldown?: number;
}

export interface PieceData {
  stats: PieceStats;
  abilities: PieceAbility[];
  description: string;
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
    bishop: "Divine healer with moderate combat skills and healing abilities",
    queen: "Elite commander with superior combat abilities",
    king: "Royal leader with exceptional defensive capabilities"
  };
  
  return descriptions[type];
}

export function getPieceAbilities(type: ChessPiece['type']): PieceAbility[] {
  const abilities: Record<ChessPiece['type'], PieceAbility[]> = {
    pawn: [],
    rook: [],
    knight: [],
    bishop: [
      {
        name: "Heal",
        description: "Restore health to an allied piece within movement range"
      }
    ],
    queen: [],
    king: []
  };
  
  return abilities[type];
}

export function calculateHealAmount(bishopLevel: number, targetMaxHealth: number): number {
  // Base heal percentage starts at 25% and increases by 5% per level
  const healPercentage = Math.min(0.25 + (bishopLevel - 1) * 0.05, 0.75); // Cap at 75%
  return Math.floor(targetMaxHealth * healPercentage);
}

export function getPieceHealthColor(health: number, maxHealth: number): string {
  const percentage = health / maxHealth;
  
  if (percentage > 0.7) return '#4ade80'; // Green
  if (percentage > 0.4) return '#fbbf24'; // Yellow
  if (percentage > 0.2) return '#fb923c'; // Orange
  return '#ef4444'; // Red
}

// Experience system utility functions
export function getEffectiveStats(piece: ChessPiece): PieceStats {
  const baseStats = getPieceStats(piece.type);
  return {
    maxHealth: baseStats.maxHealth + piece.mods.maxHealth,
    attack: baseStats.attack + piece.mods.attack,
    defense: baseStats.defense + piece.mods.defense
  };
}

export function getMaxHealth(piece: ChessPiece): number {
  const baseStats = getPieceStats(piece.type);
  return baseStats.maxHealth + piece.mods.maxHealth;
}

export function xpToNext(level: number): number {
  return 50 + 50 * (level - 1);
}

// XP award base values by piece type
export const XP_BASE_VALUES: Record<ChessPiece['type'], number> = {
  pawn: 20,
  knight: 40,
  bishop: 40,
  rook: 60,
  queen: 100,
  king: 150
};

export function calculateXPAward(winnerLevel: number, defeatedLevel: number, defeatedType: ChessPiece['type']): number {
  const baseXP = XP_BASE_VALUES[defeatedType];
  const levelDelta = defeatedLevel - winnerLevel;
  const multiplier = Math.max(0.5, 1 + 0.2 * levelDelta);
  return Math.round(baseXP * multiplier);
}
