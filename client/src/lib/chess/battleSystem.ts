import { ChessPiece } from "../stores/useChessGame";
import { getPieceStats, getEffectiveStats } from "./pieceData";

export interface BattleResult {
  attacker: ChessPiece;
  defender: ChessPiece;
  originalAttacker: ChessPiece;
  originalDefender: ChessPiece;
  attackerRoll: number;
  defenderRoll: number;
  damage: number;
  result: 'attacker_wins' | 'defender_wins' | 'both_survive';
}

export function resolveBattle(attacker: ChessPiece, defender: ChessPiece): BattleResult {
  // Store original pieces for display purposes
  const originalAttacker = { ...attacker };
  const originalDefender = { ...defender };
  
  const attackerStats = getEffectiveStats(attacker);
  const defenderStats = getEffectiveStats(defender);
  
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
  
  // Simple logic: if defender survives, both pieces survive with their health intact
  // Only the defender takes damage unless special conditions apply
  let result: BattleResult['result'];
  let finalAttackerHealth = attacker.health; // Keep attacker health unchanged by default
  let finalDefenderHealth = newDefenderHealth;
  
  if (newDefenderHealth <= 0) {
    // Defender is defeated - attacker wins
    result = 'attacker_wins';
    finalDefenderHealth = 0;
  } else {
    // Defender survives - check for limited counter-damage
    // Counter-damage is much more limited and only based on stat difference, not raw dice
    const statDifference = defenderStats.attack - attackerStats.defense;
    const rollAdvantage = defenderRoll - attackerRoll;
    
    // Counter-damage only occurs if defender has significant stat advantage AND good roll
    if (statDifference > 2 && rollAdvantage > 10) {
      const counterDamage = Math.max(1, Math.min(3, statDifference)); // Max 3 counter-damage
      
      if (counterDamage >= attacker.health) {
        // Rare case: defender's counter-attack destroys attacker
        result = 'defender_wins';
        finalAttackerHealth = 0;
      } else {
        // Both survive, attacker takes minimal counter-damage
        result = 'both_survive';
        finalAttackerHealth = Math.max(1, attacker.health - counterDamage);
      }
    } else {
      // Both survive with no counter-damage
      result = 'both_survive';
    }
  }
  
  // Create updated pieces with correct health values
  const updatedAttacker: ChessPiece = { ...attacker, health: finalAttackerHealth };
  const updatedDefender: ChessPiece = { ...defender, health: finalDefenderHealth };
  
  return {
    attacker: updatedAttacker,
    defender: updatedDefender,
    originalAttacker,
    originalDefender,
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
