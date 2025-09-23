import { z } from "zod";

// Enhanced Journal Entry interface with comprehensive trade fields
export interface JournalEntry {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  notes: string;
  trade_data?: any;
  image_url?: string;
  
  // Enhanced trade-specific fields
  trade_date: string;
  pair_symbol: string;
  lot_size?: number;
  entry_price?: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  profit_loss?: number;
  trade_type?: 'BUY' | 'SELL';
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  tags: string[];
  timeframe?: string;
  strategy?: string;
  session?: 'LONDON' | 'NYC' | 'TOKYO' | 'SYDNEY';
}

export interface CreateJournalEntry {
  notes: string;
  trade_data?: any;
  image_url?: string;
  trade_date: string;
  pair_symbol: string;
  lot_size?: number;
  entry_price?: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  profit_loss?: number;
  trade_type?: 'BUY' | 'SELL';
  status?: 'OPEN' | 'CLOSED' | 'CANCELLED';
  tags?: string[];
  timeframe?: string;
  strategy?: string;
  session?: 'LONDON' | 'NYC' | 'TOKYO' | 'SYDNEY';
}

// Enhanced User Profile interface
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  account_type: 'live' | 'prop';
  timezone: string;
  broker?: string;
  preferences: any;
  dashboard_widgets?: string[];
  dashboard_layout?: any;
  dashboard_templates?: any;
  calendar_settings?: CalendarSettings;
  sidebar_settings?: SidebarSettings;
  created_at: string;
  updated_at: string;
}

// Media interface for trade screenshots
export interface Media {
  id: string;
  journal_entry_id: string;
  file_url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
}

// Tags interface for organizing trades
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  category?: 'timeframe' | 'strategy' | 'session' | 'custom';
  color: string;
  created_at: string;
}

// Calendar settings interface
export interface CalendarSettings {
  backgroundColor: string;
  borderColor: string;
  dayBackgroundColor: string;
  dayBorderColor: string;
}

// Sidebar settings interface
export interface SidebarSettings {
  primaryColor: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  headerFrom: string;
  headerTo: string;
  activeGradient: string;
  activeBorder: string;
  hoverColor: string;
}

// Enhanced Zod schemas for validation
export const createJournalEntrySchema = z.object({
  notes: z.string().min(1, "Notes are required"),
  trade_data: z.any().optional(),
  image_url: z.string().url().optional(),
  trade_date: z.string(), // ISO date string
  pair_symbol: z.string().min(1, "Trading pair/symbol is required"),
  lot_size: z.number().positive().optional(),
  entry_price: z.number().positive().optional(),
  exit_price: z.number().positive().optional(),
  stop_loss: z.number().positive().optional(),
  take_profit: z.number().positive().optional(),
  profit_loss: z.number().optional(),
  trade_type: z.enum(['BUY', 'SELL']).optional(),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).default('OPEN'),
  tags: z.array(z.string()).default([]),
  timeframe: z.string().optional(),
  strategy: z.string().optional(),
  session: z.enum(['LONDON', 'NYC', 'TOKYO', 'SYDNEY']).optional(),
});

export const updateJournalEntrySchema = z.object({
  notes: z.string().min(1).optional(),
  trade_data: z.any().optional(),
  image_url: z.string().url().optional(),
  trade_date: z.string().optional(),
  pair_symbol: z.string().min(1).optional(),
  lot_size: z.number().positive().optional(),
  entry_price: z.number().positive().optional(),
  exit_price: z.number().positive().optional(),
  stop_loss: z.number().positive().optional(),
  take_profit: z.number().positive().optional(),
  profit_loss: z.number().optional(),
  trade_type: z.enum(['BUY', 'SELL']).optional(),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).optional(),
  tags: z.array(z.string()).optional(),
  timeframe: z.string().optional(),
  strategy: z.string().optional(),
  session: z.enum(['LONDON', 'NYC', 'TOKYO', 'SYDNEY']).optional(),
});

export const createUserProfileSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  account_type: z.enum(['live', 'prop']).default('live'),
  timezone: z.string().default('UTC'),
  broker: z.string().optional(),
  preferences: z.any().default({}),
});

export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  category: z.enum(['timeframe', 'strategy', 'session', 'custom']).optional(),
  color: z.string().default('#3b82f6'),
});

// Types for backward compatibility
export type User = UserProfile;
export type InsertJournalEntry = CreateJournalEntry;