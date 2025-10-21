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

// Trading Account interfaces
export interface TradeAccount {
  id: string;
  user_id: string;
  account_type: 'demo' | 'proprietary_firm' | 'live_personal' | 'live_company';
  market_type: 'forex' | 'futures' | 'stocks' | 'crypto';
  broker_name: string;
  account_name: string;
  starting_balance: number;
  current_balance?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTradeAccount {
  account_type: 'demo' | 'proprietary_firm' | 'live_personal' | 'live_company';
  market_type: 'forex' | 'futures' | 'stocks' | 'crypto';
  broker_name: string;
  account_name: string;
  starting_balance: number;
}

// Enhanced User Profile interface with role-based access control
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
  
  // Role-based access control fields
  plan_type: 'lite' | 'core' | 'elite';
  storage_used_mb: number;
  storage_limit_mb: number;
  image_count: number;
  image_limit: number;
  account_limit: number;
}

// Plan configuration type
export interface PlanConfig {
  name: string;
  storage_limit_mb: number;
  image_limit: number;
  account_limit: number;
  features: {
    dashboard: boolean;
    calendar: boolean;
    notes_uploads: boolean;
    charts: boolean;
    strategy_playbook: boolean;
    ai_mentor: boolean;
    multiple_accounts: boolean;
  };
  ui_restrictions: {
    read_only: boolean;
    disabled_buttons: string[];
  };
}

// Plan configurations
export const PLAN_CONFIGS: Record<'lite' | 'core' | 'elite', PlanConfig> = {
  lite: {
    name: 'Lite',
    storage_limit_mb: 1024, // 1GB
    image_limit: 999999,
    account_limit: 1,
    features: {
      dashboard: true,
      calendar: true,
      notes_uploads: true,
      charts: true,
      strategy_playbook: true,
      ai_mentor: false,
      multiple_accounts: false,
    },
    ui_restrictions: {
      read_only: false,
      disabled_buttons: [],
    },
  },
  core: {
    name: 'Core',
    storage_limit_mb: 2048, // 2GB
    image_limit: 999999,
    account_limit: 10,
    features: {
      dashboard: true,
      calendar: true,
      notes_uploads: true,
      charts: true,
      strategy_playbook: true,
      ai_mentor: true,
      multiple_accounts: true,
    },
    ui_restrictions: {
      read_only: false,
      disabled_buttons: [],
    },
  },
  elite: {
    name: 'Elite',
    storage_limit_mb: 10240, // 10GB
    image_limit: 999999,
    account_limit: 999999, // unlimited
    features: {
      dashboard: true,
      calendar: true,
      notes_uploads: true,
      charts: true,
      strategy_playbook: true,
      ai_mentor: true,
      multiple_accounts: true,
    },
    ui_restrictions: {
      read_only: false,
      disabled_buttons: [],
    },
  },
};

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
  backgroundColor?: string;
  borderColor?: string;
  dayBackgroundColor?: string;
  dayBorderColor?: string;
  showWeekends?: boolean;
  showWeeklyTotals?: boolean;
  showMonthlySummary?: boolean;
  showConsistencyTracker?: boolean;
  displayMode?: 'percentage' | 'dollar';
  clearView?: boolean;
  monthlyStatsConfig?: {
    riskReward: boolean;
    totalPnL: boolean;
    daysTraded: boolean;
    totalTrades: boolean;
    winRate: boolean;
  };
  selectedAccount?: string;
  selectedSymbol?: string;
  selectedStrategy?: string;
  selectedDirection?: string;
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

// Trade interfaces matching the trades table structure
export interface Trade {
  id: string;
  user_id: string;
  instrument: string;
  instrument_type: 'FOREX' | 'INDICES' | 'CRYPTO' | 'FUTURES' | 'STOCKS';
  trade_type: 'BUY' | 'SELL';
  position_size: number;
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  pnl?: number;
  swap?: number;
  commission?: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  notes?: string;
  attachments?: string[];
  entry_date?: string;
  exit_date?: string;
  session_tag?: string;
  holding_time_minutes?: number;
  profit_per_lot?: number;
  upload_source?: 'Manual' | 'OCR AI' | 'CSV' | 'Excel' | 'HTML';
  created_at?: string;
  updated_at?: string;
}

export interface CreateTrade {
  instrument: string;
  instrument_type: 'FOREX' | 'INDICES' | 'CRYPTO' | 'FUTURES' | 'STOCKS';
  trade_type: 'BUY' | 'SELL';
  position_size: number;
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  pnl?: number;
  swap?: number;
  commission?: number;
  status?: 'OPEN' | 'CLOSED' | 'CANCELLED';
  notes?: string;
  attachments?: string[];
  entry_date?: string;
  exit_date?: string;
  upload_source?: 'Manual' | 'OCR AI' | 'CSV' | 'Excel' | 'HTML';
}

export interface UpdateTrade {
  instrument?: string;
  instrument_type?: 'FOREX' | 'INDICES' | 'CRYPTO' | 'FUTURES' | 'STOCKS';
  trade_type?: 'BUY' | 'SELL';
  position_size?: number;
  entry_price?: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  pnl?: number;
  status?: 'OPEN' | 'CLOSED' | 'CANCELLED';
  notes?: string;
  attachments?: string[];
  entry_date?: string;
  exit_date?: string;
}

// Zod schemas for Trade validation
export const createTradeSchema = z.object({
  instrument: z.string().min(1, "Instrument is required"),
  instrument_type: z.enum(['FOREX', 'INDICES', 'CRYPTO', 'FUTURES', 'STOCKS']),
  trade_type: z.enum(['BUY', 'SELL']),
  position_size: z.number().positive("Position size must be positive"),
  entry_price: z.number().positive("Entry price must be positive"),
  exit_price: z.number().positive().optional(),
  stop_loss: z.number().positive().optional(),
  take_profit: z.number().positive().optional(),
  pnl: z.number().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).default('OPEN'),
  notes: z.string().optional(),
  attachments: z.array(z.string()).default([]),
  entry_date: z.string().optional(),
  exit_date: z.string().optional(),
  upload_source: z.enum(['Manual', 'OCR AI', 'CSV', 'Excel', 'HTML']).optional(),
});

export const updateTradeSchema = z.object({
  instrument: z.string().min(1).optional(),
  instrument_type: z.enum(['FOREX', 'INDICES', 'CRYPTO', 'FUTURES', 'STOCKS']).optional(),
  trade_type: z.enum(['BUY', 'SELL']).optional(),
  position_size: z.number().positive().optional(),
  entry_price: z.number().positive().optional(),
  exit_price: z.number().positive().optional(),
  stop_loss: z.number().positive().optional(),
  take_profit: z.number().positive().optional(),
  pnl: z.number().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  entry_date: z.string().optional(),
  exit_date: z.string().optional(),
  upload_source: z.enum(['Manual', 'OCR AI', 'CSV', 'Excel', 'HTML']).optional(),
});

// Prop Firm Tracker interfaces
export interface PropFirmTracker {
  id: string;
  user_id: string;
  account_id: string;
  challenge_type: 'instant' | '1-step' | '2-step' | '3-step';
  current_phase: 'challenge' | 'verification' | 'funded' | 'scaling';
  daily_max_loss: number;
  overall_max_loss: number;
  profit_target: number;
  current_daily_loss?: number;
  current_overall_loss?: number;
  current_profit?: number;
  phase_start_date?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePropFirmTracker {
  account_id: string;
  challenge_type: 'instant' | '1-step' | '2-step' | '3-step';
  daily_max_loss: number;
  overall_max_loss: number;
  profit_target: number;
}

export interface UpdatePropFirmTracker {
  challenge_type?: 'instant' | '1-step' | '2-step' | '3-step';
  current_phase?: 'challenge' | 'verification' | 'funded' | 'scaling';
  daily_max_loss?: number;
  overall_max_loss?: number;
  profit_target?: number;
  current_daily_loss?: number;
  current_overall_loss?: number;
  current_profit?: number;
  phase_start_date?: string;
  is_active?: boolean;
}

// Zod schemas for PropFirmTracker validation
export const createPropFirmTrackerSchema = z.object({
  account_id: z.string().uuid("Invalid account ID"),
  challenge_type: z.enum(['instant', '1-step', '2-step', '3-step']),
  daily_max_loss: z.number().positive("Daily max loss must be positive"),
  overall_max_loss: z.number().positive("Overall max loss must be positive"),
  profit_target: z.number().positive("Profit target must be positive"),
});

export const updatePropFirmTrackerSchema = z.object({
  challenge_type: z.enum(['instant', '1-step', '2-step', '3-step']).optional(),
  current_phase: z.enum(['challenge', 'verification', 'funded', 'scaling']).optional(),
  daily_max_loss: z.number().positive().optional(),
  overall_max_loss: z.number().positive().optional(),
  profit_target: z.number().positive().optional(),
  current_daily_loss: z.number().optional(),
  current_overall_loss: z.number().optional(),
  current_profit: z.number().optional(),
  phase_start_date: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Tax Reports interfaces
export interface TaxProfile {
  id: string;
  user_id: string;
  report_currency: string;
  trader_status: boolean;
  tax_deductible_expenses_enabled: boolean;
  include_swap_in_income: boolean;
  include_commission_deduction: boolean;
  include_unrealized_pnl: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TaxExpense {
  id: string;
  user_id: string;
  expense_type: 'software' | 'education' | 'data' | 'hardware' | 'other';
  vendor: string;
  amount: string;
  currency: string;
  expense_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTaxExpense {
  expense_type: 'software' | 'education' | 'data' | 'hardware' | 'other';
  vendor: string;
  amount: string;
  currency: string;
  expense_date: string;
  notes?: string;
}

export interface UpdateTaxProfile {
  report_currency?: string;
  trader_status?: boolean;
  tax_deductible_expenses_enabled?: boolean;
  include_swap_in_income?: boolean;
  include_commission_deduction?: boolean;
  include_unrealized_pnl?: boolean;
}

// Zod schemas for tax validation
export const createTaxExpenseSchema = z.object({
  expense_type: z.enum(['software', 'education', 'data', 'hardware', 'other']),
  vendor: z.string().min(1, "Vendor name is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default('USD'),
  expense_date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export const updateTaxProfileSchema = z.object({
  report_currency: z.string().optional(),
  trader_status: z.boolean().optional(),
  tax_deductible_expenses_enabled: z.boolean().optional(),
  include_swap_in_income: z.boolean().optional(),
  include_commission_deduction: z.boolean().optional(),
  include_unrealized_pnl: z.boolean().optional(),
});

// Re-export Drizzle tables for database migrations
export * from './drizzle-schema';

// Types for backward compatibility
export type User = UserProfile;
export type InsertJournalEntry = CreateJournalEntry;
export type InsertTrade = CreateTrade;