import { ChessPiece } from "../stores/useChessGame";
import { getPieceStats } from "./pieceData";

export interface BattleResult {
  attacker: ChessPiece;
  defender: ChessPiece;
  attackerRoll: number;
  defenderRoll: number;
  damage: number;
  result: 'attacker_wins' | 'defender_wins' | 'both_survive';
}

export function resolveBattle(attacker: ChessPiece, defender: ChessPiece): BattleResult {
  const attackerStats = getPieceStats(attacker.type);
  const defenderStats = getPieceStats(defender.type);
  
  // Roll dice (1-20) for both pieces
  const attackerRoll = Math.floor(Math.random() * 20) + 1;
  const defenderRoll = Math.floor(Math.random() * 20) + 1;
  
  // Calculate effective attack and defense
  const effectiveAttack = attackerStats.attack + attackerRoll;
  const effectiveDefense = defenderStats.defense + defenderRoll;
  
  // Calculate damage
  let damage = Math.max(1, effectiveAttack - effectiveDefense);
  
  // Apply damage to defender
  const newDefenderHealth = Math.max(0, defender.health - damage);
  
  // Determine result
  let result: BattleResult['result'];
  if (newDefenderHealth <= 0) {
    // Defender is defeated
    result = 'attacker_wins';
  } else {
    // Defender survives, now check if defender can counter-attack successfully
    const counterAttackRoll = Math.floor(Math.random() * 20) + 1;
    const counterEffectiveAttack = defenderStats.attack + counterAttackRoll;
    const counterEffectiveDefense = attackerStats.defense + attackerRoll;
    
    // Only if defender's counter-attack is overwhelmingly successful should attacker be destroyed
    if (counterEffectiveAttack > counterEffectiveDefense + 10) {
      result = 'defender_wins';
    } else {
      result = 'both_survive';
    }
  }
  
  // Create updated pieces
  const updatedAttacker: ChessPiece = { ...attacker };
  const updatedDefender: ChessPiece = { 
    ...defender, 
    health: result === 'attacker_wins' ? 0 : newDefenderHealth 
  };
  
  // Apply counter-damage if needed
  if (result === 'defender_wins') {
    // Defender's devastating counter-attack defeats attacker
    updatedAttacker.health = 0;
  } else if (result === 'both_survive') {
    // Both survive, attacker might take some counter-damage
    const counterDamage = Math.max(0, Math.floor(damage / 4));
    if (counterDamage > 0) {
      updatedAttacker.health = Math.max(1, attacker.health - counterDamage);
    }
  }
  
  return {
    attacker: updatedAttacker,
    defender: updatedDefender,
    attackerRoll,
    defenderRoll,
    damage,
    result
  };
}

export function calculateBattleOutcome(
  attackerType: ChessPiece['type'],
  defenderType: ChessPiece['type']
): number {
  const attackerStats = getPieceStats(attackerType);
  const defenderStats = getPieceStats(defenderType);
  
  // Simple probability calculation
  const attackPower = attackerStats.attack + attackerStats.maxHealth / 10;
  const defensePower = defenderStats.defense + defenderStats.maxHealth / 10;
  
  return attackPower / (attackPower + defensePower);
}
