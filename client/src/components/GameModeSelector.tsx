import { Html } from "@react-three/drei";
import { useChessGame } from "../lib/stores/useChessGame";
import { useAuth } from "../lib/stores/useAuth";
import { useIsMobile } from "../hooks/use-is-mobile";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { LogOut, User, Users, Wifi, BookOpen } from "lucide-react";
import { useState } from "react";
import MultiplayerLobby from "./MultiplayerLobby";
import Tutorial from "./Tutorial";

export default function GameModeSelector() {
  const { setGameMode, setAIDifficulty } = useChessGame();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handlePvP = () => {
    setGameMode('pvp');
  };

  const handlePvC = () => {
    setAIDifficulty(selectedDifficulty);
    setGameMode('pvc');
  };

  const handleMultiplayer = () => {
    setShowMultiplayerLobby(true);
  };

  const handleTutorial = () => {
    setShowTutorial(true);
  };

  const handleBackFromLobby = () => {
    setShowMultiplayerLobby(false);
  };

  const handleBackFromTutorial = () => {
    setShowTutorial(false);
  };

  const handleGameStart = () => {
    setGameMode('pvp'); // Set to PvP mode for multiplayer
  };

  if (showMultiplayerLobby) {
    return (
      <MultiplayerLobby 
        onBack={handleBackFromLobby}
        onGameStart={handleGameStart}
      />
    );
  }

  if (showTutorial) {
    return <Tutorial onExit={handleBackFromTutorial} />;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      {/* User Menu - Top Right */}
      <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-60`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={`bg-gray-800 border-gray-600 text-white hover:bg-gray-700 ${isMobile ? 'text-sm px-2 py-1' : ''}`}
            >
              {user?.isGuest ? <Users className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} /> : <User className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />}
{isMobile ? (user?.username?.slice(0, 8) + '...' || 'User') : user?.username}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-600 text-white">
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-gray-700 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className={`${isMobile ? 'w-full max-w-sm' : 'w-96'} bg-gray-900 text-white border-gray-600`}>
        <CardHeader>
          <CardTitle className={`text-center ${isMobile ? 'text-2xl' : 'text-3xl'} text-yellow-400`}>
            ♛ Chess RPG Battle ♛
          </CardTitle>
          <div className={`text-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-300`}>
Welcome, {isMobile ? (user?.username?.slice(0, 12) || 'User') : user?.username}! {user?.isGuest && "(Guest)"}
          </div>
        </CardHeader>
        <CardContent className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
          <div className={`text-center text-gray-300 ${isMobile ? 'text-sm' : ''}`}>
            Choose your game mode to begin the battle!
          </div>

          {/* Game Mode Buttons */}
          <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
            <Button 
              onClick={handleTutorial}
              className={`w-full bg-green-600 hover:bg-green-700 active:bg-green-800 ${isMobile ? 'py-3 text-base' : 'py-4 text-lg'} touch-manipulation`}
            >
              <BookOpen className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
              📚 Interactive Tutorial
            </Button>

            <Button 
              onClick={handleMultiplayer}
              className={`w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 ${isMobile ? 'py-3 text-base' : 'py-4 text-lg'} touch-manipulation`}
            >
              <Wifi className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2`} />
              Online Multiplayer
            </Button>

            <Button 
              onClick={handlePvP}
              className={`w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 ${isMobile ? 'py-3 text-base' : 'py-4 text-lg'} touch-manipulation`}
            >
              👥 Local Player vs Player
            </Button>

            <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-300`}>Select AI Difficulty:</div>
              <Select value={selectedDifficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setSelectedDifficulty(value)}>
                <SelectTrigger className={`w-full bg-gray-800 border-gray-600 ${isMobile ? 'h-10' : ''}`}>
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
                className={`w-full bg-red-600 hover:bg-red-700 active:bg-red-800 ${isMobile ? 'py-3 text-base' : 'py-4 text-lg'} touch-manipulation`}
              >
                🤖 Player vs Computer
              </Button>
            </div>
          </div>

          {/* Game Features */}
          {!isMobile && (
            <div className="text-xs text-gray-400 space-y-1 border-t border-gray-600 pt-4">
              <div className="font-semibold text-gray-300 mb-2">Game Features:</div>
              <div>• Online multiplayer with real-time sync</div>
              <div>• Traditional chess rules with RPG twist</div>
              <div>• Battle system when pieces capture</div>
              <div>• Health, Attack, and Defense stats</div>
              <div>• Dice-based combat resolution</div>
              <div>• Beautiful 3D chess board</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
