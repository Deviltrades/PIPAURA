import {
  users,
  trades,
  signals,
  type User,
  type UpsertUser,
  type Trade,
  type InsertTrade,
  type Signal,
  type InsertSignal,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserWidgets(id: string, widgets: string[]): Promise<User | undefined>;
  updateUserDashboardLayouts(id: string, layouts: any): Promise<User | undefined>;
  updateUserCalendarSettings(id: string, calendarSettings: any): Promise<User | undefined>;
  
  // Trade operations
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTrade(id: string): Promise<Trade | undefined>;
  getTradesByUser(userId: string): Promise<Trade[]>;
  updateTrade(id: string, updates: Partial<InsertTrade>): Promise<Trade | undefined>;
  deleteTrade(id: string): Promise<boolean>;
  
  // Signal operations
  createSignal(signal: InsertSignal): Promise<Signal>;
  getSignals(): Promise<Signal[]>;
  getSignal(id: string): Promise<Signal | undefined>;
  updateSignal(id: string, updates: Partial<InsertSignal>): Promise<Signal | undefined>;
  deleteSignal(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private trades: Map<string, Trade> = new Map();
  private signals: Map<string, Signal> = new Map();

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const id = randomUUID();
    const newUser: User = {
      id,
      email: userData.email!,
      password: userData.password!,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      isAdmin: userData.isAdmin || false,
      dashboardWidgets: userData.dashboardWidgets || [],
      dashboardLayout: userData.dashboardLayout || {},
      calendarSettings: userData.calendarSettings || {
        backgroundColor: "#1a1a1a",
        borderColor: "#374151",
        dayBackgroundColor: "#2d2d2d",
        dayBorderColor: "#4b5563"
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = Array.from(this.users.values()).find(
      (user) => user.id === userData.id
    );

    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(existingUser.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        id: userData.id || randomUUID(),
        email: userData.email!,
        password: userData.password!,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        isAdmin: userData.isAdmin || false,
        dashboardWidgets: userData.dashboardWidgets || [],
        dashboardLayout: userData.dashboardLayout || {},
        calendarSettings: userData.calendarSettings || {
          backgroundColor: "#1a1a1a",
          borderColor: "#374151",
          dayBackgroundColor: "#2d2d2d",
          dayBorderColor: "#4b5563"
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(newUser.id, newUser);
      return newUser;
    }
  }

  async updateUserWidgets(id: string, widgets: string[]): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
      dashboardWidgets: widgets,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserDashboardLayouts(id: string, layouts: any): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
      dashboardLayout: layouts,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserCalendarSettings(id: string, calendarSettings: any): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
      calendarSettings: calendarSettings,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Trade operations
  async createTrade(tradeData: InsertTrade): Promise<Trade> {
    const id = randomUUID();
    const trade: Trade = {
      id,
      ...tradeData,
      exitPrice: tradeData.exitPrice || null,
      stopLoss: tradeData.stopLoss || null,
      takeProfit: tradeData.takeProfit || null,
      pnl: tradeData.pnl || null,
      notes: tradeData.notes || null,
      attachments: tradeData.attachments || null,
      exitDate: tradeData.exitDate || null,
      entryDate: tradeData.entryDate || new Date(),
      status: tradeData.status || "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.trades.set(id, trade);
    return trade;
  }

  async getTrade(id: string): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async getTradesByUser(userId: string): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });
  }

  async updateTrade(id: string, updates: Partial<InsertTrade>): Promise<Trade | undefined> {
    const existingTrade = this.trades.get(id);
    if (!existingTrade) return undefined;

    const updatedTrade: Trade = {
      ...existingTrade,
      ...updates,
      updatedAt: new Date(),
    };
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }

  async deleteTrade(id: string): Promise<boolean> {
    return this.trades.delete(id);
  }

  // Signal operations
  async createSignal(signalData: InsertSignal): Promise<Signal> {
    const id = randomUUID();
    const signal: Signal = {
      id,
      ...signalData,
      stopLoss: signalData.stopLoss || null,
      takeProfit: signalData.takeProfit || null,
      result: signalData.result || null,
      status: signalData.status || null,
      closedAt: signalData.closedAt || null,
      riskReward: signalData.riskReward || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.signals.set(id, signal);
    return signal;
  }

  async getSignals(): Promise<Signal[]> {
    return Array.from(this.signals.values())
      .sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return bTime - aTime;
      });
  }

  async getSignal(id: string): Promise<Signal | undefined> {
    return this.signals.get(id);
  }

  async updateSignal(id: string, updates: Partial<InsertSignal>): Promise<Signal | undefined> {
    const existingSignal = this.signals.get(id);
    if (!existingSignal) return undefined;

    const updatedSignal: Signal = {
      ...existingSignal,
      ...updates,
      updatedAt: new Date(),
    };
    this.signals.set(id, updatedSignal);
    return updatedSignal;
  }

  async deleteSignal(id: string): Promise<boolean> {
    return this.signals.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserWidgets(id: string, widgets: string[]): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        dashboardWidgets: widgets,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserDashboardLayouts(id: string, layouts: any): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        dashboardLayout: layouts,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserCalendarSettings(id: string, calendarSettings: any): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        calendarSettings: calendarSettings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Trade operations
  async createTrade(tradeData: InsertTrade): Promise<Trade> {
    const [trade] = await db.insert(trades).values(tradeData).returning();
    return trade;
  }

  async getTrade(id: string): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  async getTradesByUser(userId: string): Promise<Trade[]> {
    const userTrades = await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(trades.createdAt);
    return userTrades.reverse(); // Show newest first
  }

  async updateTrade(id: string, updates: Partial<InsertTrade>): Promise<Trade | undefined> {
    const [trade] = await db
      .update(trades)
      .set({ 
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(trades.id, id))
      .returning();
    return trade;
  }

  async deleteTrade(id: string): Promise<boolean> {
    const result = await db.delete(trades).where(eq(trades.id, id));
    return result.rowCount > 0;
  }

  // Signal operations
  async createSignal(signalData: InsertSignal): Promise<Signal> {
    const [signal] = await db.insert(signals).values(signalData).returning();
    return signal;
  }

  async getSignals(): Promise<Signal[]> {
    const allSignals = await db
      .select()
      .from(signals)
      .orderBy(signals.createdAt);
    return allSignals.reverse(); // Show newest first
  }

  async getSignal(id: string): Promise<Signal | undefined> {
    const [signal] = await db.select().from(signals).where(eq(signals.id, id));
    return signal;
  }

  async updateSignal(id: string, updates: Partial<InsertSignal>): Promise<Signal | undefined> {
    const [signal] = await db
      .update(signals)
      .set({ 
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(signals.id, id))
      .returning();
    return signal;
  }

  async deleteSignal(id: string): Promise<boolean> {
    const result = await db.delete(signals).where(eq(signals.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
