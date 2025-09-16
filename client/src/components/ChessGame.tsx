import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import ChessBoard from "./ChessBoard";
import GameUI from "./GameUI";
import BattleModal from "./BattleModal";
import LevelUpModal from "./LevelUpModal";
import { useChessGame } from "../lib/stores/useChessGame";
import { useEffect } from "react";
import { useMultiplayer } from "../lib/stores/useMultiplayer";

export default function ChessGame() {
  const gameRef = useRef<any>();
  const { currentPlayer, gamePhase, updateAI } = useChessGame();

    useEffect(() => {
        useMultiplayer.getState().onOpponentMove(({ move, gameState, player, moveNumber }) => {
            // Update the board state with the received gameState
            useChessGame.setState({
                board: gameState,
                currentPlayer: player === "white" ? "black" : "white",
                selectedSquare: null,
                validMoves: [],
                // Optionally update other state like moveHistory, gamePhase, etc.
            });
            // Update moveCount in multiplayer store
            useMultiplayer.setState((state) => ({
              gameRoom: state.gameRoom
                ? { ...state.gameRoom, moveCount: moveNumber }
                : state.gameRoom
            }));
        });

        useMultiplayer.getState().onMoveAccepted(({ moveNumber }) => {
          useMultiplayer.setState((state) => ({
            gameRoom: state.gameRoom
              ? { ...state.gameRoom, moveCount: moveNumber }
              : state.gameRoom
          }));
        });
    }, []);

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
    </group>
  );
}
