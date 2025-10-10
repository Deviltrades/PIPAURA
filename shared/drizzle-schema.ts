import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  decimal, 
  pgEnum,
  uuid,
  jsonb,
  integer
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums for trades
export const instrumentTypeEnum = pgEnum('instrument_type', ['FOREX', 'INDICES', 'CRYPTO', 'FUTURES', 'STOCKS']);
export const tradeTypeEnum = pgEnum('trade_type', ['BUY', 'SELL']);
export const tradeStatusEnum = pgEnum('trade_status', ['OPEN', 'CLOSED', 'CANCELLED']);
export const accountTypeEnum = pgEnum('account_type', ['live', 'prop']);
export const planTypeEnum = pgEnum('plan_type', ['demo', 'basic', 'premium']);
export const sessionEnum = pgEnum('session', ['LONDON', 'NYC', 'TOKYO', 'SYDNEY']);
export const tagCategoryEnum = pgEnum('tag_category', ['timeframe', 'strategy', 'session', 'custom']);
export const journalStatusEnum = pgEnum('journal_status', ['OPEN', 'CLOSED', 'CANCELLED']);
export const tradeAccountTypeEnum = pgEnum('account_type_enum', ['demo', 'proprietary', 'live']);
export const marketTypeEnum = pgEnum('market_type_enum', ['forex', 'futures', 'stocks', 'crypto']);

// Trade Accounts table
export const tradeAccounts = pgTable('trade_accounts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  account_type: tradeAccountTypeEnum('account_type').notNull(),
  market_type: marketTypeEnum('market_type').notNull(),
  broker_name: text('broker_name').notNull(),
  account_name: text('account_name').notNull(),
  starting_balance: decimal('starting_balance', { precision: 12, scale: 2 }).notNull(),
  current_balance: decimal('current_balance', { precision: 12, scale: 2 }),
  is_active: integer('is_active').default(1).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// Trades table
export const trades = pgTable('trades', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  account_id: uuid('account_id'),
  instrument: text('instrument').notNull(),
  instrument_type: instrumentTypeEnum('instrument_type').notNull(),
  trade_type: tradeTypeEnum('trade_type').notNull(),
  position_size: decimal('position_size').notNull(),
  entry_price: decimal('entry_price').notNull(),
  exit_price: decimal('exit_price'),
  stop_loss: decimal('stop_loss'),
  take_profit: decimal('take_profit'),
  pnl: decimal('pnl'),
  status: tradeStatusEnum('status').default('OPEN'),
  notes: text('notes'),
  attachments: text('attachments').array(),
  entry_date: timestamp('entry_date', { withTimezone: true }),
  exit_date: timestamp('exit_date', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// User profiles table
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  supabase_user_id: uuid('supabase_user_id').notNull().unique(),
  email: text('email').notNull(),
  username: text('username'),
  first_name: text('first_name'),
  last_name: text('last_name'),
  profile_image_url: text('profile_image_url'),
  account_type: accountTypeEnum('account_type').default('live'),
  timezone: text('timezone').default('UTC'),
  broker: text('broker'),
  preferences: jsonb('preferences').default({}),
  dashboard_widgets: text('dashboard_widgets').array(),
  dashboard_layout: jsonb('dashboard_layout'),
  dashboard_templates: jsonb('dashboard_templates'),
  calendar_settings: jsonb('calendar_settings'),
  sidebar_settings: jsonb('sidebar_settings'),
  plan_type: planTypeEnum('plan_type').default('demo'),
  storage_used_mb: integer('storage_used_mb').default(0),
  storage_limit_mb: integer('storage_limit_mb').default(0),
  image_count: integer('image_count').default(0),
  image_limit: integer('image_limit').default(0),
  account_limit: integer('account_limit').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// Journal entries table
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  notes: text('notes').notNull(),
  trade_data: jsonb('trade_data'),
  image_url: text('image_url'),
  trade_date: text('trade_date').notNull(),
  pair_symbol: text('pair_symbol').notNull(),
  lot_size: decimal('lot_size'),
  entry_price: decimal('entry_price'),
  exit_price: decimal('exit_price'),
  stop_loss: decimal('stop_loss'),
  take_profit: decimal('take_profit'),
  profit_loss: decimal('profit_loss'),
  trade_type: tradeTypeEnum('trade_type'),
  status: journalStatusEnum('status').default('OPEN'),
  tags: text('tags').array().default([]),
  timeframe: text('timeframe'),
  strategy: text('strategy'),
  session: sessionEnum('session'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// Tags table
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  name: text('name').notNull(),
  category: tagCategoryEnum('category'),
  color: text('color').default('#3b82f6'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`)
});

// Media table
export const media = pgTable('media', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  journal_entry_id: uuid('journal_entry_id').notNull(),
  file_url: text('file_url').notNull(),
  file_name: text('file_name'),
  file_size: integer('file_size'),
  mime_type: text('mime_type'),
  uploaded_at: timestamp('uploaded_at', { withTimezone: true }).default(sql`now()`)
});