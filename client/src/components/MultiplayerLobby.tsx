import { useState, useEffect, useRef } from "react";
import { useMultiplayer } from "../lib/stores/useMultiplayer";
import { useAuth } from "../lib/stores/useAuth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Users, Copy, ArrowLeft, Gamepad2 } from "lucide-react";

interface MultiplayerLobbyProps {
  onBack: () => void;
  onGameStart: () => void;
}

export default function MultiplayerLobby({ onBack, onGameStart }: MultiplayerLobbyProps) {
  const { user } = useAuth();
  const { 
    connect, 
    disconnect, 
    leaveRoom,
    exitMultiplayer,
    createRoom, 
    joinRoom, 
    isConnected,
    connectionStatus, 
    roomId, 
    playerRole, 
    opponent, 
    isWaitingForPlayer, 
    error, 
    clearError 
  } = useMultiplayer();

  const [joinRoomId, setJoinRoomId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const hasConnectedRef = useRef(false);
  const componentIdRef = useRef(Math.random().toString(36));

  useEffect(() => {
    const componentId = componentIdRef.current;
    console.log(`[${componentId}] MultiplayerLobby mount effect, user:`, user?.username, 'connectionStatus:', connectionStatus);
    
    if (user && connectionStatus === 'disconnected') {
      setIsConnecting(true);
      console.log(`[${componentId}] Initiating connection for user:`, user.username);
      connect(user.id, user.username);
    }
    
    // Keep socket connected on unmount - socket should persist for entire multiplayer session
    return () => {
      console.log(`[${componentId}] MultiplayerLobby unmounting, keeping socket connected`);
      // Don't disconnect here - socket persists for the entire multiplayer session
      // Only disconnect when user explicitly exits multiplayer mode
    };
  }, [user?.id]); // Only depend on user id to avoid connection loops

  useEffect(() => {
    const componentId = componentIdRef.current;
    console.log(`[${componentId}] Connection status changed to:`, connectionStatus);
    if (connectionStatus === 'connected') {
      setIsConnecting(false);
    } else if (connectionStatus === 'connecting') {
      setIsConnecting(true);
    }
  }, [connectionStatus]);

  useEffect(() => {
    if (opponent) {
      // Game is ready to start
      onGameStart();
    }
  }, [opponent, onGameStart]);

  const handleCreateRoom = () => {
    clearError();
    createRoom();
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      return;
    }
    clearError();
    joinRoom(joinRoomId.trim().toUpperCase());
  };

  const handleCopyRoomId = async () => {
    if (roomId) {
      try {
        await navigator.clipboard.writeText(roomId);
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy room ID:', err);
      }
    }
  };

  if (isConnecting || connectionStatus === 'connecting') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <Card className="w-96 bg-gray-900 text-white border-gray-600">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400" />
              <div className="text-lg">Connecting to multiplayer server...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (connectionStatus === 'disconnected') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <Card className="w-96 bg-gray-900 text-white border-gray-600">
          <CardHeader>
            <CardTitle className="text-center text-red-400">Connection Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-gray-300">
              Unable to connect to multiplayer server. Please try again.
            </div>
            <Button 
              onClick={() => {
                exitMultiplayer();
                onBack();
              }} 
              variant="outline" 
              className="w-full border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isWaitingForPlayer && roomId) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <Card className="w-96 bg-gray-900 text-white border-gray-600">
          <CardHeader>
            <CardTitle className="text-center text-yellow-400">
              ♛ Waiting for Opponent ♛
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-sm text-gray-300 mb-2">Room ID:</div>
              <div className="flex items-center gap-2">
                <Input 
                  value={roomId} 
                  readOnly 
                  className="text-center text-xl font-mono bg-gray-800 border-gray-600 text-yellow-400"
                />
                <Button
                  onClick={handleCopyRoomId}
                  size="sm"
                  variant="outline"
                  className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Share this Room ID with your opponent
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Waiting for player to join...</span>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                You are playing as: <span className="text-white font-semibold">{playerRole}</span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-700">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={() => {
                leaveRoom();
                onBack();
              }} 
              variant="outline" 
              className="w-full border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel and Return to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="w-96 bg-gray-900 text-white border-gray-600">
        <CardHeader>
          <CardTitle className="text-center text-3xl text-yellow-400">
            ♛ Multiplayer Lobby ♛
          </CardTitle>
          <div className="text-center text-sm text-gray-300">
            Welcome, {user?.username}!
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border-red-700">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          {/* Create Room Section */}
          <div className="space-y-3">
            <div className="text-center text-gray-300">Create a new game room</div>
            <Button 
              onClick={handleCreateRoom}
              className="w-full bg-green-600 hover:bg-green-700 py-4 text-lg"
              disabled={connectionStatus !== 'connected'}
            >
              <Gamepad2 className="w-5 h-5 mr-2" />
              Create Room
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-900 px-2 text-gray-400">Or</span>
            </div>
          </div>

          {/* Join Room Section */}
          <div className="space-y-3">
            <div className="text-center text-gray-300">Join an existing room</div>
            <div className="space-y-2">
              <Label htmlFor="room-id" className="text-gray-200">Room ID</Label>
              <Input
                id="room-id"
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                placeholder="Enter Room ID"
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 text-center font-mono"
                maxLength={6}
              />
            </div>
            <Button 
              onClick={handleJoinRoom}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 text-lg"
              disabled={connectionStatus !== 'connected' || !joinRoomId.trim()}
            >
              <Users className="w-5 h-5 mr-2" />
              Join Room
            </Button>
          </div>

          {/* Back Button */}
          <Button 
            onClick={() => {
              exitMultiplayer();
              onBack();
            }} 
            variant="outline" 
            className="w-full border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Menu
          </Button>

          {/* Instructions */}
          <div className="text-xs text-gray-400 space-y-1 border-t border-gray-600 pt-4">
            <div className="font-semibold text-gray-300 mb-2">How to play:</div>
            <div>• Create a room and share the Room ID with a friend</div>
            <div>• Or join a room using a Room ID from a friend</div>
            <div>• Play real-time chess with RPG battle mechanics</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}