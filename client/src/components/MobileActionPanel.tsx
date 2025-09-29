import { useState, useEffect } from 'react';
import { useChessGame } from '../lib/stores/useChessGame';
import { Button } from './ui/button';
import { Info, Heart, X } from 'lucide-react';

interface PieceInfoModalProps {
  piece: any;
  onClose: () => void;
}

function PieceInfoModal({ piece, onClose }: PieceInfoModalProps) {
  if (!piece) return null;

  const maxHealth = 25 + (piece.level - 1) * 10 + piece.mods.maxHealth;
  const attack = 10 + (piece.level - 1) * 2 + piece.mods.attack;
  const defense = 5 + (piece.level - 1) * 1 + piece.mods.defense;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pointer-events-auto">
      <div className="bg-gray-900 text-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold capitalize">
            {piece.color} {piece.type}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Level:</span>
            <span className="font-semibold">{piece.level}</span>
          </div>
          <div className="flex justify-between">
            <span>XP:</span>
            <span className="font-semibold">{piece.xp}/50</span>
          </div>
          <div className="flex justify-between">
            <span>Health:</span>
            <span className="font-semibold">{piece.health}/{maxHealth}</span>
          </div>
          <div className="flex justify-between">
            <span>Attack:</span>
            <span className="font-semibold">{attack}</span>
          </div>
          <div className="flex justify-between">
            <span>Defense:</span>
            <span className="font-semibold">{defense}</span>
          </div>
          {piece.unspentPoints > 0 && (
            <div className="flex justify-between text-yellow-400">
              <span>Unspent Points:</span>
              <span className="font-semibold">{piece.unspentPoints}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MobileActionPanel() {
  const { 
    selectedSquare, 
    board, 
    currentPlayer, 
    gamePhase, 
    isHealMode, 
    toggleHealMode 
  } = useChessGame();
  
  const [showPieceInfo, setShowPieceInfo] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<any>(null);

  // Get the currently selected piece
  const piece = selectedSquare ? board[selectedSquare.row][selectedSquare.col] : null;
  
  // Check if the selected piece can heal (is a bishop)
  const canHeal = piece && piece.type === 'bishop' && piece.color === currentPlayer;

  // Hide panel if no piece is selected or game isn't playing
  if (!piece || gamePhase !== 'playing') {
    return null;
  }

  const handleShowInfo = () => {
    setSelectedPiece(piece);
    setShowPieceInfo(true);
  };

  const handleCloseInfo = () => {
    setShowPieceInfo(false);
    setSelectedPiece(null);
  };

  return (
    <>
      {/* Floating Action Panel */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 pointer-events-auto">
        <div className="bg-gray-900/95 border border-gray-600 rounded-lg p-3 shadow-lg space-y-3">
          {/* Info Button */}
          <Button
            onClick={handleShowInfo}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full flex items-center justify-center touch-manipulation"
            title="View piece info"
          >
            <Info className="w-6 h-6 text-white" />
          </Button>

          {/* Heal Button - only show for bishops */}
          {canHeal && (
            <Button
              onClick={toggleHealMode}
              className={`w-12 h-12 rounded-full flex items-center justify-center touch-manipulation ${
                isHealMode 
                  ? 'bg-green-600 hover:bg-green-700 active:bg-green-800' 
                  : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800'
              }`}
              title={isHealMode ? "Exit heal mode" : "Enter heal mode"}
            >
              <Heart className={`w-6 h-6 ${isHealMode ? 'text-white fill-white' : 'text-white'}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Piece Info Modal */}
      {showPieceInfo && selectedPiece && (
        <PieceInfoModal 
          piece={selectedPiece} 
          onClose={handleCloseInfo}
        />
      )}
    </>
  );
}