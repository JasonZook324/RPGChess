import { Html } from "@react-three/drei";
import { useChessGame } from "../lib/stores/useChessGame";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

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

  return (
    <Html position={[6, 8, 0]} center>
      <Card className="w-80 bg-black/80 text-white border-gray-600">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            Chess RPG Battle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Game Status */}
          <div className="text-center">
            <div className="text-lg font-semibold">
              {gamePhase === 'playing' && `${currentPlayer === 'white' ? 'White' : 'Black'}'s Turn`}
              {gamePhase === 'battle' && 'Battle in Progress!'}
              {gamePhase === 'ended' && winner && `${winner === 'white' ? 'White' : 'Black'} Wins!`}
            </div>
            <div className="text-sm text-gray-300 mt-1">
              Mode: {gameMode === 'pvp' ? 'Player vs Player' : 'Player vs Computer'}
            </div>
          </div>

          {/* Game Controls */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={restartGame}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Restart Game
            </Button>
            <Button 
              onClick={backToMenu}
              variant="outline"
              className="w-full border-gray-600 hover:bg-gray-700"
            >
              Back to Menu
            </Button>
          </div>

          {/* Move History */}
          {moveHistory.length > 0 && (
            <div className="max-h-32 overflow-y-auto">
              <div className="text-sm font-semibold mb-2">Recent Moves:</div>
              <div className="space-y-1">
                {moveHistory.slice(-5).map((move, index) => (
                  <div key={index} className="text-xs text-gray-300">
                    {move}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-400 space-y-1">
            <div>• Click a piece to select it</div>
            <div>• Click a valid square to move</div>
            <div>• Hover over pieces to see stats</div>
            <div>• Battles occur when capturing</div>
          </div>
        </CardContent>
      </Card>
    </Html>
  );
}
