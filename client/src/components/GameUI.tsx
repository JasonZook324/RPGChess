import { Html } from "@react-three/drei";
import { useChessGame } from "../lib/stores/useChessGame";
import { useIsMobile } from "../hooks/use-is-mobile";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import MoveTimer, { MobileTimer } from "./MoveTimer";
import MobileActionPanel from "./MobileActionPanel";

// Mobile UI Component - renders outside Three.js context
export function MobileGameUI() {
  const { 
    currentPlayer, 
    gamePhase, 
    gameMode, 
    winner, 
    restartGame, 
    backToMenu 
  } = useChessGame();

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black/90 text-white border-b border-gray-600 pointer-events-auto">
        <div className="px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <div className="text-lg font-semibold">
                {gamePhase === 'playing' && `${currentPlayer === 'white' ? 'White' : 'Black'}'s Turn`}
                {gamePhase === 'battle' && 'Battle in Progress!'}
                {gamePhase === 'ended' && winner && `${winner === 'white' ? 'White' : 'Black'} Wins!`}
              </div>
              <div className="text-xs text-gray-300">
                Mode: {gameMode === 'pvp' ? 'Player vs Player' : 'Player vs Computer'}
              </div>
            </div>
            <div className="ml-4">
              <MobileTimer />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 text-white border-t border-gray-600 pointer-events-auto">
        <div className="p-4 space-y-2">
          <div className="flex gap-2">
            <Button 
              onClick={restartGame}
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 py-3 text-sm touch-manipulation"
            >
              Restart Game
            </Button>
            <Button 
              onClick={backToMenu}
              variant="outline"
              className="flex-1 border-gray-600 hover:bg-gray-700 active:bg-gray-800 py-3 text-sm touch-manipulation"
            >
              Back to Menu
            </Button>
          </div>
          <div className="text-xs text-gray-400 text-center">
            Tap pieces to select • Tap squares to move
          </div>
        </div>
      </div>

      {/* Mobile Action Panel */}
      <MobileActionPanel />
    </div>
  );
}

// Desktop GameUI Component
export default function GameUI() {
  const { 
    currentPlayer, 
    gamePhase, 
    gameMode, 
    winner, 
    restartGame, 
    backToMenu,
    moveHistory 
  } = useChessGame();
  const isMobile = useIsMobile();

  // Don't render anything on mobile - MobileGameUI is rendered separately
  if (isMobile) {
    return null;
  }

  // Desktop UI - Screen-fixed positioning like mobile
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black/90 text-white border-b border-gray-600 pointer-events-auto">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <div className="text-xl font-bold">
                {gamePhase === 'playing' && `${currentPlayer === 'white' ? 'White' : 'Black'}'s Turn`}
                {gamePhase === 'battle' && 'Battle in Progress!'}
                {gamePhase === 'ended' && winner && `${winner === 'white' ? 'White' : 'Black'} Wins!`}
              </div>
              <div className="text-sm text-gray-300">
                Mode: {gameMode === 'pvp' ? 'Player vs Player' : 'Player vs Computer'}
              </div>
            </div>
            <div className="ml-6">
              <MoveTimer />
            </div>
          </div>
        </div>
      </div>

      {/* Side Control Panel */}
      <div className="absolute top-24 right-4 pointer-events-auto">
        <Card className="w-64 bg-black/90 text-white border-gray-600">
          <CardHeader>
            <CardTitle className="text-center text-lg">
              Game Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Game Controls */}
            <div className="flex flex-col gap-3">
              <Button 
                onClick={restartGame}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 py-2"
              >
                Restart Game
              </Button>
              <Button 
                onClick={backToMenu}
                variant="outline"
                className="w-full border-gray-600 hover:bg-gray-700 active:bg-gray-800 py-2"
              >
                Back to Menu
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-400 space-y-1 border-t border-gray-700 pt-3">
              <div>• Click a piece to select it</div>
              <div>• Click a valid square to move</div>
              <div>• Hover over pieces to see stats</div>
              <div>• Battles occur when capturing</div>
              <div>• Use action buttons on selected pieces</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
