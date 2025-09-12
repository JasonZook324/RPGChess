import { Html } from "@react-three/drei";
import { useChessGame } from "../lib/stores/useChessGame";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";

export default function GameModeSelector() {
  const { setGameMode, setAIDifficulty } = useChessGame();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const handlePvP = () => {
    setGameMode('pvp');
  };

  const handlePvC = () => {
    setAIDifficulty(selectedDifficulty);
    setGameMode('pvc');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-96 bg-gray-900 text-white border-gray-600">
        <CardHeader>
          <CardTitle className="text-center text-3xl text-yellow-400">
            ♛ Chess RPG Battle ♛
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-300">
            Choose your game mode to begin the battle!
          </div>

          {/* Game Mode Buttons */}
          <div className="space-y-4">
            <Button 
              onClick={handlePvP}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 text-lg"
            >
              👥 Player vs Player
            </Button>

            <div className="space-y-3">
              <div className="text-sm text-gray-300">Select AI Difficulty:</div>
              <Select value={selectedDifficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setSelectedDifficulty(value)}>
                <SelectTrigger className="w-full bg-gray-800 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Easy - Random moves</SelectItem>
                  <SelectItem value="medium">🟡 Medium - Basic strategy</SelectItem>
                  <SelectItem value="hard">🔴 Hard - Advanced tactics</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handlePvC}
                className="w-full bg-red-600 hover:bg-red-700 py-4 text-lg"
              >
                🤖 Player vs Computer
              </Button>
            </div>
          </div>

          {/* Game Features */}
          <div className="text-xs text-gray-400 space-y-1 border-t border-gray-600 pt-4">
            <div className="font-semibold text-gray-300 mb-2">Game Features:</div>
            <div>• Traditional chess rules with RPG twist</div>
            <div>• Battle system when pieces capture</div>
            <div>• Health, Attack, and Defense stats</div>
            <div>• Dice-based combat resolution</div>
            <div>• Beautiful 3D chess board</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
