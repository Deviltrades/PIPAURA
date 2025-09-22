import { z } from "zod";

// Journal entry type definitions for Supabase
export interface JournalEntry {
  id: string;
  user_id: string;
  created_at: string;
  notes: string;
  trade_data: any;
  image_url?: string;
}

export interface CreateJournalEntry {
  notes: string;
  trade_data: any;
  image_url?: string;
}

// Zod schemas for validation
export const createJournalEntrySchema = z.object({
  notes: z.string().min(1, "Notes are required"),
  trade_data: z.any(),
  image_url: z.string().url().optional(),
});

export const updateJournalEntrySchema = z.object({
  notes: z.string().min(1).optional(),
  trade_data: z.any().optional(),
  image_url: z.string().url().optional(),
});

// User profile type for Supabase Auth
export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  dashboard_widgets?: string[];
  dashboard_layout?: any;
  dashboard_templates?: any;
  calendar_settings?: CalendarSettings;
  sidebar_settings?: SidebarSettings;
  created_at: string;
  updated_at: string;
}

// Calendar settings type
export interface CalendarSettings {
  backgroundColor: string;
  borderColor: string;
  dayBackgroundColor: string;
  dayBorderColor: string;
}

// Sidebar settings type
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

// Types for backward compatibility
export type User = UserProfile;
export type InsertJournalEntry = CreateJournalEntry;
