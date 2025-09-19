import React from "react";
import { Target, Sword, Star, Crown, Heart, Brain, Users } from "lucide-react";
import type { TutorialLesson } from "./Tutorial";
import { BasicsLessons, FirstBattleLesson, StatsAndLevelingLesson, PointSystemLesson, BishopHealingLesson, PawnPromotionLesson, StrategicPlayLesson, MultiplayerLesson } from "./TutorialLessons";

// Tutorial lessons data separated from React components to fix HMR warnings
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
    id: 'combat-3',
    title: 'Bishop Healing',
    category: 'combat',
    icon: Heart,
    description: 'Master the unique Bishop healing ability',
    objectives: [
      'Learn how to activate heal mode',
      'Understand healing mechanics and range',
      'Apply strategic healing in battle'
    ],
    content: <BishopHealingLesson />,
    estimatedTime: '5 min',
    difficulty: 'beginner',
    prerequisite: ['combat-2']
  },
  {
    id: 'combat-4',
    title: 'Pawn Promotion',
    category: 'combat',
    icon: Crown,
    description: 'Transform pawns into powerful pieces',
    objectives: [
      'Understand when promotion occurs',
      'Learn the strengths of each promotion choice',
      'Make strategic promotion decisions'
    ],
    content: <PawnPromotionLesson />,
    estimatedTime: '4 min',
    difficulty: 'beginner',
    prerequisite: ['combat-2']
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
    prerequisite: ['combat-4']
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