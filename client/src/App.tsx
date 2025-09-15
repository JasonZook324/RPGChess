import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import "@fontsource/inter";
import ChessGame from "./components/ChessGame";
import GameModeSelector from "./components/GameModeSelector";
import PromotionModal from "./components/PromotionModal";
import { useChessGame } from "./lib/stores/useChessGame";

// Define control keys for the game
const controls = [
  { name: "confirm", keys: ["Enter", "Space"] },
  { name: "cancel", keys: ["Escape"] },
  { name: "up", keys: ["ArrowUp", "KeyW"] },
  { name: "down", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
];

function App() {
  const { gameMode } = useChessGame();
  const [showCanvas, setShowCanvas] = useState(false);

  // Show the canvas once everything is loaded
  useEffect(() => {
    setShowCanvas(true);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a' }}>
      {showCanvas && (
        <KeyboardControls map={controls}>
          {!gameMode && <GameModeSelector />}
          
          {gameMode && (
            <Canvas
              shadows
              camera={{
                position: [0, 12, 8],
                fov: 45,
                near: 0.1,
                far: 1000
              }}
              gl={{
                antialias: true,
                powerPreference: "default"
              }}
            >
                  <color attach="background" args={["#1a1a1a"]} />
                  
                  {/* Lighting */}
                  <ambientLight intensity={0.3} />
                <directionalLight
                  position={[10, 20, 10]}
                  intensity={1.5}
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                  shadow-camera-far={50}
                  shadow-camera-left={-20}
                  shadow-camera-right={20}
                  shadow-camera-top={20}
                  shadow-camera-bottom={-20}
                />
                <pointLight position={[0, 10, 0]} intensity={0.5} />

                <Suspense fallback={null}>
                  <ChessGame />
                </Suspense>
              </Canvas>
          )}
        </KeyboardControls>
      )}
      <PromotionModal />
    </div>
  );
}

export default App;
