import { Html } from "@react-three/drei";
import { useChessGame } from "../lib/stores/useChessGame";
import { useAudio } from "../lib/stores/useAudio";
import { calculateXPAward } from "../lib/chess/pieceData";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { useEffect } from "react";

export default function BattleModal() {
  const { 
    gamePhase, 
    battleState, 
    resolveBattle 
  } = useChessGame();
  const { playHit } = useAudio();

  useEffect(() => {
    if (battleState) {
      // Play battle sound
      playHit();
    }
  }, [battleState, playHit]);

  if (gamePhase !== 'battle' || !battleState) {
    return null;
  }

  const { attacker, defender, result, damage, attackerRoll, defenderRoll } = battleState;

  // Calculate XP gain for winners
  const getXPGain = () => {
    if (result === 'attacker_wins') {
      return {
        winner: attacker,
        xpGain: calculateXPAward(attacker.level, defender.level, defender.type)
      };
    } else if (result === 'defender_wins') {
      return {
        winner: defender,
        xpGain: calculateXPAward(defender.level, attacker.level, attacker.type)
      };
    }
    return null;
  };

  const xpInfo = getXPGain();

  return (
    <Html position={[0, 5, 5]} center>
      <Card className="w-96 bg-black/90 text-white border-red-600 animate-pulse">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-red-400">
            ⚔️ BATTLE! ⚔️
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Battle Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center border border-blue-500 p-3 rounded">
              <div className="font-bold text-blue-400">Attacker</div>
              <div className="text-lg">{attacker.type.toUpperCase()}</div>
              <div className="text-sm">({attacker.color})</div>
              <Progress 
                value={(attacker.health / 100) * 100} 
                className="mt-2"
              />
              <div className="text-xs mt-1">HP: {attacker.health}</div>
            </div>
            
            <div className="text-center border border-red-500 p-3 rounded">
              <div className="font-bold text-red-400">Defender</div>
              <div className="text-lg">{defender.type.toUpperCase()}</div>
              <div className="text-sm">({defender.color})</div>
              <Progress 
                value={(defender.health / 100) * 100} 
                className="mt-2"
              />
              <div className="text-xs mt-1">HP: {defender.health}</div>
            </div>
          </div>

          {/* Battle Results */}
          <div className="text-center space-y-2">
            <div className="text-lg font-semibold">
              Battle Results
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Attacker Roll: {attackerRoll}</div>
              <div>Defender Roll: {defenderRoll}</div>
            </div>
            <div className="text-lg font-bold text-yellow-400">
              Damage Dealt: {damage}
            </div>
            {xpInfo && (
              <div className="text-lg font-bold text-green-400">
                ⭐ {xpInfo.winner.type.toUpperCase()} gains {xpInfo.xpGain} XP!
              </div>
            )}
            <div className={`text-xl font-bold ${
              result === 'attacker_wins' ? 'text-blue-400' : 
              result === 'defender_wins' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {result === 'attacker_wins' && '🏆 Attacker Wins!'}
              {result === 'defender_wins' && '🛡️ Defender Survives!'}
              {result === 'both_survive' && '⚔️ Both Survive!'}
            </div>
          </div>

          <Button 
            onClick={resolveBattle}
            className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
          >
            Continue Game
          </Button>
        </CardContent>
      </Card>
    </Html>
  );
}
