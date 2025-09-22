import { createClient } from '@supabase/supabase-js';

// Supabase configuration - use the same env vars as frontend
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
}

// Create Supabase client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket name for journal images
export const JOURNAL_IMAGES_BUCKET = 'journal-images';

// Database table names
export const JOURNAL_ENTRIES_TABLE = 'journal_entries';

// Journal entry type definitions
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

// Comprehensive Supabase service for journal entries and storage
export class SupabaseService {
  
  /**
   * Create a new journal entry
   */
  async createJournalEntry(userId: string, entry: CreateJournalEntry): Promise<JournalEntry> {
    try {
      const { data, error } = await supabase
        .from(JOURNAL_ENTRIES_TABLE)
        .insert({
          user_id: userId,
          notes: entry.notes,
          trade_data: entry.trade_data,
          image_url: entry.image_url
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create journal entry: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  /**
   * Get all journal entries for a user
   */
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    try {
      const { data, error } = await supabase
        .from(JOURNAL_ENTRIES_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get journal entries: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting journal entries:', error);
      throw error;
    }
  }

  /**
   * Get a specific journal entry
   */
  async getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
    try {
      const { data, error } = await supabase
        .from(JOURNAL_ENTRIES_TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('id', entryId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw new Error(`Failed to get journal entry: ${error.message}`);
      }

      return data || null;
    } catch (error) {
      console.error('Error getting journal entry:', error);
      return null;
    }
  }

  /**
   * Update a journal entry
   */
  async updateJournalEntry(userId: string, entryId: string, updates: Partial<CreateJournalEntry>): Promise<JournalEntry> {
    try {
      const { data, error } = await supabase
        .from(JOURNAL_ENTRIES_TABLE)
        .update(updates)
        .eq('user_id', userId)
        .eq('id', entryId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update journal entry: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(userId: string, entryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(JOURNAL_ENTRIES_TABLE)
        .delete()
        .eq('user_id', userId)
        .eq('id', entryId);

      if (error) {
        throw new Error(`Failed to delete journal entry: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  /**
   * Upload an image to Supabase storage
   * @param file File buffer
   * @param fileName Unique file name
   * @param userId User ID for organizing files
   * @returns Public URL of the uploaded image
   */
  async uploadImage(file: Buffer, fileName: string, userId: string): Promise<string> {
    try {
      // Create a unique path: user_id/journal_images/filename
      const filePath = `${userId}/journal_images/${fileName}`;
      
      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from(JOURNAL_IMAGES_BUCKET)
        .upload(filePath, file, {
          contentType: this.getContentType(fileName),
          upsert: false
        });

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from(JOURNAL_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error uploading image to Supabase:', error);
      throw error;
    }
  }

  /**
   * Generate a signed URL for uploading directly from frontend
   * @param fileName File name
   * @param userId User ID
   * @returns Signed URL for upload
   */
  async generateUploadSignedUrl(fileName: string, userId: string): Promise<string> {
    try {
      const filePath = `${userId}/journal_images/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from(JOURNAL_IMAGES_BUCKET)
        .createSignedUploadUrl(filePath);

      if (error) {
        throw new Error(`Failed to generate signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Supabase storage
   * @param imagePath Path to the image file
   * @returns Success status
   */
  async deleteImage(imagePath: string): Promise<boolean> {
    try {
      // Extract the file path from the public URL
      const pathParts = imagePath.split('/');
      const bucketIndex = pathParts.findIndex(part => part === JOURNAL_IMAGES_BUCKET);
      
      if (bucketIndex === -1) {
        throw new Error('Invalid image path format');
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(JOURNAL_IMAGES_BUCKET)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting image from Supabase:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  /**
   * Get content type based on file extension
   * @param fileName File name
   * @returns Content type
   */
  private getContentType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }
}

// Initialize the Supabase service
export const supabaseService = new SupabaseService();