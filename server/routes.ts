import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";

// Extend Express Session interface
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    isGuest?: boolean;
  }
}

// Extend Socket.IO Socket interface to include our custom properties
interface AuthenticatedSocket extends Socket {
  userId: number;
  username: string;
  isGuest: boolean;
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Optional auth middleware (allows both authenticated and guest users)
const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Just adds user info to request if available, doesn't block
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Get the session middleware from the app to share with Socket.IO
  const sessionMiddleware = app.get('sessionMiddleware');
  // Authentication routes
  
  // Register new user
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        isGuest: false
      });

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Authentication failed' });
        }
        
        // Create session after regeneration
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.isGuest = false;

        // Initialize user stats (async but don't wait for response)
        storage.createUserStats({
          userId: user.id,
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          rating: 1200
        }).catch(err => console.error('User stats initialization error:', err));

        res.json({ 
          user: { 
            id: user.id, 
            username: user.username, 
            isGuest: user.isGuest 
          } 
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: 'Invalid registration data' });
    }
  });

  // Login existing user
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user || user.isGuest) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ error: 'Authentication failed' });
        }
        
        // Create session after regeneration
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.isGuest = false;

        res.json({ 
          user: { 
            id: user.id, 
            username: user.username, 
            isGuest: user.isGuest 
          } 
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create guest user
  app.post('/api/auth/guest', async (req: Request, res: Response) => {
    try {
      // Generate unique guest username with retry logic
      let guestUsername: string;
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        attempts++;
        guestUsername = `Guest_${Math.random().toString(36).substring(2, 8)}`;
        
        // Check if username already exists
        const existingUser = await storage.getUserByUsername(guestUsername);
        if (!existingUser) {
          break; // Found unique username
        }
        
        if (attempts >= maxAttempts) {
          console.error('Failed to generate unique guest username after', maxAttempts, 'attempts');
          return res.status(500).json({ error: 'Failed to create guest user' });
        }
      } while (true);
      
      // Create guest user with unique username
      const user = await storage.createGuestUser(guestUsername);

      // Create session
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.isGuest = true;

      // Initialize user stats
      await storage.createUserStats({
        userId: user.id,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        rating: 1200
      });

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          isGuest: user.isGuest 
        } 
      });
    } catch (error) {
      console.error('Guest creation error:', error);
      res.status(500).json({ error: 'Failed to create guest user' });
    }
  });

  // Get current user info
  app.get('/api/auth/me', optionalAuth, async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.json({ user: null });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.json({ user: null });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          isGuest: user.isGuest 
        } 
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ success: true });
    });
  });

  // Game routes (placeholder for now)
  app.get('/api/games', requireAuth, async (req: Request, res: Response) => {
    // TODO: Implement game listing
    res.json({ games: [] });
  });

  app.post('/api/games', requireAuth, async (req: Request, res: Response) => {
    // TODO: Implement game creation
    res.json({ message: 'Game creation not implemented yet' });
  });

  const httpServer = createServer(app);
  
  // Initialize Socket.IO with proper CORS and session sharing
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5000", "http://127.0.0.1:5000"],
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true
  });

  // Configure Socket.IO to use Express sessions
  const wrap = (middleware: any) => (socket: any, next: any) => 
    middleware(socket.request, {}, next);
  
  if (sessionMiddleware) {
    io.use(wrap(sessionMiddleware));
  }

  // Input validation schemas for socket events
  const createRoomSchema = z.object({});
  const joinRoomSchema = z.object({
    roomId: z.string().min(1).max(20)
  });
  const makeMoveSchema = z.object({
    roomId: z.string().min(1).max(20),
    move: z.object({
      from: z.string(),
      to: z.string(),
      piece: z.string(),
      moveNumber: z.number().int().positive()
    }),
    gameState: z.any()
  });
  const gameEndSchema = z.object({
    roomId: z.string().min(1).max(20),
    winner: z.enum(['white', 'black', 'draw']),
    gameState: z.any()
  });

  // Game room management
  interface GameRoom {
    id: string;
    gameId?: number; // Database game record ID
    players: {
      white?: { id: number; username: string; socketId: string };
      black?: { id: number; username: string; socketId: string };
    };
    gameState: any;
    status: 'waiting' | 'playing' | 'finished';
    currentTurn: 'white' | 'black';
    moveCount: number;
    createdAt: Date;
  }

  const gameRooms = new Map<string, GameRoom>();
  const playerSockets = new Map<string, { userId: number; username: string; roomId?: string; isGuest: boolean }>();

  // Generate unique room ID
  const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  // Secure session-based authentication middleware for Socket.IO
  const authenticateSocket = async (socket: any, next: any) => {
    try {
      // Access session data from the socket request
      const sessionData = socket.request.session;
      
      if (!sessionData) {
        return next(new Error('No session found'));
      }

      const userId = sessionData.userId;
      const username = sessionData.username;
      const isGuest = sessionData.isGuest || false;
      
      if (!userId || !username) {
        return next(new Error('User not authenticated'));
      }

      // Verify user exists in database
      const user = await storage.getUser(userId);
      if (!user) {
        return next(new Error('User not found'));
      }

      // Store authenticated user data on socket
      socket.userId = userId;
      socket.username = username;
      socket.isGuest = isGuest;
      
      console.log(`Socket authenticated for user: ${username} (${userId})`);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  };

  // Clean up stale rooms periodically
  const cleanupStaleRooms = () => {
    const now = Date.now();
    const STALE_ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    for (const [roomId, room] of Array.from(gameRooms.entries())) {
      const roomAge = now - room.createdAt.getTime();
      if (roomAge > STALE_ROOM_TIMEOUT && room.status !== 'playing') {
        gameRooms.delete(roomId);
        console.log(`Cleaned up stale room: ${roomId}`);
      }
    }
  };

  // Run cleanup every 10 minutes
  setInterval(cleanupStaleRooms, 10 * 60 * 1000);

  // Apply authentication middleware
  io.use(authenticateSocket);

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    // Cast to AuthenticatedSocket since it has been authenticated by middleware
    const authSocket = socket as AuthenticatedSocket;
    console.log(`Socket connected: ${authSocket.id} for user: ${authSocket.username} (${authSocket.userId})`);
    
    // Store authenticated user in playerSockets
    playerSockets.set(socket.id, {
      userId: authSocket.userId,
      username: authSocket.username,
      isGuest: authSocket.isGuest
    });
    
    socket.emit('authenticated', { success: true, userId: authSocket.userId, username: authSocket.username });

    socket.on('create_room', (data) => {
      try {
        createRoomSchema.parse(data || {});
        
        const player = playerSockets.get(socket.id);
        if (!player) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const roomId = generateRoomId();
        const room: GameRoom = {
          id: roomId,
          players: {
            white: { id: player.userId, username: player.username, socketId: socket.id }
          },
          gameState: null,
          status: 'waiting',
          currentTurn: 'white',
          moveCount: 0,
          createdAt: new Date()
        };

        gameRooms.set(roomId, room);
        player.roomId = roomId;
        socket.join(roomId);

        socket.emit('room_created', { roomId, role: 'white' });
        console.log(`Room created: ${roomId} by ${player.username}`);
      } catch (error) {
        console.error('Create room error:', error);
        socket.emit('error', { message: 'Invalid request data' });
      }
    });

    socket.on('join_room', async (data) => {
      try {
        const { roomId } = joinRoomSchema.parse(data);
        
        const player = playerSockets.get(socket.id);
        if (!player) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const room = gameRooms.get(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.status !== 'waiting') {
          socket.emit('error', { message: 'Room is not available' });
          return;
        }

        if (room.players.black) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        // Add player as black
        room.players.black = { id: player.userId, username: player.username, socketId: socket.id };
        room.status = 'playing';
        player.roomId = roomId;
        socket.join(roomId);

        // Create database game record once when game starts
        try {
          const gameRecord = await storage.createGame({
            player1Id: room.players.white!.id,
            player2Id: room.players.black.id,
            gameState: { initial: true },
            status: 'active'
          });
          room.gameId = gameRecord.id;
          console.log(`Game record created: ${gameRecord.id} for room ${roomId}`);
        } catch (dbError) {
          console.error('Failed to create game record:', dbError);
        }

        // Notify both players that the game can start
        io.to(roomId).emit('game_start', {
          players: {
            white: room.players.white,
            black: room.players.black
          },
          gameId: room.gameId
        });

        console.log(`Player ${player.username} joined room ${roomId}`);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Invalid request data' });
      }
    });

    socket.on('make_move', async (data) => {
      try {
        const { roomId, move, gameState } = makeMoveSchema.parse(data);

        const player = playerSockets.get(socket.id);
        if (!player) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const room = gameRooms.get(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (room.status !== 'playing') {
          socket.emit('error', { message: 'Game is not active' });
          return;
        }

        // Verify player is in this room
        const isWhite = room.players.white?.socketId === socket.id;
        const isBlack = room.players.black?.socketId === socket.id;

        if (!isWhite && !isBlack) {
          socket.emit('error', { message: 'Not a player in this room' });
          return;
        }

        const playerColor = isWhite ? 'white' : 'black';

        // Validate turn order
        if (room.currentTurn !== playerColor) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        // Validate move number sequence
        if (move.moveNumber !== room.moveCount + 1) {
          socket.emit('error', { message: 'Invalid move sequence' });
          return;
        }

        // Update room state
        room.gameState = gameState;
        room.currentTurn = playerColor === 'white' ? 'black' : 'white';
        room.moveCount = move.moveNumber;

        // Save move to database (if game record exists)
        if (room.gameId) {
          try {
            await storage.updateGameState(room.gameId, gameState);
            await storage.addGameMove({
              gameId: room.gameId,
              playerId: player.userId,
              moveNumber: move.moveNumber,
              moveData: move
            });
          } catch (error) {
            console.error('Database error saving move:', error);
          }
        }
          console.log(`Move ${move.moveNumber} made in room ${roomId} by ${player.username} (${playerColor})`);
        // Broadcast move to other player
        socket.to(roomId).emit('opponent_move', {
          move,
          gameState,
          player: playerColor,
          moveNumber: move.moveNumber
        });

        // Optionally, send confirmation to the mover
        socket.emit('move_accepted', {
          move,
          gameState,
          player: playerColor,
          moveNumber: move.moveNumber
        });

        
      } catch (error) {
        console.error('Make move error:', error);
        socket.emit('error', { message: 'Invalid move data' });
      }
    });

    socket.on('game_end', async (data) => {
      try {
        const { roomId, winner, gameState } = gameEndSchema.parse(data);
        
        const player = playerSockets.get(socket.id);
        if (!player) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const room = gameRooms.get(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Verify player is in this room
        const isWhite = room.players.white?.socketId === socket.id;
        const isBlack = room.players.black?.socketId === socket.id;
        
        if (!isWhite && !isBlack) {
          socket.emit('error', { message: 'Not a player in this room' });
          return;
        }

        room.status = 'finished';
        room.gameState = gameState;

        // Update database with final result
        if (room.gameId) {
          try {
            await storage.updateGameStatus(room.gameId, 'completed', winner);
            await storage.updateGameState(room.gameId, gameState);
            console.log(`Game ${room.gameId} ended in room ${roomId}, winner: ${winner}`);
          } catch (error) {
            console.error('Database error updating game end:', error);
          }
        }

        io.to(roomId).emit('game_ended', { winner, gameState });
        
        // Clean up room after a delay
        setTimeout(() => {
          gameRooms.delete(roomId);
          console.log(`Room ${roomId} cleaned up after game end`);
        }, 60000); // Clean up after 1 minute
        
      } catch (error) {
        console.error('Game end error:', error);
        socket.emit('error', { message: 'Invalid game end data' });
      }
    });

    socket.on('disconnect', (reason) => {
      const player = playerSockets.get(socket.id);
      console.log(`Socket disconnected: ${socket.id} (${player?.username || 'unknown'}) - Reason: ${reason}`);
      
      if (player && player.roomId) {
        const room = gameRooms.get(player.roomId);
        if (room) {
          // Notify other player about disconnection
          socket.to(player.roomId).emit('player_disconnected', {
            player: player.username,
            playerId: player.userId
          });

          // Handle room cleanup based on game status
          if (room.status === 'waiting') {
            // Remove waiting room immediately
            gameRooms.delete(player.roomId);
            console.log(`Removed waiting room ${player.roomId} due to creator disconnect`);
          } else if (room.status === 'playing') {
            // Mark room as abandoned, clean up after timeout
            setTimeout(async () => {
              const currentRoom = gameRooms.get(player.roomId!);
              if (currentRoom && currentRoom.status === 'playing') {
                // Update game status in database
                if (currentRoom.gameId) {
                  try {
                    await storage.updateGameStatus(currentRoom.gameId, 'abandoned');
                  } catch (error) {
                    console.error('Database error marking game as abandoned:', error);
                  }
                }
                gameRooms.delete(player.roomId!);
                console.log(`Cleaned up abandoned room ${player.roomId} after disconnect timeout`);
              }
            }, 5 * 60 * 1000); // 5 minutes timeout
          }
        }
      }
      
      playerSockets.delete(socket.id);
    });
  });

  return httpServer;
}
