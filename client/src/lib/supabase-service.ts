import { supabase } from './supabase';
import type { 
  JournalEntry, 
  UserProfile, 
  CalendarSettings,
  SidebarSettings 
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
    .limit(8);

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
  instrument_type: 'FOREX' | 'INDICES' | 'CRYPTO';
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

  const { data, error } = await supabase
    .from('trades')
    .insert([{ 
      ...trade,
      user_id: user.id 
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTrades() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

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

  const { data, error } = await supabase
    .from('trades')
    .update(updates)
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

// Analytics operations
export async function getAnalytics() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Get journal entries count
  const { count: journalCount } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Get all trades with dates for comprehensive analytics
  const { data: trades, error: tradesError } = await supabase
    .from('trades')
    .select('pnl, status, entry_date, exit_date, created_at')
    .eq('user_id', user.id)
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