import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import ChessBoard from "./ChessBoard";
import GameUI from "./GameUI";
import BattleModal from "./BattleModal";
import LevelUpModal from "./LevelUpModal";
import PromotionModal from "./PromotionModal";
import { useChessGame } from "../lib/stores/useChessGame";

export default function ChessGame() {
  const gameRef = useRef<any>();
  const { currentPlayer, gamePhase, updateAI } = useChessGame();

  // Game loop for AI updates
  useFrame((state, delta) => {
    if (currentPlayer === 'black' && gamePhase === 'playing') {
      updateAI(delta);
    }
  });

  return (
    <group ref={gameRef}>
      <ChessBoard />
      <GameUI />
      <BattleModal />
      <LevelUpModal />
      <PromotionModal />
    </group>
  );
}
