import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isGuest: boolean("is_guest").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  player1Id: integer("player1_id").notNull().references(() => users.id),
  player2Id: integer("player2_id").references(() => users.id),
  gameState: jsonb("game_state").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("waiting"), // waiting, active, completed, abandoned
  winner: varchar("winner", { length: 10 }), // white, black, draw
  whitePoints: integer("white_points").notNull().default(0),
  blackPoints: integer("black_points").notNull().default(0),
  completedAt: timestamp("completed_at"),
  winnerUserId: integer("winner_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const gameMoves = pgTable("game_moves", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  playerId: integer("player_id").notNull().references(() => users.id),
  moveNumber: integer("move_number").notNull(),
  moveData: jsonb("move_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  gamesPlayed: integer("games_played").default(0).notNull(),
  gamesWon: integer("games_won").default(0).notNull(),
  gamesLost: integer("games_lost").default(0).notNull(),
  rating: integer("rating").default(1200).notNull(),
  totalPoints: integer("total_points").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isGuest: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  player1Id: true,
  player2Id: true,
  gameState: true,
  status: true,
});

export const insertGameMoveSchema = createInsertSchema(gameMoves).pick({
  gameId: true,
  playerId: true,
  moveNumber: true,
  moveData: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).pick({
  userId: true,
  sessionToken: true,
  expiresAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  userId: true,
  gamesPlayed: true,
  gamesWon: true,
  gamesLost: true,
  rating: true,
  totalPoints: true,
  level: true,
});

export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type GameMove = typeof gameMoves.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGameMove = z.infer<typeof insertGameMoveSchema>;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
