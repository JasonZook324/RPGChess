import { useChessGame } from "../lib/stores/useChessGame";
import { useAudio } from "../lib/stores/useAudio";
import { useIsMobile } from "../hooks/use-is-mobile";
import { calculateXPAward } from "../lib/chess/pieceData";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { useEffect, useState } from "react";

// Mobile Battle Modal Component - renders outside Three.js context
export function MobileBattleModal() {
  const { 
    gamePhase, 
    battleState, 
    resolveBattle 
  } = useChessGame();
  const { playHit } = useAudio();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (gamePhase === 'battle' && battleState) {
      playHit();
      setIsVisible(true);
      setIsExiting(false);
    } else if (isVisible) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
      }, 300); // Match the exit animation duration
      return () => clearTimeout(timer);
    }
  }, [battleState, playHit, gamePhase, isVisible]);

  if (!isVisible || !battleState) {
    return null;
  }

  const { attacker, defender, originalAttacker, originalDefender, result, damage, attackerRoll, defenderRoll } = battleState;

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
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
      isExiting ? 'opacity-0' : 'opacity-100'
    }`}>
      <Card className={`w-full max-w-sm bg-black/95 text-white border-red-600 transition-all duration-300 ${
        isExiting 
          ? 'scale-75 opacity-0 -translate-y-4' 
          : 'scale-100 opacity-100 translate-y-0 animate-pulse'
      }`}>
        <CardHeader className="animate-bounce">
          <CardTitle className="text-center text-lg text-red-400">
            ⚔️ BATTLE! ⚔️
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Battle Participants */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center border border-blue-500 p-2 rounded animate-slideInLeft">
              <div className="font-bold text-blue-400 text-xs">Attacker</div>
              <div className="text-sm">{originalAttacker.type.toUpperCase()}</div>
              <div className="text-xs">({originalAttacker.color})</div>
              <Progress 
                value={(originalAttacker.health / 100) * 100} 
                className="mt-1 h-1"
              />
              <div className="text-xs mt-1">HP: {originalAttacker.health}</div>
            </div>
            
            <div className="text-center border border-red-500 p-2 rounded animate-slideInRight">
              <div className="font-bold text-red-400 text-xs">Defender</div>
              <div className="text-sm">{originalDefender.type.toUpperCase()}</div>
              <div className="text-xs">({originalDefender.color})</div>
              <Progress 
                value={(originalDefender.health / 100) * 100} 
                className="mt-1 h-1"
              />
              <div className="text-xs mt-1">HP: {originalDefender.health}</div>
            </div>
          </div>

          {/* Battle Results */}
          <div className="text-center space-y-2">
            <div className="text-sm font-semibold">
              Battle Results
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Attacker Roll: {attackerRoll}</div>
              <div>Defender Roll: {defenderRoll}</div>
            </div>
            <div className="text-sm font-bold text-yellow-400">
              Damage Dealt: {damage}
            </div>
            {xpInfo && (
              <div className="text-sm font-bold text-green-400">
                ⭐ {xpInfo.winner.type.toUpperCase()} gains {xpInfo.xpGain} XP!
              </div>
            )}
            <div className={`text-base font-bold ${
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
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-base py-3 touch-manipulation"
          >
            Continue Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Desktop Battle Modal Component
export default function BattleModal() {
  const { 
    gamePhase, 
    battleState, 
    resolveBattle 
  } = useChessGame();
  const { playHit } = useAudio();
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (gamePhase === 'battle' && battleState) {
      playHit();
      setIsVisible(true);
    } else if (isVisible) {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [battleState, playHit, gamePhase, isVisible]);

  if (!isVisible || !battleState) {
    return null;
  }

  // Don't render anything on mobile - MobileBattleModal is rendered separately
  if (isMobile) {
    return null;
  }

  const { attacker, defender, originalAttacker, originalDefender, result, damage, attackerRoll, defenderRoll } = battleState;

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pointer-events-auto">
      <Card className="w-96 bg-black/90 text-white border-red-600 animate-fadeInScale animate-battleShake">
        <CardHeader className="animate-bounce">
          <CardTitle className="text-center text-2xl text-red-400">
            ⚔️ BATTLE! ⚔️
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Battle Participants */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center border border-blue-500 p-3 rounded animate-slideInLeft">
              <div className="font-bold text-blue-400">Attacker</div>
              <div className="text-lg">{originalAttacker.type.toUpperCase()}</div>
              <div className="text-sm">({originalAttacker.color})</div>
              <Progress 
                value={(originalAttacker.health / 100) * 100} 
                className="mt-2"
              />
              <div className="text-xs mt-1">HP: {originalAttacker.health}</div>
            </div>
            
            <div className="text-center border border-red-500 p-3 rounded animate-slideInRight">
              <div className="font-bold text-red-400">Defender</div>
              <div className="text-lg">{originalDefender.type.toUpperCase()}</div>
              <div className="text-sm">({originalDefender.color})</div>
              <Progress 
                value={(originalDefender.health / 100) * 100} 
                className="mt-2"
              />
              <div className="text-xs mt-1">HP: {originalDefender.health}</div>
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
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-lg py-3 touch-manipulation"
          >
            Continue Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
