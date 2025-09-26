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

// Helper function to get user profile with plan info
export async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('supabase_user_id', user.id)
    .single();

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

  // Get trades data
  const { data: trades, error: tradesError } = await supabase
    .from('trades')
    .select('pnl, status')
    .eq('user_id', user.id);

  if (tradesError) throw tradesError;

  // Calculate analytics
  const profitableTrades = trades?.filter(trade => parseFloat(trade.pnl || '0') > 0) || [];
  const totalPnL = trades?.reduce((sum, trade) => sum + parseFloat(trade.pnl || '0'), 0) || 0;
  const winRate = trades && trades.length > 0 ? (profitableTrades.length / trades.length) * 100 : 0;

  return {
    totalEntries: journalCount || 0,
    totalTrades: trades?.length || 0,
    totalPnL,
    winRate,
    averageTrade: trades && trades.length > 0 ? totalPnL / trades.length : 0,
    profitableTrades: profitableTrades.length,
    losingTrades: (trades?.length || 0) - profitableTrades.length
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