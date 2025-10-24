import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  decimal, 
  pgEnum,
  uuid,
  jsonb,
  integer,
  date,
  serial,
  bigint
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums for trades
export const instrumentTypeEnum = pgEnum('instrument_type', ['FOREX', 'INDICES', 'CRYPTO', 'FUTURES', 'STOCKS']);
export const tradeTypeEnum = pgEnum('trade_type', ['BUY', 'SELL']);
export const tradeStatusEnum = pgEnum('trade_status', ['OPEN', 'CLOSED', 'CANCELLED']);
export const accountTypeEnum = pgEnum('account_type', ['live', 'prop']);
export const planTypeEnum = pgEnum('plan_type', ['lite', 'core', 'elite']);
export const sessionEnum = pgEnum('session', ['LONDON', 'NYC', 'TOKYO', 'SYDNEY']);
export const tagCategoryEnum = pgEnum('tag_category', ['timeframe', 'strategy', 'session', 'custom']);
export const journalStatusEnum = pgEnum('journal_status', ['OPEN', 'CLOSED', 'CANCELLED']);
export const tradeAccountTypeEnum = pgEnum('account_type_enum', ['demo', 'proprietary_firm', 'live_personal', 'live_company']);
export const marketTypeEnum = pgEnum('market_type_enum', ['forex', 'futures', 'stocks', 'crypto']);
export const accountSourceEnum = pgEnum('account_source', ['manual', 'myfxbook']);
export const cashflowTypeEnum = pgEnum('cashflow_type', ['deposit', 'withdrawal']);
export const expenseTypeEnum = pgEnum('expense_type', ['software', 'education', 'data', 'hardware', 'other']);
export const challengeTypeEnum = pgEnum('challenge_type', ['instant', '1-step', '2-step', '3-step']);
export const fundingPhaseEnum = pgEnum('funding_phase', ['challenge', 'verification', 'funded', 'scaling']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'expired', 'past_due', 'trialing']);
export const userTagCategoryEnum = pgEnum('user_tag_category', ['strategy', 'risk_management', 'market_context', 'session_timing', 'psychological', 'outcome', 'bias_alignment', 'emotion_exit', 'custom']);

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
  source: accountSourceEnum('source').default('manual').notNull(),
  is_active: integer('is_active').default(1).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// Trades table
export const trades = pgTable('trades', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  account_id: uuid('account_id'),
  ticket_id: text('ticket_id').unique(),
  instrument: text('instrument').notNull(),
  instrument_type: instrumentTypeEnum('instrument_type').notNull(),
  trade_type: tradeTypeEnum('trade_type').notNull(),
  position_size: decimal('position_size').notNull(),
  entry_price: decimal('entry_price').notNull(),
  exit_price: decimal('exit_price'),
  stop_loss: decimal('stop_loss'),
  take_profit: decimal('take_profit'),
  pnl: decimal('pnl'),
  swap: decimal('swap', { precision: 10, scale: 2 }),
  commission: decimal('commission', { precision: 10, scale: 2 }),
  currency: text('currency').default('USD'),
  fx_to_report: decimal('fx_to_report', { precision: 10, scale: 6 }),
  pnl_report: decimal('pnl_report', { precision: 12, scale: 2 }),
  swap_report: decimal('swap_report', { precision: 10, scale: 2 }),
  commission_report: decimal('commission_report', { precision: 10, scale: 2 }),
  status: tradeStatusEnum('status').default('OPEN'),
  notes: text('notes'),
  attachments: text('attachments').array(),
  entry_date: timestamp('entry_date', { withTimezone: true }),
  exit_date: timestamp('exit_date', { withTimezone: true }),
  session_tag: text('session_tag'),
  holding_time_minutes: integer('holding_time_minutes'),
  profit_per_lot: decimal('profit_per_lot', { precision: 10, scale: 2 }),
  upload_source: text('upload_source'),
  setup_type: text('setup_type'),
  strategy: text('strategy'),
  risk_amount: decimal('risk_amount', { precision: 10, scale: 2 }),
  custom_tags: text('custom_tags').array().default([]),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// Strategies table
export const strategies = pgTable('strategies', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('active'), // active, testing, inactive
  is_active: integer('is_active').default(1).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// Playbook Rules table
export const playbookRules = pgTable('playbook_rules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  category: text('category').notNull(), // risk_management, entry, exit, psychology
  rule_text: text('rule_text').notNull(),
  rule_type: text('rule_type').default('recommended'), // mandatory, recommended
  is_active: integer('is_active').default(1).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// User Tags table - for custom tag definitions
export const userTags = pgTable('user_tags', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  name: text('name').notNull(),
  category: userTagCategoryEnum('category').notNull(),
  color: text('color').default('#06b6d4'), // Default cyan color
  is_predefined: integer('is_predefined').default(0).notNull(), // 1 = pre-made filter, 0 = user-created
  is_active: integer('is_active').default(1).notNull(),
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
  plan_type: planTypeEnum('plan_type').default('lite'),
  subscription_status: subscriptionStatusEnum('subscription_status').default('active'),
  current_period_end: timestamp('current_period_end', { withTimezone: true }),
  stripe_customer_id: text('stripe_customer_id'),
  stripe_subscription_id: text('stripe_subscription_id'),
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

// Tax Profile table
export const taxProfile = pgTable('tax_profile', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull().unique(),
  reporting_currency: text('reporting_currency').default('USD').notNull(),
  tax_year_start_month: integer('tax_year_start_month').default(1).notNull(),
  include_swap_in_income: integer('include_swap_in_income').default(1).notNull(),
  include_commission_deduction: integer('include_commission_deduction').default(1).notNull(),
  include_unrealized_pnl: integer('include_unrealized_pnl').default(0).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// Account Cashflows table
export const accountCashflows = pgTable('account_cashflows', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  account_id: uuid('account_id').notNull(),
  flow_type: cashflowTypeEnum('flow_type').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  fx_to_report: decimal('fx_to_report', { precision: 10, scale: 6 }),
  amount_report: decimal('amount_report', { precision: 12, scale: 2 }),
  flow_date: timestamp('flow_date', { withTimezone: true }).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`)
});

// Tax Expenses table
export const taxExpenses = pgTable('tax_expenses', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  expense_type: expenseTypeEnum('expense_type').notNull(),
  vendor: text('vendor').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  fx_to_report: decimal('fx_to_report', { precision: 10, scale: 6 }),
  amount_report: decimal('amount_report', { precision: 12, scale: 2 }),
  expense_date: timestamp('expense_date', { withTimezone: true }).notNull(),
  receipt_url: text('receipt_url'),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`)
});

// Market News table (Finnhub integration)
export const marketNews = pgTable('market_news', {
  id: serial('id').primaryKey(),
  headline: text('headline').notNull(),
  summary: text('summary'),
  source: text('source'),
  category: text('category'),
  datetime: bigint('datetime', { mode: 'number' }).notNull(),
  url: text('url'),
  image: text('image'),
  related: text('related'),
  impact_level: varchar('impact_level', { length: 20 }).default('low'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`)
});

// Emotional Logs table (allows multiple logs per day)
export const emotionalLogs = pgTable('emotional_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  log_date: date('log_date').notNull().default(sql`current_date`),
  log_time: timestamp('log_time', { withTimezone: true }).default(sql`now()`),
  mood: integer('mood').notNull(),
  energy: integer('energy').notNull(),
  tags: text('tags').array(),
  note: text('note'),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`)
});

// Prop Firm Tracker table
export const propFirmTracker = pgTable('prop_firm_tracker', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull(),
  account_id: uuid('account_id').notNull().unique(),
  challenge_type: challengeTypeEnum('challenge_type').notNull(),
  current_phase: fundingPhaseEnum('current_phase').default('challenge').notNull(),
  daily_max_loss: decimal('daily_max_loss', { precision: 12, scale: 2 }).notNull(),
  overall_max_loss: decimal('overall_max_loss', { precision: 12, scale: 2 }).notNull(),
  profit_target: decimal('profit_target', { precision: 12, scale: 2 }).notNull(),
  daily_loss_percentage: decimal('daily_loss_percentage', { precision: 5, scale: 2 }).default('5.00'), // Default 5%
  overall_loss_percentage: decimal('overall_loss_percentage', { precision: 5, scale: 2 }).default('10.00'), // Default 10%
  daily_starting_balance: decimal('daily_starting_balance', { precision: 12, scale: 2 }), // Balance at start of day
  last_balance_update: date('last_balance_update'), // Date when daily_starting_balance was set
  current_daily_loss: decimal('current_daily_loss', { precision: 12, scale: 2 }).default('0'),
  current_overall_loss: decimal('current_overall_loss', { precision: 12, scale: 2 }).default('0'),
  current_profit: decimal('current_profit', { precision: 12, scale: 2 }).default('0'),
  phase_start_date: timestamp('phase_start_date', { withTimezone: true }).default(sql`now()`),
  is_active: integer('is_active').default(1).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// MyFxBook Linked Accounts table (stores encrypted credentials per user)
export const myfxbookLinkedAccounts = pgTable('myfxbook_linked_accounts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid('user_id').notNull().unique(), // One MyFxBook connection per user
  email: text('email').notNull(),
  encrypted_password: text('encrypted_password').notNull(), // Encrypted with pgcrypto or backend encryption
  session_id: text('session_id'), // MyFxBook session token
  session_expires_at: timestamp('session_expires_at', { withTimezone: true }),
  last_sync_at: timestamp('last_sync_at', { withTimezone: true }),
  sync_status: text('sync_status').default('active'), // active, error, paused
  sync_error_message: text('sync_error_message'),
  is_active: integer('is_active').default(1).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});

// MyFxBook Accounts table (stores individual trading accounts from MyFxBook)
export const myfxbookAccounts = pgTable('myfxbook_accounts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  linked_account_id: uuid('linked_account_id').notNull(), // References myfxbook_linked_accounts
  user_id: uuid('user_id').notNull(),
  pipaura_account_id: uuid('pipaura_account_id'), // Maps to trade_accounts.id (optional)
  myfxbook_account_id: text('myfxbook_account_id').notNull().unique(), // MyFxBook's account ID
  account_name: text('account_name').notNull(),
  broker: text('broker'),
  currency: text('currency').default('USD'),
  balance: decimal('balance', { precision: 12, scale: 2 }),
  equity: decimal('equity', { precision: 12, scale: 2 }),
  gain: decimal('gain', { precision: 10, scale: 2 }), // Percentage gain
  is_active: integer('is_active').default(1).notNull(),
  auto_sync_enabled: integer('auto_sync_enabled').default(1).notNull(),
  last_trade_id: text('last_trade_id'), // Track last synced trade to avoid duplicates
  created_at: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updated_at: timestamp('updated_at', { withTimezone: true }).default(sql`now()`)
});