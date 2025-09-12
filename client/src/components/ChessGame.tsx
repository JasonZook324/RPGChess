import ChessBoard from "./ChessBoard";
import GameUI from "./GameUI";
import BattleModal from "./BattleModal";
import LevelUpModal from "./LevelUpModal";

export default function ChessGame() {
  return (
    <>
      <ChessBoard />
      <GameUI />
      <BattleModal />
      <LevelUpModal />
    </>
  );
}
