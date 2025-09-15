import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
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

  return httpServer;
}
