import { useEffect } from 'react';
import { useChessGame } from '../lib/stores/useChessGame';
import { useIsMobile } from '../hooks/use-is-mobile';
import { Clock, Timer } from 'lucide-react';

// Mobile Timer Component - compact display for mobile devices
export function MobileTimer() {
  const { moveTimer, timerActive, currentPlayer, gamePhase, tickTimer, startTimer } = useChessGame();
  const isMobile = useIsMobile();
  
  // Timer tick effect - only run on mobile
  useEffect(() => {
    if (!timerActive || gamePhase !== 'playing' || !isMobile) return;
    
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerActive, gamePhase, tickTimer, isMobile]);

  // Start timer when game phase changes to playing - only on mobile
  useEffect(() => {
    if (gamePhase === 'playing' && !timerActive && isMobile) {
      startTimer();
    }
  }, [gamePhase, timerActive, startTimer, isMobile]);

  if (gamePhase !== 'playing') return null;

  const minutes = Math.floor(moveTimer / 60);
  const seconds = moveTimer % 60;
  const isLowTime = moveTimer <= 20;
  const isVeryLowTime = moveTimer <= 10;

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
      isVeryLowTime 
        ? 'bg-red-600/90 text-white' 
        : isLowTime 
        ? 'bg-yellow-600/90 text-white' 
        : 'bg-gray-800/90 text-white'
    }`}>
      <Clock className={`w-4 h-4 ${isVeryLowTime ? 'animate-pulse' : ''}`} />
      <div className="flex flex-col items-center">
        <div className={`text-lg font-bold font-mono ${isVeryLowTime ? 'animate-pulse' : ''}`}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-300 capitalize">
          {currentPlayer}'s Turn
        </div>
      </div>
    </div>
  );
}

// Desktop Timer Component - larger circular progress display
export default function MoveTimer() {
  const { moveTimer, timerActive, totalMoveTime, currentPlayer, gamePhase, tickTimer, startTimer } = useChessGame();
  const isMobile = useIsMobile();
  
  // Timer tick effect - only run on desktop
  useEffect(() => {
    if (!timerActive || gamePhase !== 'playing' || isMobile) return;
    
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerActive, gamePhase, tickTimer, isMobile]);

  // Start timer when game phase changes to playing - only on desktop
  useEffect(() => {
    if (gamePhase === 'playing' && !timerActive && !isMobile) {
      startTimer();
    }
  }, [gamePhase, timerActive, startTimer, isMobile]);

  // Don't render desktop timer on mobile - use MobileTimer instead
  if (isMobile || gamePhase !== 'playing') return null;

  const minutes = Math.floor(moveTimer / 60);
  const seconds = moveTimer % 60;
  const progress = (moveTimer / totalMoveTime) * 100;
  const isLowTime = moveTimer <= 20;
  const isVeryLowTime = moveTimer <= 10;

  // SVG circle properties
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`fixed top-4 right-4 bg-black/90 border-2 rounded-2xl p-4 shadow-2xl transition-all duration-300 ${
      isVeryLowTime 
        ? 'border-red-500 shadow-red-500/50' 
        : isLowTime 
        ? 'border-yellow-500 shadow-yellow-500/50' 
        : 'border-gray-600'
    }`}>
      <div className="flex flex-col items-center space-y-2">
        {/* Circular Progress */}
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="rgb(75, 85, 99)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={isVeryLowTime ? '#dc2626' : isLowTime ? '#d97706' : '#10b981'}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ${isVeryLowTime ? 'animate-pulse' : ''}`}
            />
          </svg>
          
          {/* Timer display in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Timer className={`w-5 h-5 text-gray-400 mb-1 ${isVeryLowTime ? 'animate-pulse' : ''}`} />
            <div className={`text-xl font-bold font-mono text-white ${isVeryLowTime ? 'animate-pulse' : ''}`}>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Player indicator */}
        <div className="text-center">
          <div className="text-sm text-gray-400">Current Turn</div>
          <div className={`text-base font-semibold capitalize ${
            currentPlayer === 'white' ? 'text-white' : 'text-gray-300'
          }`}>
            {currentPlayer}
          </div>
        </div>

        {/* Warning messages */}
        {isVeryLowTime && (
          <div className="text-red-400 text-xs text-center animate-pulse">
            Time running out!
          </div>
        )}
        {isLowTime && !isVeryLowTime && (
          <div className="text-yellow-400 text-xs text-center">
            Low time remaining
          </div>
        )}
      </div>
    </div>
  );
}