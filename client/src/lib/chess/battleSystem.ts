import { ChessPiece, BattleState } from "../stores/useChessGame";
import { getPieceStats } from "./pieceData";

export function resolveBattle(attacker: ChessPiece, defender: ChessPiece): BattleState {
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
  let result: BattleState['result'];
  if (newDefenderHealth <= 0) {
    result = 'attacker_wins';
  } else if (damage <= defenderStats.defense / 2) {
    // If damage is very low, defender "wins" (survives easily)
    result = 'defender_wins';
  } else {
    result = 'both_survive';
  }
  
  // Create updated pieces
  const updatedAttacker: ChessPiece = { ...attacker };
  const updatedDefender: ChessPiece = { 
    ...defender, 
    health: result === 'attacker_wins' ? 0 : newDefenderHealth 
  };
  
  // If both survive, attacker might also take some damage
  if (result === 'both_survive' && defenderRoll > attackerRoll) {
    const counterDamage = Math.max(1, Math.floor(damage / 3));
    updatedAttacker.health = Math.max(1, attacker.health - counterDamage);
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
