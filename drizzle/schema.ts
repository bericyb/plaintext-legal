import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * A founder-initiated research run. The profile and plan are stored as JSON text
 * so a report remains reproducible even as the matching engine evolves.
 */
export const scans = mysqlTable("scans", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 24 }).notNull().unique(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  companyDescription: text("companyDescription").notNull(),
  websiteUrl: varchar("websiteUrl", { length: 2048 }),
  source: mysqlEnum("source", ["founder", "domain", "utah"]).notNull().default("founder"),
  status: mysqlEnum("status", ["researching", "complete", "failed"]).notNull().default("researching"),
  profileJson: text("profileJson").notNull(),
  researchPlanJson: text("researchPlanJson").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A report is an immutable snapshot of the agent's evidence, reasoning, and action plan. */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  publicId: varchar("publicId", { length: 24 }).notNull().unique(),
  scanId: int("scanId").notNull(),
  reportJson: text("reportJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * An explicit founder request to receive a report or future report alerts.
 * The app does not infer contacts from public registration or domain data.
 */
export const reportEmailOptIns = mysqlTable("reportEmailOptIns", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["active", "unsubscribed"]).notNull().default("active"),
  consentAt: timestamp("consentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Scan = typeof scans.$inferSelect;
export type InsertScan = typeof scans.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
export type ReportEmailOptIn = typeof reportEmailOptIns.$inferSelect;
