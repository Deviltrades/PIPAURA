import {
  JournalEntry,
  CreateJournalEntry,
  UserProfile,
  CalendarSettings,
  SidebarSettings,
  Tag,
} from "@shared/schema";
import { supabaseService } from "./supabase";

export interface IStorage {
  // Journal entry operations
  createJournalEntry(userId: string, entry: CreateJournalEntry): Promise<JournalEntry>;
  getJournalEntries(userId: string): Promise<JournalEntry[]>;
  getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null>;
  updateJournalEntry(userId: string, entryId: string, updates: Partial<CreateJournalEntry>): Promise<JournalEntry>;
  deleteJournalEntry(userId: string, entryId: string): Promise<void>;
  
  // Tag operations
  createTag(userId: string, tag: { name: string; category?: string; color?: string }): Promise<Tag>;
  getTags(userId: string): Promise<Tag[]>;
  updateTag(userId: string, tagId: string, updates: Partial<Tag>): Promise<Tag>;
  deleteTag(userId: string, tagId: string): Promise<void>;
  
  // Image operations
  uploadImage(file: Buffer, fileName: string, userId: string): Promise<string>;
  generateUploadSignedUrl(fileName: string, userId: string): Promise<string>;
  generateViewSignedUrl(filePath: string): Promise<string>;
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

  // Tag operations
  async createTag(userId: string, tag: { name: string; category?: string; color?: string }): Promise<Tag> {
    return await supabaseService.createTag(userId, tag);
  }

  async getTags(userId: string): Promise<Tag[]> {
    return await supabaseService.getTags(userId);
  }

  async updateTag(userId: string, tagId: string, updates: Partial<Tag>): Promise<Tag> {
    return await supabaseService.updateTag(userId, tagId, updates);
  }

  async deleteTag(userId: string, tagId: string): Promise<void> {
    return await supabaseService.deleteTag(userId, tagId);
  }

  // Image operations
  async uploadImage(file: Buffer, fileName: string, userId: string): Promise<string> {
    return await supabaseService.uploadImage(file, fileName, userId);
  }

  async generateUploadSignedUrl(fileName: string, userId: string): Promise<string> {
    // Ensure bucket exists before generating URL
    await supabaseService.ensureBucketExists();
    return await supabaseService.generateUploadSignedUrl(fileName, userId);
  }

  async generateViewSignedUrl(filePath: string): Promise<string> {
    return await supabaseService.generateViewSignedUrl(filePath);
  }

  async deleteImage(imagePath: string): Promise<boolean> {
    return await supabaseService.deleteImage(imagePath);
  }
}

export const storage = new SupabaseStorage();