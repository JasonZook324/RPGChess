import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import { 
  users, games, gameMoves, userSessions, userStats,
  type User, type Game, type GameMove, type UserSession, type UserStats,
  type InsertUser, type InsertGame, type InsertGameMove, type InsertUserSession, type InsertUserStats
} from "@shared/schema";

// Database client setup - clean and parse the DATABASE_URL
let databaseUrl = process.env.DATABASE_URL!;
// Remove the prefix if it exists
if (databaseUrl.startsWith('DATABASE_URL=')) {
  databaseUrl = databaseUrl.substring('DATABASE_URL='.length);
}
// Decode HTML entities
databaseUrl = databaseUrl.replace(/&amp;/g, '&');

const sql = neon(databaseUrl);
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
  updateGamePoints(id: number, whitePoints: number, blackPoints: number): Promise<Game | undefined>;
  completeGame(id: number, winnerColor: 'white' | 'black' | 'draw', winnerUserId?: number): Promise<Game | undefined>;
  
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
  getLeaderboard(limit?: number): Promise<Array<{ 
    id: number; 
    username: string; 
    isGuest: boolean;
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    rating: number;
    totalPoints: number;
    level: number;
  }>>;
  computeLevel(totalPoints: number, gamesWon: number): number;
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

  // Point and game completion operations
  async updateGamePoints(id: number, whitePoints: number, blackPoints: number): Promise<Game | undefined> {
    const result = await db
      .update(games)
      .set({ whitePoints, blackPoints, updatedAt: new Date() })
      .where(eq(games.id, id))
      .returning();
    return result[0];
  }

  async completeGame(id: number, winnerColor: 'white' | 'black' | 'draw', winnerUserId?: number): Promise<Game | undefined> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Get the game data first
      const game = await tx.select().from(games).where(eq(games.id, id));
      if (!game[0]) throw new Error('Game not found');
      
      const gameData = game[0];
      
      // Idempotency guard - prevent re-completion
      if (gameData.status === 'completed') {
        return gameData;
      }
      
      const winnerPoints = winnerColor === 'white' ? gameData.whitePoints : 
                          winnerColor === 'black' ? gameData.blackPoints : 0;

      // Update game status
      const updatedGame = await tx
        .update(games)
        .set({
          status: 'completed',
          winner: winnerColor,
          winnerUserId: winnerUserId || null,
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(games.id, id))
        .returning();

      // Update user stats for both players
      const player1Id = gameData.player1Id;
      const player2Id = gameData.player2Id;

      // Determine winner: if winnerUserId provided, use it; otherwise assume player1=white, player2=black
      let actualWinnerUserId: number | null = null;
      if (winnerUserId) {
        actualWinnerUserId = winnerUserId;
      } else if (winnerColor === 'white') {
        actualWinnerUserId = player1Id; // Assume player1 is white
      } else if (winnerColor === 'black') {
        actualWinnerUserId = player2Id; // Assume player2 is black
      }
      // For draw, actualWinnerUserId remains null

      if (player1Id) {
        // Get or create stats for player1
        let stats1 = await tx.select().from(userStats).where(eq(userStats.userId, player1Id));
        if (!stats1[0]) {
          await tx.insert(userStats).values({ 
            userId: player1Id,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            rating: 1200,
            totalPoints: 0,
            level: 1
          });
          stats1 = await tx.select().from(userStats).where(eq(userStats.userId, player1Id));
        }

        const isWinner = actualWinnerUserId === player1Id;
        const isLoser = winnerColor !== 'draw' && !isWinner;
        
        await tx
          .update(userStats)
          .set({
            gamesPlayed: stats1[0].gamesPlayed + 1,
            gamesWon: stats1[0].gamesWon + (isWinner ? 1 : 0),
            gamesLost: stats1[0].gamesLost + (isLoser ? 1 : 0),
            totalPoints: stats1[0].totalPoints + (isWinner ? winnerPoints : 0),
            level: this.computeLevel(
              stats1[0].totalPoints + (isWinner ? winnerPoints : 0),
              stats1[0].gamesWon + (isWinner ? 1 : 0)
            ),
            updatedAt: new Date()
          })
          .where(eq(userStats.userId, player1Id));
      }

      if (player2Id) {
        // Get or create stats for player2
        let stats2 = await tx.select().from(userStats).where(eq(userStats.userId, player2Id));
        if (!stats2[0]) {
          await tx.insert(userStats).values({ 
            userId: player2Id,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            rating: 1200,
            totalPoints: 0,
            level: 1
          });
          stats2 = await tx.select().from(userStats).where(eq(userStats.userId, player2Id));
        }

        const isWinner = actualWinnerUserId === player2Id;
        const isLoser = winnerColor !== 'draw' && !isWinner;
        
        await tx
          .update(userStats)
          .set({
            gamesPlayed: stats2[0].gamesPlayed + 1,
            gamesWon: stats2[0].gamesWon + (isWinner ? 1 : 0),
            gamesLost: stats2[0].gamesLost + (isLoser ? 1 : 0),
            totalPoints: stats2[0].totalPoints + (isWinner ? winnerPoints : 0),
            level: this.computeLevel(
              stats2[0].totalPoints + (isWinner ? winnerPoints : 0),
              stats2[0].gamesWon + (isWinner ? 1 : 0)
            ),
            updatedAt: new Date()
          })
          .where(eq(userStats.userId, player2Id));
      }

      return updatedGame[0];
    });
  }

  // Leaderboard and level computation
  async getLeaderboard(limit: number = 50): Promise<Array<{ 
    id: number; 
    username: string; 
    isGuest: boolean;
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    rating: number;
    totalPoints: number;
    level: number;
  }>> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        isGuest: users.isGuest,
        gamesPlayed: userStats.gamesPlayed,
        gamesWon: userStats.gamesWon,
        gamesLost: userStats.gamesLost,
        rating: userStats.rating,
        totalPoints: userStats.totalPoints,
        level: userStats.level
      })
      .from(users)
      .innerJoin(userStats, eq(users.id, userStats.userId))
      .orderBy(desc(userStats.level), desc(userStats.totalPoints), desc(userStats.gamesWon))
      .limit(limit);

    return result;
  }

  computeLevel(totalPoints: number, gamesWon: number): number {
    // Level formula: level = 1 + floor((totalPoints + gamesWon*10) / 50)
    return 1 + Math.floor((totalPoints + gamesWon * 10) / 50);
  }
}

export const storage = new PostgresStorage();
