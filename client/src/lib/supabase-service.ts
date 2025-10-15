import { supabase } from './supabase';
import type { 
  JournalEntry, 
  UserProfile, 
  CalendarSettings,
  SidebarSettings,
  TradeAccount,
  CreateTradeAccount
} from '@shared/schema';

// Helper function to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Fundamental Bias operations
export async function getFundamentalBias() {
  const { data, error } = await supabase
    .from('fundamental_bias')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCurrencyScores() {
  const { data, error } = await supabase
    .from('currency_scores')
    .select('*')
    .order('window_end', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

export async function getIndexBias() {
  const { data, error } = await supabase
    .from('index_bias')
    .select('*')
    .order('updated_at', { ascending: false});

  if (error) throw error;
  return data;
}

export async function getMarketDrivers() {
  const { data, error } = await supabase
    .from('market_drivers')
    .select('*')
    .order('driver', { ascending: true });

  if (error) throw error;
  return data;
}

// Forex Factory Economic Events
export async function getTodaysEconomicEvents() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('forex_events')
    .select('*')
    .gte('event_date', today)
    .lt('event_date', new Date(Date.now() + 86400000).toISOString().split('T')[0])
    .order('event_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getWeeklyEconomicEvents() {
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);
  
  const { data, error } = await supabase
    .from('forex_events')
    .select('*')
    .gte('event_date', today.toISOString().split('T')[0])
    .lte('event_date', endOfWeek.toISOString().split('T')[0])
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getHighImpactEventCounts() {
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  
  const nextWeekStart = new Date(endOfWeek);
  nextWeekStart.setDate(endOfWeek.getDate() + 1);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
  
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Get counts for this week
  const { count: thisWeekCount } = await supabase
    .from('forex_events')
    .select('*', { count: 'exact', head: true })
    .eq('impact', 'High')
    .gte('event_date', today.toISOString().split('T')[0])
    .lte('event_date', endOfWeek.toISOString().split('T')[0]);

  // Get counts for next week
  const { count: nextWeekCount } = await supabase
    .from('forex_events')
    .select('*', { count: 'exact', head: true })
    .eq('impact', 'High')
    .gte('event_date', nextWeekStart.toISOString().split('T')[0])
    .lte('event_date', nextWeekEnd.toISOString().split('T')[0]);

  // Get counts for this month
  const { count: thisMonthCount } = await supabase
    .from('forex_events')
    .select('*', { count: 'exact', head: true })
    .eq('impact', 'High')
    .gte('event_date', today.toISOString().split('T')[0])
    .lte('event_date', endOfMonth.toISOString().split('T')[0]);

  return {
    thisWeek: thisWeekCount || 0,
    nextWeek: nextWeekCount || 0,
    thisMonth: thisMonthCount || 0,
  };
}

// Market News
export async function getMarketNews(limit: number = 20) {
  const { data, error } = await supabase
    .from('market_news')
    .select('*')
    .order('datetime', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Helper function to get user profile with plan info
export async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // First, try to find by supabase_user_id
  let { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('supabase_user_id', user.id)
    .single();

  // If not found by supabase_user_id, try to find by email (migration fallback)
  if (error && error.code === 'PGRST116') {
    const { data: emailData, error: emailError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', user.email!)
      .single();

    // If found by email, update it with supabase_user_id
    if (emailData && !emailError) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ supabase_user_id: user.id })
        .eq('id', emailData.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedProfile as UserProfile;
    }

    // If profile doesn't exist at all, create it
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert([{
        supabase_user_id: user.id,
        email: user.email!,
        account_type: 'live',
        timezone: 'UTC',
        plan_type: 'demo',
        preferences: {},
      }])
      .select()
      .single();

    if (createError) throw createError;
    return newProfile as UserProfile;
  }

  if (error) throw error;
  return data as UserProfile;
}

// Journal Entry operations
export async function createJournalEntry(entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .insert([{ 
      ...entry, 
      user_id: user.id 
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getJournalEntries() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getJournalEntry(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateJournalEntry(id: string, updates: Partial<JournalEntry>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteJournalEntry(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// Trade operations
export interface TradeData {
  instrument: string;
  instrument_type: 'FOREX' | 'INDICES' | 'CRYPTO' | 'FUTURES' | 'STOCKS';
  trade_type: 'BUY' | 'SELL';
  position_size: number;
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  notes?: string;
  attachments?: string[];
  entry_date: string;
  exit_date?: string;
}

export async function createTrade(trade: Omit<TradeData, 'user_id'>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Calculate enrichment values
  const sessionTag = detectTradingSession(trade.entry_date);
  const holdingTimeMinutes = calculateHoldingTimeMinutes(trade.entry_date, trade.exit_date);
  const profitPerLot = calculateProfitPerLot(trade.pnl, trade.position_size);

  const { data, error } = await supabase
    .from('trades')
    .insert([{ 
      ...trade,
      user_id: user.id,
      session_tag: sessionTag,
      holding_time_minutes: holdingTimeMinutes,
      profit_per_lot: profitPerLot
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTrades(accountId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id);

  // Filter by account_id if a specific account is selected
  if (accountId && accountId !== 'all') {
    query = query.eq('account_id', accountId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTrade(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrade(id: string, updates: Partial<TradeData>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Recalculate enrichment values if relevant fields are updated
  const enrichmentUpdates: any = {};
  
  if (updates.entry_date !== undefined) {
    enrichmentUpdates.session_tag = detectTradingSession(updates.entry_date);
  }
  
  if (updates.entry_date !== undefined || updates.exit_date !== undefined) {
    // Need both dates to calculate, so fetch current trade if only one is being updated
    const current = await getTrade(id);
    const entryDate = updates.entry_date ?? current.entry_date;
    const exitDate = updates.exit_date ?? current.exit_date;
    enrichmentUpdates.holding_time_minutes = calculateHoldingTimeMinutes(entryDate, exitDate);
  }
  
  if (updates.pnl !== undefined || updates.position_size !== undefined) {
    // Need both values to calculate, so fetch current trade if only one is being updated
    const current = await getTrade(id);
    const pnl = updates.pnl ?? current.pnl;
    const positionSize = updates.position_size ?? parseFloat(current.position_size);
    enrichmentUpdates.profit_per_lot = calculateProfitPerLot(pnl, positionSize);
  }

  const { data, error } = await supabase
    .from('trades')
    .update({ ...updates, ...enrichmentUpdates })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTrade(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('trades')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

interface UploadTrade {
  ticket_id?: string;
  instrument: string;
  instrument_type: string;
  trade_type: "BUY" | "SELL";
  position_size: number;
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  pnl?: number;
  entry_date?: string;
  exit_date?: string;
  status: "OPEN" | "CLOSED";
  account_id: string;
}

// Trade Enrichment Functions

function detectTradingSession(entryDate: string | undefined): string | null {
  if (!entryDate) return null;
  
  const date = new Date(entryDate);
  const utcHour = date.getUTCHours();
  
  // Check New York first (12:00-21:00 UTC) to handle overlap with London
  if (utcHour >= 12 && utcHour < 21) {
    return "New York";
  } else if (utcHour >= 7 && utcHour < 12) {
    return "London";
  } else if (utcHour >= 23 || utcHour < 8) {
    return "Asia";
  }
  
  return null;
}

function calculateHoldingTimeMinutes(entryDate: string | undefined, exitDate: string | undefined): number | null {
  if (!entryDate || !exitDate) return null;
  
  const entry = new Date(entryDate);
  const exit = new Date(exitDate);
  
  const diffMs = exit.getTime() - entry.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  return diffMinutes >= 0 ? diffMinutes : null;
}

function calculateProfitPerLot(pnl: number | undefined, positionSize: number): number | null {
  if (pnl === undefined || pnl === null || positionSize === 0) return null;
  
  return pnl / positionSize;
}

export async function uploadTrades(trades: UploadTrade[], accountId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  let uploaded = 0;
  let skipped = 0;

  for (const trade of trades) {
    // Check for duplicate ticket_id to prevent importing the same trade twice
    if (trade.ticket_id) {
      const { data: existing } = await supabase
        .from('trades')
        .select('id')
        .eq('user_id', user.id)
        .eq('account_id', accountId)
        .eq('ticket_id', trade.ticket_id)
        .single();

      if (existing) {
        skipped++;
        continue;
      }
    }

    // Calculate enrichment values
    const sessionTag = detectTradingSession(trade.entry_date);
    const holdingTimeMinutes = calculateHoldingTimeMinutes(trade.entry_date, trade.exit_date);
    const profitPerLot = calculateProfitPerLot(trade.pnl, trade.position_size);

    const tradeData: any = {
      user_id: user.id,
      account_id: trade.account_id,
      instrument: trade.instrument,
      instrument_type: trade.instrument_type,
      trade_type: trade.trade_type,
      position_size: trade.position_size.toString(),
      entry_price: trade.entry_price.toString(),
      exit_price: trade.exit_price?.toString(),
      stop_loss: trade.stop_loss?.toString(),
      take_profit: trade.take_profit?.toString(),
      pnl: trade.pnl?.toString(),
      status: trade.status,
      entry_date: trade.entry_date,
      exit_date: trade.exit_date,
      session_tag: sessionTag,
      holding_time_minutes: holdingTimeMinutes,
      profit_per_lot: profitPerLot?.toString(),
    };

    if (trade.ticket_id) {
      tradeData.ticket_id = trade.ticket_id;
    }

    const { error } = await supabase
      .from('trades')
      .insert([tradeData]);

    if (error) {
      console.error('Error inserting trade:', error);
      continue;
    }

    uploaded++;
  }

  return { uploaded, skipped };
}

// Analytics operations
export async function getAnalytics(accountId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Get journal entries count
  const { count: journalCount } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Build query for trades with optional account filter
  let tradesQuery = supabase
    .from('trades')
    .select('pnl, status, entry_date, exit_date, created_at')
    .eq('user_id', user.id);

  // Filter by account_id if a specific account is selected
  if (accountId && accountId !== 'all') {
    tradesQuery = tradesQuery.eq('account_id', accountId);
  }

  const { data: trades, error: tradesError } = await tradesQuery
    .order('entry_date', { ascending: true });

  if (tradesError) throw tradesError;

  // Calculate basic analytics
  const profitableTrades = trades?.filter(trade => parseFloat(trade.pnl || '0') > 0) || [];
  const losingTrades = trades?.filter(trade => parseFloat(trade.pnl || '0') < 0) || [];
  const totalPnL = trades?.reduce((sum, trade) => sum + parseFloat(trade.pnl || '0'), 0) || 0;
  const winRate = trades && trades.length > 0 ? (profitableTrades.length / trades.length) * 100 : 0;
  
  // Calculate profit factor (total wins / total losses)
  const totalWins = profitableTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || '0'), 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || '0'), 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;

  // Calculate monthly performance
  const monthlyData: { [key: string]: { pnl: number, wins: number, total: number } } = {};
  trades?.forEach(trade => {
    const tradeDate = new Date(trade.entry_date || trade.created_at);
    const monthKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { pnl: 0, wins: 0, total: 0 };
    }
    
    const pnl = parseFloat(trade.pnl || '0');
    monthlyData[monthKey].pnl += pnl;
    monthlyData[monthKey].total += 1;
    if (pnl > 0) monthlyData[monthKey].wins += 1;
  });

  // Format monthly data for chart
  const monthlyPerformance = Object.entries(monthlyData).map(([month, data]) => ({
    month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    monthKey: month,
    pnl: data.pnl,
    winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
    trades: data.total
  })).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  // Calculate equity curve (cumulative P&L over time)
  let cumulativePnL = 0;
  const equityCurve = trades?.map(trade => {
    cumulativePnL += parseFloat(trade.pnl || '0');
    return {
      date: new Date(trade.entry_date || trade.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      equity: cumulativePnL,
      pnl: parseFloat(trade.pnl || '0')
    };
  }) || [];

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = 0;
  let currentEquity = 0;
  
  trades?.forEach(trade => {
    currentEquity += parseFloat(trade.pnl || '0');
    if (currentEquity > peak) {
      peak = currentEquity;
    }
    const drawdown = peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  // Calculate monthly statistics
  const monthlyPnLs = Object.values(monthlyData).map(m => m.pnl);
  const averageMonthlyReturn = monthlyPnLs.length > 0 
    ? monthlyPnLs.reduce((sum, pnl) => sum + pnl, 0) / monthlyPnLs.length 
    : 0;
  const bestMonth = monthlyPnLs.length > 0 ? Math.max(...monthlyPnLs) : 0;
  const worstMonth = monthlyPnLs.length > 0 ? Math.min(...monthlyPnLs) : 0;

  return {
    totalEntries: journalCount || 0,
    totalTrades: trades?.length || 0,
    totalPnL,
    winRate,
    profitFactor,
    maxDrawdown,
    averageTrade: trades && trades.length > 0 ? totalPnL / trades.length : 0,
    profitableTrades: profitableTrades.length,
    losingTrades: losingTrades.length,
    monthlyPerformance,
    equityCurve,
    averageMonthlyReturn,
    bestMonth,
    worstMonth
  };
}

// File upload operations
export async function uploadFile(file: File): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('trade-attachments')
    .upload(fileName, file);

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('trade-attachments')
    .getPublicUrl(fileName);

  return publicUrl;
}

// Tag operations
export async function getTags() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createTag(tag: { name: string; category?: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tags')
    .insert([{ 
      ...tag, 
      user_id: user.id 
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// User profile operations  
export async function updateUserProfile(updates: Partial<UserProfile>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('supabase_user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Calendar settings operations
export async function updateCalendarSettings(settings: CalendarSettings) {
  return updateUserProfile({ calendar_settings: settings });
}

export async function getCalendarSettings(): Promise<CalendarSettings | null> {
  const profile = await getUserProfile();
  return profile?.calendar_settings || null;
}

// Dashboard template operations
export async function saveDashboardTemplate(template: { name: string; layout: any }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('dashboard_templates')
    .insert([{
      ...template,
      user_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDashboardTemplates() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('dashboard_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteDashboardTemplate(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('dashboard_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// =============================================
// Trade Accounts Operations
// =============================================

export async function getTradeAccounts(): Promise<TradeAccount[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Get user profile to link accounts
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data: accounts, error } = await supabase
    .from('trade_accounts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!accounts) return [];

  // Calculate current balance for each account based on closed trades
  const accountsWithBalance = await Promise.all(
    accounts.map(async (account) => {
      // Get sum of P&L from all closed trades for this account
      const { data: trades } = await supabase
        .from('trades')
        .select('pnl')
        .eq('account_id', account.id)
        .eq('status', 'CLOSED');

      const totalPnL = trades?.reduce((sum, trade) => {
        return sum + (parseFloat(trade.pnl?.toString() || '0'));
      }, 0) || 0;

      return {
        ...account,
        current_balance: parseFloat(account.starting_balance.toString()) + totalPnL
      };
    })
  );

  return accountsWithBalance;
}

export async function createTradeAccount(account: CreateTradeAccount): Promise<TradeAccount> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Get user profile to link account
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('trade_accounts')
    .insert([{
      ...account,
      user_id: profile.id,
      current_balance: account.starting_balance,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTradeAccount(id: string, updates: Partial<CreateTradeAccount>): Promise<TradeAccount> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('trade_accounts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', profile.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTradeAccount(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  // Check if account has trades
  const { count } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', id);

  if (count && count > 0) {
    throw new Error(`Cannot delete account with ${count} existing trade(s). Please delete or reassign trades first.`);
  }

  const { error } = await supabase
    .from('trade_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', profile.id);

  if (error) throw error;
}

export async function toggleAccountStatus(id: string, isActive: boolean): Promise<TradeAccount> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('trade_accounts')
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', profile.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function migrateLegacyTrades(): Promise<{ migrated: boolean; accountId?: string; tradeCount?: number }> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  // Check if user has trades without an account
  const { count } = await supabase
    .from('trades')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .is('account_id', null);

  if (!count || count === 0) {
    return { migrated: false };
  }

  // Create legacy account
  const { data: legacyAccount, error: accountError } = await supabase
    .from('trade_accounts')
    .insert([{
      user_id: profile.id,
      account_type: 'live_personal',
      market_type: 'forex',
      broker_name: 'Legacy',
      account_name: 'Legacy Account (Pre-Migration)',
      starting_balance: 0,
      current_balance: 0,
      is_active: true
    }])
    .select()
    .single();

  if (accountError) throw accountError;

  // Link all orphaned trades to legacy account
  const { error: updateError } = await supabase
    .from('trades')
    .update({ account_id: legacyAccount.id })
    .eq('user_id', profile.id)
    .is('account_id', null);

  if (updateError) throw updateError;

  return { migrated: true, accountId: legacyAccount.id, tradeCount: count };
}

export async function getAccountAnalytics(accountId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  // Get trades for this account
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('account_id', accountId)
    .eq('user_id', profile.id);

  if (error) throw error;

  // Calculate analytics
  const closedTrades = trades?.filter(t => t.status === 'CLOSED') || [];
  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter(t => parseFloat(t.pnl || '0') > 0);
  const losingTrades = closedTrades.filter(t => parseFloat(t.pnl || '0') < 0);
  
  const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || '0'), 0);
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    totalPnL,
    winRate: winRate.toFixed(2)
  };
}

// ============================================
// TAX REPORTS SYSTEM
// ============================================

// Tax Profile Operations
export async function getTaxProfile() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('tax_profile')
    .select('*')
    .eq('user_id', profile.id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  
  // Return default if no profile exists
  if (!data) {
    return {
      reporting_currency: 'USD',
      tax_year_start_month: 1,
      include_swap_in_income: 1,
      include_commission_deduction: 1,
      include_unrealized_pnl: 0
    };
  }
  
  return data;
}

export async function upsertTaxProfile(profileData: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('supabase_user_id', user.id)
    .single();

  if (!profile) throw new Error('User profile not found');

  const { data, error } = await supabase
    .from('tax_profile')
    .upsert({
      user_id: profile.id,
      ...profileData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Tax Expenses Operations
export async function getTaxExpenses(year?: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('tax_expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('expense_date', { ascending: false });

  if (year) {
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
    query = query.gte('expense_date', startDate).lte('expense_date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createTaxExpense(expenseData: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tax_expenses')
    .insert({
      user_id: user.id,
      ...expenseData
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaxExpense(id: string, expenseData: any) {
  const { data, error } = await supabase
    .from('tax_expenses')
    .update(expenseData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTaxExpense(id: string) {
  const { error } = await supabase
    .from('tax_expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Account Cashflows Operations
export async function getAccountCashflows(accountId?: string, year?: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('account_cashflows')
    .select('*')
    .eq('user_id', user.id)
    .order('flow_date', { ascending: false });

  if (accountId && accountId !== 'all') {
    query = query.eq('account_id', accountId);
  }

  if (year) {
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
    query = query.gte('flow_date', startDate).lte('flow_date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createAccountCashflow(cashflowData: any) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('account_cashflows')
    .insert({
      user_id: user.id,
      ...cashflowData
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAccountCashflow(id: string) {
  const { error } = await supabase
    .from('account_cashflows')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Tax Summary Calculation
export async function getTaxSummary(year: number, accountIds: string[] = []) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // WORKAROUND: Use default tax profile due to Supabase PostgREST cache issue (PGRST205)
  let taxProfile;
  try {
    taxProfile = await getTaxProfile();
  } catch (error: any) {
    console.warn('Tax profile not available, using defaults:', error.message);
    taxProfile = {
      report_currency: 'USD',
      trader_status: false,
      tax_deductible_expenses_enabled: true,
      include_swap_in_income: false,
      include_commission_deduction: true,
      include_unrealized_pnl: false
    };
  }
  
  // Get ALL trades (OPEN + CLOSED) for the year based on entry_date
  let tradesQuery = supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id);

  const startDate = new Date(year, 0, 1).toISOString();
  const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
  tradesQuery = tradesQuery.gte('entry_date', startDate).lte('entry_date', endDate);

  if (accountIds.length > 0 && !accountIds.includes('all')) {
    tradesQuery = tradesQuery.in('account_id', accountIds);
  }

  const { data: trades, error: tradesError } = await tradesQuery;
  if (tradesError) {
    console.error('Tax Summary - Trades Query Error:', tradesError);
    throw tradesError;
  }
  console.log('Tax Summary - Trades fetched:', trades?.length || 0, 'trades for year', year);
  console.log('Tax Summary - Query params:', { userId: user.id, year, startDate, endDate, accountIds });
  if (trades && trades.length > 0) {
    console.log('Tax Summary - First trade sample:', {
      exit_date: trades[0].exit_date,
      status: trades[0].status,
      pnl: trades[0].pnl,
      pnl_report: trades[0].pnl_report
    });
  }

  // Get expenses for the year (with workaround for Supabase cache issue)
  let expenses = [];
  try {
    expenses = await getTaxExpenses(year);
  } catch (error: any) {
    console.warn('Tax expenses not available, using empty array:', error.message);
    expenses = [];
  }
  
  // Calculate monthly breakdown
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    trading_income: 0,
    swap_income: 0,
    commission_deduction: 0,
    expenses: 0,
    net_income: 0
  }));

  // Process trades
  (trades || []).forEach(trade => {
    const month = new Date(trade.exit_date!).getMonth();
    const pnl = parseFloat(trade.pnl_report || trade.pnl || '0');
    const swap = parseFloat(trade.swap_report || trade.swap || '0');
    const commission = parseFloat(trade.commission_report || trade.commission || '0');

    monthlyData[month].trading_income += pnl;
    
    if (taxProfile.include_swap_in_income) {
      monthlyData[month].swap_income += swap;
    }
    
    if (taxProfile.include_commission_deduction) {
      monthlyData[month].commission_deduction += Math.abs(commission);
    }
  });

  // Process expenses
  expenses.forEach(expense => {
    const month = new Date(expense.expense_date).getMonth();
    const amount = parseFloat(expense.amount_report || expense.amount || '0');
    monthlyData[month].expenses += amount;
  });

  // Calculate net income
  monthlyData.forEach(month => {
    month.net_income = month.trading_income + month.swap_income - month.commission_deduction - month.expenses;
  });

  // Calculate totals
  const totals = monthlyData.reduce((acc, month) => ({
    trading_income: acc.trading_income + month.trading_income,
    swap_income: acc.swap_income + month.swap_income,
    commission_deduction: acc.commission_deduction + month.commission_deduction,
    expenses: acc.expenses + month.expenses,
    net_income: acc.net_income + month.net_income
  }), {
    trading_income: 0,
    swap_income: 0,
    commission_deduction: 0,
    expenses: 0,
    net_income: 0
  });

  console.log('💰 TAX SUMMARY TOTALS:', totals);
  
  return {
    year,
    monthly: monthlyData,
    totals,
    tax_profile: taxProfile
  };
}