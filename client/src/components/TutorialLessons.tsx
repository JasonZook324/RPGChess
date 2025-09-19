import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Sword, Shield, Heart, Dice1, Star, Crown, Users, Target, Brain, TrendingUp } from "lucide-react";
import type { TutorialLesson } from "./Tutorial";

// Individual lesson content components based on actual gameplay scenarios

const BasicsLessons = () => (
  <div className="space-y-6">
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-400" />
          Understanding the Game Interface
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-white">Key UI Elements:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Turn Indicator:</strong> Shows whose turn it is (White/Black)</li>
            <li><strong>Points Display:</strong> Running total of points earned from defeated pieces</li>
            <li><strong>Piece Stats:</strong> Health, Level, XP shown when hovering over pieces</li>
            <li><strong>Valid Moves:</strong> Highlighted squares show where you can move</li>
          </ul>
        </div>
        
        <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-blue-300">💡 Pro Tip</h4>
          <p className="text-sm">Always hover over pieces to see their current stats before making moves. Knowledge of your opponent's piece strength is crucial for strategic planning!</p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const FirstBattleLesson = () => (
  <div className="space-y-6">
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <Sword className="w-5 h-5 mr-2 text-red-400" />
          Your First Battle
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-white">How Combat Works:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Move a piece to capture an opponent's piece</li>
            <li>Battle Modal opens showing both pieces' stats</li>
            <li>Each piece rolls a 20-sided die</li>
            <li>Higher roll + piece stats determine damage</li>
            <li>Battle continues until one piece is defeated or both survive</li>
          </ol>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg">
            <h5 className="font-semibold text-red-300 mb-2">⚔️ Attacker Wins</h5>
            <p className="text-xs">Defender is defeated and removed. Attacker gains XP and you earn points!</p>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-600 p-3 rounded-lg">
            <h5 className="font-semibold text-yellow-300 mb-2">🛡️ Both Survive</h5>
            <p className="text-xs">Both pieces take damage but remain on board. No XP or points awarded.</p>
          </div>
        </div>

        <div className="bg-green-900/30 border border-green-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-green-300">📊 Battle Example (From Real Game):</h4>
          <div className="text-sm space-y-1">
            <p><strong>White Queen vs Black Pawn:</strong></p>
            <p>• Queen rolled: 5, Pawn rolled: 4</p>
            <p>• Queen wins, deals 26 damage (pawn only had 25 health)</p>
            <p>• <span className="text-green-400">Result: Attacker wins!</span></p>
            <p>• White awarded 1 point for defeating pawn</p>
            <p>• Queen gained 20 XP</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const StatsAndLevelingLesson = () => (
  <div className="space-y-6">
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-400" />
          Stats, XP, and Leveling Up
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg text-center">
            <Sword className="w-6 h-6 mx-auto mb-2 text-red-400" />
            <h5 className="font-semibold text-red-300">Attack</h5>
            <p className="text-xs">Increases damage dealt in battle</p>
          </div>
          <div className="bg-blue-900/30 border border-blue-600 p-3 rounded-lg text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <h5 className="font-semibold text-blue-300">Defense</h5>
            <p className="text-xs">Reduces damage taken from attacks</p>
          </div>
          <div className="bg-green-900/30 border border-green-600 p-3 rounded-lg text-center">
            <Heart className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <h5 className="font-semibold text-green-300">Max Health</h5>
            <p className="text-xs">Total health points for the piece</p>
          </div>
        </div>

        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-white">Leveling System:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Gain XP:</strong> Defeat enemy pieces in battle (20 XP per victory)</li>
            <li><strong>Level Requirements:</strong> 50 XP to reach Level 2, increasing per level</li>
            <li><strong>Attribute Points:</strong> Gain 1 point per level to distribute among Attack/Defense/Health</li>
            <li><strong>Strategic Choice:</strong> Specialize pieces for different roles!</li>
          </ul>
        </div>

        <div className="bg-purple-900/30 border border-purple-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-purple-300">🎯 Real Example - Bishop Level Up:</h4>
          <div className="text-sm space-y-1">
            <p>• Black Bishop defeated White Bishop in battle</p>
            <p>• Gained 40 XP (enough to level up!)</p>
            <p>• Reached Level 2 with attribute allocation</p>
            <p>• Player chose +1 Defense for tanky build</p>
            <p>• Bishop now harder to defeat in future battles</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const PointSystemLesson = () => (
  <div className="space-y-6">
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <Crown className="w-5 h-5 mr-2 text-yellow-400" />
          Point System & Victory Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-3 text-white">Point Values by Piece:</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between"><span>♟️ Pawn:</span> <Badge variant="outline">1 point</Badge></div>
            <div className="flex justify-between"><span>♗ Bishop:</span> <Badge variant="outline">3 points</Badge></div>
            <div className="flex justify-between"><span>♘ Knight:</span> <Badge variant="outline">3 points</Badge></div>
            <div className="flex justify-between"><span>♖ Rook:</span> <Badge variant="outline">5 points</Badge></div>
            <div className="flex justify-between"><span>♕ Queen:</span> <Badge variant="outline">8 points</Badge></div>
            <div className="flex justify-between"><span>♔ King:</span> <Badge variant="outline">15 points</Badge></div>
          </div>
        </div>

        <div className="bg-red-900/30 border border-red-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-red-300">🏆 Victory Conditions:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>King Defeat:</strong> Game ends immediately when a king is defeated in battle</li>
            <li><strong>No Checkmate:</strong> Unlike traditional chess, you must actually defeat the king in combat</li>
            <li><strong>Points Earned:</strong> Defeating the enemy king awards 15 points to your total</li>
          </ul>
        </div>

        <div className="bg-green-900/30 border border-green-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-green-300">📈 From Our Game Session:</h4>
          <div className="text-sm space-y-1">
            <p>• White earned points throughout: 2 pawns (2pts) + 1 bishop (3pts) = 5 total</p>
            <p>• Black scored: 1 bishop (3pts) + 1 pawn (1pt) = 4 total</p>
            <p>• <strong>Game ended when White Queen defeated Black King!</strong></p>
            <p>• Final score: White 20 points (including 15 for king), Black 6 points</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const StrategicPlayLesson = () => (
  <div className="space-y-6">
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-400" />
          Strategic Thinking & Risk Management
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-white">Key Strategic Concepts:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>XP Farming:</strong> Attack weaker pieces to gain levels safely</li>
            <li><strong>Risk Assessment:</strong> Consider dice rolls - even weak pieces can get lucky!</li>
            <li><strong>Piece Development:</strong> Level up your pieces early for advantage</li>
            <li><strong>Positioning:</strong> Keep valuable pieces protected while farming XP</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-900/30 border border-green-600 p-3 rounded-lg">
            <h5 className="font-semibold text-green-300 mb-2">✅ Good Strategy</h5>
            <ul className="text-xs space-y-1">
              <li>Attack pawns with stronger pieces</li>
              <li>Level up pieces before big battles</li>
              <li>Protect your king</li>
              <li>Focus fire on one target</li>
            </ul>
          </div>
          <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg">
            <h5 className="font-semibold text-red-300 mb-2">❌ Risky Moves</h5>
            <ul className="text-xs space-y-1">
              <li>Attacking equally strong pieces</li>
              <li>Exposing your king too early</li>
              <li>Ignoring piece leveling</li>
              <li>Random attacks without plan</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-blue-300">🎲 Understanding RNG (Random Number Generation):</h4>
          <p className="text-sm mb-2">Even with perfect strategy, dice rolls add uncertainty:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Plan for worst-case scenarios (rolling low)</li>
            <li>Have backup pieces ready to finish weakened enemies</li>
            <li>Sometimes retreat is better than risking a valuable piece</li>
            <li>Use healing to maintain piece health between battles</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
);

const BishopHealingLesson = () => (
  <div className="space-y-6">
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <Heart className="w-5 h-5 mr-2 text-green-400" />
          Bishop Healing Ability
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-white">How Bishop Healing Works:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Select your Bishop piece during your turn</li>
            <li>Click the "Toggle Heal Mode" button in the piece info panel</li>
            <li>Valid healing targets will be highlighted on the board</li>
            <li>Click on a damaged friendly piece to heal them</li>
            <li>Healing ends your turn (like making a move)</li>
          </ol>
        </div>

        <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-blue-300">🎯 Healing Rules:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Range:</strong> Bishop can heal any friendly piece on diagonal lines (like normal Bishop movement)</li>
            <li><strong>Target Requirements:</strong> Only pieces below maximum health can be healed</li>
            <li><strong>Line of Sight:</strong> Other pieces block healing just like regular moves</li>
            <li><strong>Self-Healing:</strong> Bishops cannot heal themselves</li>
          </ul>
        </div>

        <div className="bg-green-900/30 border border-green-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-green-300">📈 Healing Calculation:</h4>
          <div className="text-sm space-y-2">
            <p><strong>Formula:</strong> Base 25% of target's max health + 5% per Bishop level</p>
            <div className="bg-gray-800 p-3 rounded-lg mt-2">
              <div className="font-mono text-xs space-y-1">
                <div>Level 1 Bishop: 25% healing</div>
                <div>Level 2 Bishop: 30% healing</div>
                <div>Level 3 Bishop: 35% healing</div>
                <div>Maximum: 75% healing (high levels)</div>
              </div>
            </div>
            <p><strong>Example:</strong> Level 2 Bishop healing a Knight (45 max health) = 13 HP restored</p>
          </div>
        </div>

        <div className="bg-purple-900/30 border border-purple-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-purple-300">🎖️ Strategic Healing Tips:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Timing:</strong> Heal after battles to keep pieces combat-ready</li>
            <li><strong>Positioning:</strong> Keep Bishops safe but within range of your army</li>
            <li><strong>Leveling:</strong> Higher level Bishops heal much more effectively</li>
            <li><strong>Priority:</strong> Heal your most valuable damaged pieces first</li>
            <li><strong>Defense:</strong> Healing can be more valuable than attacking sometimes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
);

const PawnPromotionLesson = () => (
  <div className="space-y-6">
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <Crown className="w-5 h-5 mr-2 text-yellow-400" />
          Pawn Promotion System
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-white">When Promotion Happens:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>White Pawns:</strong> Reach the opposite end of the board (back rank)</li>
            <li><strong>Black Pawns:</strong> Reach the opposite end of the board (back rank)</li>
            <li><strong>Automatic Trigger:</strong> Promotion modal appears immediately when pawn reaches end</li>
            <li><strong>Required Choice:</strong> You must choose a piece type before continuing</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-yellow-900/30 border border-yellow-600 p-3 rounded-lg">
            <h5 className="font-semibold text-yellow-300 mb-2 flex items-center">
              <Crown className="w-4 h-4 mr-1" />
              Queen ♛
            </h5>
            <p className="text-xs">Most powerful piece - combines Rook and Bishop moves</p>
            <div className="text-xs mt-1">Health: 80 | Most versatile choice</div>
          </div>
          <div className="bg-red-900/30 border border-red-600 p-3 rounded-lg">
            <h5 className="font-semibold text-red-300 mb-2">Rook ♜</h5>
            <p className="text-xs">Strong linear movement - horizontal and vertical</p>
            <div className="text-xs mt-1">Health: 60 | Great for control</div>
          </div>
          <div className="bg-blue-900/30 border border-blue-600 p-3 rounded-lg">
            <h5 className="font-semibold text-blue-300 mb-2">Bishop ♝</h5>
            <p className="text-xs">Diagonal movement plus healing ability</p>
            <div className="text-xs mt-1">Health: 40 | Support role</div>
          </div>
          <div className="bg-green-900/30 border border-green-600 p-3 rounded-lg">
            <h5 className="font-semibold text-green-300 mb-2">Knight ♞</h5>
            <p className="text-xs">L-shaped jumps over other pieces</p>
            <div className="text-xs mt-1">Health: 45 | Unique mobility</div>
          </div>
        </div>

        <div className="bg-purple-900/30 border border-purple-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-purple-300">🎯 Strategic Promotion Choices:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Queen (Most Common):</strong> Maximum power and versatility - best for most situations</li>
            <li><strong>Rook:</strong> Choose when you need long-range linear control or already have enough queens</li>
            <li><strong>Bishop:</strong> Great if you need healing support or diagonal pressure</li>
            <li><strong>Knight:</strong> Unique jumping ability can be crucial in crowded positions</li>
          </ul>
        </div>

        <div className="bg-green-900/30 border border-green-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-green-300">⚡ Promotion Tips:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Plan Ahead:</strong> Think about your choice before the pawn reaches promotion</li>
            <li><strong>Consider Position:</strong> What piece type works best in the current board position?</li>
            <li><strong>Multiple Promotions:</strong> You can have multiple Queens if you promote multiple pawns</li>
            <li><strong>Protection:</strong> Newly promoted pieces start at full health and level 1</li>
            <li><strong>Battle Ready:</strong> Promoted pieces can immediately engage in combat</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
);

const MultiplayerLesson = () => (
  <div className="space-y-6">
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-green-400" />
          Multiplayer & Online Play
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-4">
        <div className="bg-gray-700 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-white">Getting Started with Multiplayer:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Select "Multiplayer" from the main menu</li>
            <li>Create a room or join an existing one with a room code</li>
            <li>Wait for an opponent to join your room</li>
            <li>Game starts automatically when both players are ready</li>
          </ol>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-yellow-300">🔄 Turn Synchronization:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Real-time Updates:</strong> See opponent moves immediately</li>
            <li><strong>Battle Results:</strong> Server validates all combat to prevent cheating</li>
            <li><strong>Point Tracking:</strong> Server maintains authoritative point totals</li>
            <li><strong>Disconnection:</strong> Game pauses if a player disconnects</li>
          </ul>
        </div>

        <div className="bg-purple-900/30 border border-purple-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-purple-300">🏆 Competitive Features:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>Leaderboards:</strong> Track your wins and ranking</li>
            <li><strong>Account Progression:</strong> Earn account XP and levels</li>
            <li><strong>Statistics:</strong> View detailed game history and performance</li>
            <li><strong>Anti-Cheat:</strong> Server-side validation ensures fair play</li>
          </ul>
        </div>

        <div className="bg-green-900/30 border border-green-600 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-green-300">📱 Multiplayer Etiquette:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Don't disconnect mid-game unless necessary</li>
            <li>Play at a reasonable pace - others are waiting</li>
            <li>Good sportsmanship wins or loses</li>
            <li>Use the chat respectfully (when available)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Export lesson components for use in TutorialData.ts
export {
  BasicsLessons,
  FirstBattleLesson,
  StatsAndLevelingLesson,
  PointSystemLesson,
  BishopHealingLesson,
  PawnPromotionLesson,
  StrategicPlayLesson,
  MultiplayerLesson
};