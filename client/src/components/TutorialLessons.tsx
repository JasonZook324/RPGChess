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

// Export complete lesson data
export const tutorialLessons: TutorialLesson[] = [
  {
    id: 'basics-1',
    title: 'Getting Started',
    category: 'basics',
    icon: Target,
    description: 'Learn the basic UI, controls, and interface elements',
    objectives: [
      'Understand the game interface',
      'Learn mouse controls for piece selection',
      'Recognize turn indicators and piece stats'
    ],
    content: <BasicsLessons />,
    estimatedTime: '3 min',
    difficulty: 'beginner'
  },
  {
    id: 'basics-2',
    title: 'Your First Battle',
    category: 'basics',
    icon: Sword,
    description: 'Experience combat mechanics with dice-based battles',
    objectives: [
      'Understand the battle system',
      'Learn how dice rolls affect combat',
      'See different battle outcomes'
    ],
    content: <FirstBattleLesson />,
    estimatedTime: '5 min',
    difficulty: 'beginner',
    prerequisite: ['basics-1']
  },
  {
    id: 'combat-1',
    title: 'Stats & Leveling',
    category: 'combat',
    icon: Star,
    description: 'Master the RPG progression system with XP and attributes',
    objectives: [
      'Understand Attack, Defense, and Health stats',
      'Learn how to gain XP and level up pieces',
      'Choose effective attribute builds'
    ],
    content: <StatsAndLevelingLesson />,
    estimatedTime: '6 min',
    difficulty: 'beginner',
    prerequisite: ['basics-2']
  },
  {
    id: 'combat-2',
    title: 'Point System & Victory',
    category: 'combat',
    icon: Crown,
    description: 'Learn how to win games and the point system',
    objectives: [
      'Understand point values for each piece type',
      'Learn the victory conditions',
      'See how king battles end games'
    ],
    content: <PointSystemLesson />,
    estimatedTime: '4 min',
    difficulty: 'beginner',
    prerequisite: ['combat-1']
  },
  {
    id: 'strategy-1',
    title: 'Strategic Thinking',
    category: 'strategy',
    icon: Brain,
    description: 'Develop tactical awareness and risk management skills',
    objectives: [
      'Learn XP farming techniques',
      'Understand risk vs reward in battles',
      'Plan piece development strategies'
    ],
    content: <StrategicPlayLesson />,
    estimatedTime: '8 min',
    difficulty: 'intermediate',
    prerequisite: ['combat-2']
  },
  {
    id: 'multiplayer-1',
    title: 'Online Play',
    category: 'multiplayer',
    icon: Users,
    description: 'Master multiplayer features and competitive play',
    objectives: [
      'Learn how to create and join game rooms',
      'Understand multiplayer synchronization',
      'Explore competitive features and etiquette'
    ],
    content: <MultiplayerLesson />,
    estimatedTime: '5 min',
    difficulty: 'intermediate',
    prerequisite: ['strategy-1']
  }
];