import { Html } from "@react-three/drei";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { ArrowLeft, ArrowRight, Play, CheckCircle, BookOpen, Sword, Users, Trophy } from "lucide-react";
import { useChessGame } from "../lib/stores/useChessGame";
import { tutorialLessons } from "./TutorialLessons";

// Tutorial lesson data structure
export interface TutorialLesson {
  id: string;
  title: string;
  category: 'basics' | 'combat' | 'strategy' | 'multiplayer';
  icon: any;
  description: string;
  objectives: string[];
  content: React.ReactNode;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisite?: string[];
}

// Tutorial progress tracking
interface TutorialProgress {
  completedLessons: string[];
  currentLesson: string | null;
  totalProgress: number;
}

interface TutorialProps {
  onExit: () => void;
}

export default function Tutorial({ onExit }: TutorialProps) {
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [progress, setProgress] = useState<TutorialProgress>({
    completedLessons: [],
    currentLesson: null,
    totalProgress: 0
  });
  const [showLessonList, setShowLessonList] = useState(true);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('chess-tutorial-progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (newProgress: TutorialProgress) => {
    setProgress(newProgress);
    localStorage.setItem('chess-tutorial-progress', JSON.stringify(newProgress));
  };

  const markLessonComplete = (lessonId: string) => {
    const newCompletedLessons = [...progress.completedLessons, lessonId];
    const newProgress = {
      ...progress,
      completedLessons: newCompletedLessons,
      totalProgress: (newCompletedLessons.length / tutorialLessons.length) * 100
    };
    saveProgress(newProgress);
  };

  const startLesson = (lessonId: string) => {
    setCurrentLessonId(lessonId);
    setShowLessonList(false);
    const newProgress = { ...progress, currentLesson: lessonId };
    saveProgress(newProgress);
  };

  const backToLessonList = () => {
    setShowLessonList(true);
    setCurrentLessonId(null);
  };

  if (!showLessonList && currentLessonId) {
    const currentLesson = tutorialLessons.find(l => l.id === currentLessonId);
    if (currentLesson) {
      return (
        <LessonView
          lesson={currentLesson}
          onComplete={() => markLessonComplete(currentLessonId)}
          onBack={backToLessonList}
          isCompleted={progress.completedLessons.includes(currentLessonId)}
        />
      );
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="w-full max-w-4xl h-full max-h-[90vh] overflow-y-auto p-6">
        <Card className="bg-gray-900 border-gray-700 text-white">
          <CardHeader className="text-center">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={onExit}
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-blue-400" />
                <CardTitle className="text-2xl font-bold">Chess RPG Tutorial</CardTitle>
              </div>
              <div className="w-24"> {/* Spacer for center alignment */}
                <Badge variant="secondary" className="bg-green-800 text-green-100">
                  {Math.round(progress.totalProgress)}% Complete
                </Badge>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={progress.totalProgress} className="w-full h-2" />
              <p className="text-gray-400 mt-2">
                {progress.completedLessons.length} of {tutorialLessons.length} lessons completed
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-300 text-lg">
                Master the art of Chess RPG Battle with step-by-step interactive lessons
              </p>
            </div>

            {/* Tutorial Categories */}
            {Object.entries(categorizedLessons).map(([category, lessons]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-xl font-bold text-white capitalize flex items-center">
                  {getCategoryIcon(category as any)}
                  <span className="ml-2">{category} Lessons</span>
                  <Badge variant="secondary" className="ml-2 bg-gray-700">
                    {lessons.filter(l => progress.completedLessons.includes(l.id)).length}/{lessons.length}
                  </Badge>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lessons.map(lesson => {
                    const isCompleted = progress.completedLessons.includes(lesson.id);
                    const isLocked = lesson.prerequisite && 
                      !lesson.prerequisite.every(req => progress.completedLessons.includes(req));
                    
                    return (
                      <Card 
                        key={lesson.id}
                        className={`
                          bg-gray-800 border-gray-600 hover:bg-gray-750 transition-colors cursor-pointer
                          ${isCompleted ? 'border-green-600 bg-green-900/20' : ''}
                          ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        onClick={() => !isLocked && startLesson(lesson.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <lesson.icon className="w-5 h-5 text-blue-400" />
                              <CardTitle className="text-lg">{lesson.title}</CardTitle>
                            </div>
                            {isCompleted && <CheckCircle className="w-5 h-5 text-green-400" />}
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <p className="text-gray-300 text-sm mb-3">{lesson.description}</p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              {lesson.difficulty}
                            </Badge>
                            <span>{lesson.estimatedTime}</span>
                          </div>
                          
                          <div className="mt-3">
                            <Button 
                              size="sm" 
                              disabled={isLocked}
                              className="w-full bg-blue-700 hover:bg-blue-600"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              {isCompleted ? 'Review Lesson' : 'Start Lesson'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Individual lesson viewer component
interface LessonViewProps {
  lesson: TutorialLesson;
  onComplete: () => void;
  onBack: () => void;
  isCompleted: boolean;
}

function LessonView({ lesson, onComplete, onBack, isCompleted }: LessonViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(isCompleted);

  const handleComplete = () => {
    setLessonCompleted(true);
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div className="w-full max-w-5xl h-full max-h-[95vh] overflow-y-auto p-4">
        <Card className="bg-gray-900 border-gray-700 text-white h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={onBack}
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lessons
              </Button>
              
              <div className="flex items-center space-x-3">
                <lesson.icon className="w-6 h-6 text-blue-400" />
                <div>
                  <CardTitle className="text-xl">{lesson.title}</CardTitle>
                  <p className="text-gray-400 text-sm">{lesson.category} • {lesson.estimatedTime}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  {lesson.difficulty}
                </Badge>
                {lessonCompleted && (
                  <Badge variant="default" className="bg-green-700 text-green-100">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 space-y-6">
            <div className="text-gray-300">
              <h3 className="text-lg font-semibold mb-2">Learning Objectives:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {lesson.objectives.map((obj, idx) => (
                  <li key={idx}>{obj}</li>
                ))}
              </ul>
            </div>
            
            <div className="flex-1">
              {lesson.content}
            </div>
            
            {!lessonCompleted && (
              <div className="flex justify-center">
                <Button 
                  onClick={handleComplete}
                  className="bg-green-700 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions
const getCategoryIcon = (category: string) => {
  const icons = {
    basics: BookOpen,
    combat: Sword,
    strategy: Trophy,
    multiplayer: Users
  };
  const Icon = icons[category as keyof typeof icons] || BookOpen;
  return <Icon className="w-5 h-5 text-blue-400" />;
};

// Group lessons by category
const categorizedLessons = tutorialLessons.reduce((acc, lesson) => {
  if (!acc[lesson.category]) acc[lesson.category] = [];
  acc[lesson.category].push(lesson);
  return acc;
}, {} as Record<string, TutorialLesson[]>);