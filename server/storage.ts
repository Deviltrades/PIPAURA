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

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserWidgets(id: string, widgets: string[]): Promise<User | undefined>;
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
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        isAdmin: userData.isAdmin || false,
        dashboardWidgets: [],
        calendarSettings: {
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
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.signals.set(id, signal);
    return signal;
  }

  async getSignals(): Promise<Signal[]> {
    return Array.from(this.signals.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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

export const storage = new MemStorage();
