import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { 
  users, games, gameMoves, userSessions, userStats,
  type User, type Game, type GameMove, type UserSession, type UserStats,
  type InsertUser, type InsertGame, type InsertGameMove, type InsertUserSession, type InsertUserStats
} from "@shared/schema";

// Database client setup
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createGuestUser(username: string): Promise<User>;
  
  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  updateGameState(id: number, gameState: any): Promise<Game | undefined>;
  updateGameStatus(id: number, status: string, winner?: string): Promise<Game | undefined>;
  
  // Game moves operations
  addGameMove(move: InsertGameMove): Promise<GameMove>;
  getGameMoves(gameId: number): Promise<GameMove[]>;
  
  // Session operations
  createSession(session: InsertUserSession): Promise<UserSession>;
  getSession(token: string): Promise<UserSession | undefined>;
  deleteSession(token: string): Promise<void>;
  
  // User stats operations
  getUserStats(userId: number): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats | undefined>;
}

export class PostgresStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async createGuestUser(username: string): Promise<User> {
    const guestUser: InsertUser = {
      username,
      password: '', // No password for guests
      isGuest: true,
    };
    return this.createUser(guestUser);
  }

  // Game operations
  async createGame(game: InsertGame): Promise<Game> {
    const result = await db.insert(games).values(game).returning();
    return result[0];
  }

  async getGame(id: number): Promise<Game | undefined> {
    const result = await db.select().from(games).where(eq(games.id, id));
    return result[0];
  }

  async updateGameState(id: number, gameState: any): Promise<Game | undefined> {
    const result = await db
      .update(games)
      .set({ gameState, updatedAt: new Date() })
      .where(eq(games.id, id))
      .returning();
    return result[0];
  }

  async updateGameStatus(id: number, status: string, winner?: string): Promise<Game | undefined> {
    const result = await db
      .update(games)
      .set({ status, winner, updatedAt: new Date() })
      .where(eq(games.id, id))
      .returning();
    return result[0];
  }

  // Game moves operations
  async addGameMove(move: InsertGameMove): Promise<GameMove> {
    const result = await db.insert(gameMoves).values(move).returning();
    return result[0];
  }

  async getGameMoves(gameId: number): Promise<GameMove[]> {
    const result = await db
      .select()
      .from(gameMoves)
      .where(eq(gameMoves.gameId, gameId))
      .orderBy(gameMoves.moveNumber);
    return result;
  }

  // Session operations
  async createSession(session: InsertUserSession): Promise<UserSession> {
    const result = await db.insert(userSessions).values(session).returning();
    return result[0];
  }

  async getSession(token: string): Promise<UserSession | undefined> {
    const result = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.sessionToken, token));
    return result[0];
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(userSessions).where(eq(userSessions.sessionToken, token));
  }

  // User stats operations
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const result = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return result[0];
  }

  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    const result = await db.insert(userStats).values(stats).returning();
    return result[0];
  }

  async updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats | undefined> {
    const result = await db
      .update(userStats)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(userStats.userId, userId))
      .returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();
