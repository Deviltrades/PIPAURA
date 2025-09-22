import {
  JournalEntry,
  CreateJournalEntry,
  UserProfile,
  CalendarSettings,
  SidebarSettings,
} from "@shared/schema";
import { supabaseService } from "./supabase";

export interface IStorage {
  // Journal entry operations
  createJournalEntry(userId: string, entry: CreateJournalEntry): Promise<JournalEntry>;
  getJournalEntries(userId: string): Promise<JournalEntry[]>;
  getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null>;
  updateJournalEntry(userId: string, entryId: string, updates: Partial<CreateJournalEntry>): Promise<JournalEntry>;
  deleteJournalEntry(userId: string, entryId: string): Promise<void>;
  
  // Image operations
  uploadImage(file: Buffer, fileName: string, userId: string): Promise<string>;
  generateUploadSignedUrl(fileName: string, userId: string): Promise<string>;
  deleteImage(imagePath: string): Promise<boolean>;
}

export class SupabaseStorage implements IStorage {
  
  // Journal entry operations
  async createJournalEntry(userId: string, entry: CreateJournalEntry): Promise<JournalEntry> {
    return await supabaseService.createJournalEntry(userId, entry);
  }

  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    return await supabaseService.getJournalEntries(userId);
  }

  async getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
    return await supabaseService.getJournalEntry(userId, entryId);
  }

  async updateJournalEntry(userId: string, entryId: string, updates: Partial<CreateJournalEntry>): Promise<JournalEntry> {
    return await supabaseService.updateJournalEntry(userId, entryId, updates);
  }

  async deleteJournalEntry(userId: string, entryId: string): Promise<void> {
    return await supabaseService.deleteJournalEntry(userId, entryId);
  }

  // Image operations
  async uploadImage(file: Buffer, fileName: string, userId: string): Promise<string> {
    return await supabaseService.uploadImage(file, fileName, userId);
  }

  async generateUploadSignedUrl(fileName: string, userId: string): Promise<string> {
    return await supabaseService.generateUploadSignedUrl(fileName, userId);
  }

  async deleteImage(imagePath: string): Promise<boolean> {
    return await supabaseService.deleteImage(imagePath);
  }
}

export const storage = new SupabaseStorage();