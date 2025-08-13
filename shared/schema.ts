import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  dashboardWidgets: text("dashboard_widgets").array().default([]),
  dashboardLayout: jsonb("dashboard_layout"),
  calendarSettings: jsonb("calendar_settings").default({
    backgroundColor: "#1a1a1a",
    borderColor: "#374151",
    dayBackgroundColor: "#2d2d2d",
    dayBorderColor: "#4b5563"
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enums for trade types and statuses
export const tradeTypeEnum = pgEnum("trade_type", ["BUY", "SELL"]);
export const tradeStatusEnum = pgEnum("trade_status", ["OPEN", "CLOSED", "CANCELLED"]);
export const instrumentTypeEnum = pgEnum("instrument_type", ["FOREX", "INDICES", "CRYPTO"]);

// Trades table
export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  instrument: varchar("instrument").notNull(),
  instrumentType: instrumentTypeEnum("instrument_type").notNull(),
  tradeType: tradeTypeEnum("trade_type").notNull(),
  positionSize: decimal("position_size", { precision: 10, scale: 2 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 10, scale: 5 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 10, scale: 5 }),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 5 }),
  takeProfit: decimal("take_profit", { precision: 10, scale: 5 }),
  pnl: decimal("pnl", { precision: 10, scale: 2 }),
  status: tradeStatusEnum("status").default("OPEN"),
  notes: text("notes"),
  attachments: text("attachments").array(),
  entryDate: timestamp("entry_date").defaultNow(),
  exitDate: timestamp("exit_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Signals table
export const signals = pgTable("signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  instrument: varchar("instrument").notNull(),
  instrumentType: instrumentTypeEnum("instrument_type").notNull(),
  tradeType: tradeTypeEnum("trade_type").notNull(),
  entryPrice: decimal("entry_price", { precision: 10, scale: 5 }).notNull(),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 5 }),
  takeProfit: decimal("take_profit", { precision: 10, scale: 5 }),
  riskReward: varchar("risk_reward"),
  description: text("description").notNull(),
  status: varchar("status").default("ACTIVE"),
  result: varchar("result"),
  resultPips: decimal("result_pips", { precision: 10, scale: 1 }),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSignalSchema = createInsertSchema(signals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Calendar settings type
export interface CalendarSettings {
  backgroundColor: string;
  borderColor: string;
  dayBackgroundColor: string;
  dayBorderColor: string;
}

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertSignal = z.infer<typeof insertSignalSchema>;
export type Signal = typeof signals.$inferSelect;
