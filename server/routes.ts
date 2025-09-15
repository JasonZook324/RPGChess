import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

// Extend Express Session interface
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    isGuest?: boolean;
  }
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
  
  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Game room management
  interface GameRoom {
    id: string;
    players: {
      white?: { id: number; username: string; socketId: string };
      black?: { id: number; username: string; socketId: string };
    };
    gameState: any;
    status: 'waiting' | 'playing' | 'finished';
    createdAt: Date;
  }

  const gameRooms = new Map<string, GameRoom>();
  const playerSockets = new Map<string, { userId: number; username: string; roomId?: string }>();

  // Generate unique room ID
  const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('authenticate', async (data: { userId: number; username: string }) => {
      const { userId, username } = data;
      playerSockets.set(socket.id, { userId, username });
      socket.emit('authenticated', { success: true });
      console.log(`User authenticated: ${username} (${userId})`);
    });

    socket.on('create_room', () => {
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
        createdAt: new Date()
      };

      gameRooms.set(roomId, room);
      player.roomId = roomId;
      socket.join(roomId);

      socket.emit('room_created', { roomId, role: 'white' });
      console.log(`Room created: ${roomId} by ${player.username}`);
    });

    socket.on('join_room', (data: { roomId: string }) => {
      const player = playerSockets.get(socket.id);
      if (!player) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const room = gameRooms.get(data.roomId);
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
      player.roomId = data.roomId;
      socket.join(data.roomId);

      // Notify both players that the game can start
      io.to(data.roomId).emit('game_start', {
        players: {
          white: room.players.white,
          black: room.players.black
        }
      });

      console.log(`Player ${player.username} joined room ${data.roomId}`);
    });

    socket.on('make_move', async (data: { roomId: string; move: any; gameState: any }) => {
      const player = playerSockets.get(socket.id);
      if (!player) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const room = gameRooms.get(data.roomId);
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

      // Update room game state
      room.gameState = data.gameState;

      // Save move to database
      try {
        const gameRecord = await storage.createGame({
          player1Id: room.players.white!.id,
          player2Id: room.players.black!.id,
          gameState: data.gameState,
          status: 'playing'
        });

        await storage.addGameMove({
          gameId: gameRecord.id,
          playerId: player.userId,
          moveNumber: data.move.moveNumber || 1,
          moveData: JSON.stringify(data.move)
        });
      } catch (error) {
        console.error('Database error:', error);
      }

      // Broadcast move to other player
      socket.to(data.roomId).emit('opponent_move', {
        move: data.move,
        gameState: data.gameState,
        player: isWhite ? 'white' : 'black'
      });

      console.log(`Move made in room ${data.roomId} by ${player.username}`);
    });

    socket.on('game_end', async (data: { roomId: string; winner: string; gameState: any }) => {
      const room = gameRooms.get(data.roomId);
      if (room) {
        room.status = 'finished';
        room.gameState = data.gameState;

        // Update database with final result
        try {
          // TODO: Update game record with winner and final state
          console.log(`Game ended in room ${data.roomId}, winner: ${data.winner}`);
        } catch (error) {
          console.error('Database error:', error);
        }

        io.to(data.roomId).emit('game_ended', { winner: data.winner });
      }
    });

    socket.on('disconnect', () => {
      const player = playerSockets.get(socket.id);
      if (player && player.roomId) {
        const room = gameRooms.get(player.roomId);
        if (room) {
          // Notify other player about disconnection
          socket.to(player.roomId).emit('player_disconnected', {
            player: player.username
          });
        }
      }
      
      playerSockets.delete(socket.id);
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return httpServer;
}
