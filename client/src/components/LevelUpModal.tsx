import { Html } from "@react-three/drei";
import { useChessGame } from "../lib/stores/useChessGame";
import { getEffectiveStats, getMaxHealth } from "../lib/chess/pieceData";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useState, useEffect } from "react";

export default function LevelUpModal() {
  const { 
    board,
    levelUpQueue,
    activeLevelUpPieceId,
    setActiveLevelUpPiece,
    allocateAttributes
  } = useChessGame();

  const [allocation, setAllocation] = useState({
    attack: 0,
    defense: 0,
    maxHealth: 0
  });

  // Find the piece that needs leveling up
  const levelUpPiece = board.flat().find(piece => 
    piece && piece.id === activeLevelUpPieceId
  );

  // Show modal when there are pieces in queue but no active piece
  const shouldShowModal = levelUpQueue.length > 0 && !activeLevelUpPieceId;

  useEffect(() => {
    if (shouldShowModal) {
      // Set the first piece in queue as active
      setActiveLevelUpPiece(levelUpQueue[0]);
    }
  }, [shouldShowModal, levelUpQueue, setActiveLevelUpPiece]);

  // Reset allocation when piece changes
  useEffect(() => {
    setAllocation({ attack: 0, defense: 0, maxHealth: 0 });
  }, [activeLevelUpPieceId]);

  if (!levelUpPiece || levelUpPiece.unspentPoints === 0) {
    return null;
  }

  const currentStats = getEffectiveStats(levelUpPiece);
  const currentMaxHealth = getMaxHealth(levelUpPiece);
  const totalAllocated = allocation.attack + allocation.defense + allocation.maxHealth;
  const remainingPoints = levelUpPiece.unspentPoints - totalAllocated;

  const handleAllocationChange = (stat: 'attack' | 'defense' | 'maxHealth', delta: number) => {
    const newValue = Math.max(0, allocation[stat] + delta);
    const newTotal = totalAllocated - allocation[stat] + newValue;
    
    if (newTotal <= levelUpPiece.unspentPoints) {
      setAllocation(prev => ({ ...prev, [stat]: newValue }));
    }
  };

  const handleConfirm = () => {
    if (totalAllocated > 0) {
      allocateAttributes(levelUpPiece.id, allocation);
      setAllocation({ attack: 0, defense: 0, maxHealth: 0 });
    }

    // If this piece still has points or move to next piece
    if (levelUpPiece.unspentPoints - totalAllocated === 0) {
      const nextPieceId = levelUpQueue.find(id => id !== levelUpPiece.id);
      setActiveLevelUpPiece(nextPieceId || null);
    }
  };

  const handleSkip = () => {
    // Move to next piece in queue or close modal
    const nextPieceId = levelUpQueue.find(id => id !== levelUpPiece.id);
    setActiveLevelUpPiece(nextPieceId || null);
    setAllocation({ attack: 0, defense: 0, maxHealth: 0 });
  };

  return (
    <Html position={[0, 6, 5]} center>
      <Card className="w-96 bg-black/95 text-white border-yellow-600 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-yellow-400">
            🌟 LEVEL UP! 🌟
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Piece Info */}
          <div className="text-center border border-yellow-500 p-3 rounded">
            <div className="font-bold text-yellow-400">
              {levelUpPiece.type.toUpperCase()}
            </div>
            <div className="text-sm">({levelUpPiece.color})</div>
            <div className="text-lg">Level {levelUpPiece.level}</div>
            <div className="text-sm text-green-400">
              {levelUpPiece.unspentPoints} Attribute Points Available
            </div>
          </div>

          {/* Current Stats */}
          <div className="space-y-2">
            <div className="text-center font-semibold text-blue-400">Current Stats</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="text-red-400">Attack</div>
                <div>{currentStats.attack}</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400">Defense</div>
                <div>{currentStats.defense}</div>
              </div>
              <div className="text-center">
                <div className="text-green-400">Max HP</div>
                <div>{currentMaxHealth}</div>
              </div>
            </div>
          </div>

          {/* Allocation Controls */}
          <div className="space-y-3">
            <div className="text-center font-semibold text-yellow-400">
              Allocate Points ({remainingPoints} remaining)
            </div>
            
            {/* Attack */}
            <div className="flex items-center justify-between bg-gray-800 p-2 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-red-400 w-16">Attack</span>
                <span className="text-sm">({currentStats.attack} → {currentStats.attack + allocation.attack})</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAllocationChange('attack', -1)}
                  disabled={allocation.attack === 0}
                  className="w-8 h-8 p-0"
                >
                  -
                </Button>
                <span className="w-8 text-center">{allocation.attack}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAllocationChange('attack', 1)}
                  disabled={remainingPoints === 0}
                  className="w-8 h-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Defense */}
            <div className="flex items-center justify-between bg-gray-800 p-2 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400 w-16">Defense</span>
                <span className="text-sm">({currentStats.defense} → {currentStats.defense + allocation.defense})</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAllocationChange('defense', -1)}
                  disabled={allocation.defense === 0}
                  className="w-8 h-8 p-0"
                >
                  -
                </Button>
                <span className="w-8 text-center">{allocation.defense}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAllocationChange('defense', 1)}
                  disabled={remainingPoints === 0}
                  className="w-8 h-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Max Health */}
            <div className="flex items-center justify-between bg-gray-800 p-2 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-green-400 w-16">Max HP</span>
                <span className="text-sm">({currentMaxHealth} → {currentMaxHealth + allocation.maxHealth})</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAllocationChange('maxHealth', -1)}
                  disabled={allocation.maxHealth === 0}
                  className="w-8 h-8 p-0"
                >
                  -
                </Button>
                <span className="w-8 text-center">{allocation.maxHealth}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAllocationChange('maxHealth', 1)}
                  disabled={remainingPoints === 0}
                  className="w-8 h-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button 
              onClick={handleConfirm}
              disabled={totalAllocated === 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Confirm
            </Button>
            <Button 
              onClick={handleSkip}
              variant="outline"
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>

          {/* Queue Info */}
          {levelUpQueue.length > 1 && (
            <div className="text-center text-sm text-gray-400">
              {levelUpQueue.length - 1} more pieces need leveling
            </div>
          )}
        </CardContent>
      </Card>
    </Html>
  );
}