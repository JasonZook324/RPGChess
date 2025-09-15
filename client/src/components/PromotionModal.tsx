import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useChessGame } from "../lib/stores/useChessGame";

const promotionPieces = [
  { type: 'queen' as const, label: 'Queen', symbol: '♛' },
  { type: 'rook' as const, label: 'Rook', symbol: '♜' },
  { type: 'bishop' as const, label: 'Bishop', symbol: '♝' },
  { type: 'knight' as const, label: 'Knight', symbol: '♞' }
];

export default function PromotionModal() {
  const { gamePhase, promotingPiece, promotePawn } = useChessGame();
  
  const isOpen = gamePhase === 'promotion' && !!promotingPiece;
  
  const handlePromotion = (pieceType: 'queen' | 'rook' | 'knight' | 'bishop') => {
    promotePawn(pieceType);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-gray-900 border border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            Choose Promotion Piece
          </DialogTitle>
        </DialogHeader>
        <div className="text-center text-gray-300 mb-4">
          Your pawn has reached the end of the board! Choose which piece to promote it to:
        </div>
        <div className="grid grid-cols-2 gap-4">
          {promotionPieces.map((piece) => (
            <Button
              key={piece.type}
              onClick={() => handlePromotion(piece.type)}
              className="h-20 flex flex-col items-center justify-center bg-gray-700 hover:bg-gray-600 text-white border border-gray-500"
            >
              <span className="text-3xl mb-1" style={{ color: promotingPiece?.color === 'white' ? '#ffffff' : '#333333' }}>
                {piece.symbol}
              </span>
              <span className="text-sm">{piece.label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}