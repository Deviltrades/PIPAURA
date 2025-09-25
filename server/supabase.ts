import { createClient } from '@supabase/supabase-js';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Supabase configuration - use the same env vars as frontend  
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
}

// Create Supabase client for server-side operations (auth only)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Create Supabase admin client for storage operations (requires service role key)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found - storage operations will be limited');
}
export const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase;

// PostgreSQL database connection for data operations
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not found");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql);

// Storage bucket name for journal images
export const JOURNAL_IMAGES_BUCKET = 'journal-images';

// Database table names
export const JOURNAL_ENTRIES_TABLE = 'journal_entries';
export const TAGS_TABLE = 'tags';

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
   * Ensure the journal images bucket exists
   */
  async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === JOURNAL_IMAGES_BUCKET);
      
      if (!bucketExists) {
        // Create the bucket with CORS configuration
        const { error: createError } = await supabaseAdmin.storage.createBucket(JOURNAL_IMAGES_BUCKET, {
          public: false, // Private bucket for user uploads
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          fileSizeLimit: 10485760 // 10MB limit
        });
        
        // Configure CORS settings for the bucket to allow uploads from frontend
        if (!createError) {
          try {
            // Note: CORS configuration may need to be done through Supabase dashboard
            // as the JS client doesn't expose CORS configuration methods
            console.log(`Bucket ${JOURNAL_IMAGES_BUCKET} created. Please configure CORS settings in Supabase dashboard if needed.`);
          } catch (corsError) {
            console.warn('Could not configure CORS automatically:', corsError);
          }
        }
        
        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log(`Created storage bucket: ${JOURNAL_IMAGES_BUCKET}`);
        }
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }
  
  /**
   * Create a new journal entry
   */
  async createJournalEntry(userId: string, entry: any): Promise<any> {
    try {
      const result = await sql`
        INSERT INTO journal_entries (
          user_id, notes, trade_data, image_url, trade_date, pair_symbol,
          lot_size, entry_price, exit_price, stop_loss, take_profit,
          profit_loss, trade_type, status, tags, timeframe, strategy, session
        ) VALUES (
          ${userId}, ${entry.notes || ''}, ${JSON.stringify(entry.trade_data || {})},
          ${entry.image_url || null}, ${entry.trade_date}, ${entry.pair_symbol},
          ${entry.lot_size || 0}, ${entry.entry_price || 0}, ${entry.exit_price || 0},
          ${entry.stop_loss || 0}, ${entry.take_profit || 0}, ${entry.profit_loss || 0},
          ${entry.trade_type || 'BUY'}, ${entry.status || 'CLOSED'}, ${entry.tags || []},
          ${entry.timeframe || null}, ${entry.strategy || null}, ${entry.session || null}
        )
        RETURNING *
      `;

      return result[0];
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  /**
   * Get all journal entries for a user
   */
  async getJournalEntries(userId: string): Promise<any[]> {
    try {
      const result = await sql`
        SELECT * FROM journal_entries 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC
      `;

      return result;
    } catch (error) {
      console.error('Error getting journal entries:', error);
      throw error;
    }
  }

  /**
   * Get a specific journal entry
   */
  async getJournalEntry(userId: string, entryId: string): Promise<any | null> {
    try {
      const result = await sql`
        SELECT * FROM journal_entries 
        WHERE user_id = ${userId} AND id = ${entryId}
      `;

      return result[0] || null;
    } catch (error) {
      console.error('Error getting journal entry:', error);
      return null;
    }
  }

  /**
   * Update a journal entry
   */
  async updateJournalEntry(userId: string, entryId: string, updates: any): Promise<any> {
    try {
      const result = await sql`
        UPDATE journal_entries 
        SET 
          notes = ${updates.notes || ''},
          trade_data = ${JSON.stringify(updates.trade_data || {})},
          image_url = ${updates.image_url || null},
          trade_date = ${updates.trade_date || null}::date,
          pair_symbol = ${updates.pair_symbol || ''},
          lot_size = ${updates.lot_size || 0},
          entry_price = ${updates.entry_price || 0},
          exit_price = ${updates.exit_price || 0},
          stop_loss = ${updates.stop_loss || 0},
          take_profit = ${updates.take_profit || 0},
          profit_loss = ${updates.profit_loss || 0},
          trade_type = ${updates.trade_type || 'BUY'},
          status = ${updates.status || 'CLOSED'},
          tags = ${updates.tags || []},
          timeframe = ${updates.timeframe || null},
          strategy = ${updates.strategy || null},
          session = ${updates.session || null},
          updated_at = now()
        WHERE user_id = ${userId} AND id = ${entryId}
        RETURNING *
      `;

      return result[0];
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
      await sql`
        DELETE FROM journal_entries 
        WHERE user_id = ${userId} AND id = ${entryId}
      `;
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
      const { data, error } = await supabaseAdmin.storage
        .from(JOURNAL_IMAGES_BUCKET)
        .upload(filePath, file, {
          contentType: this.getContentType(fileName),
          upsert: false
        });

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrl } = supabaseAdmin.storage
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
      
      const { data, error } = await supabaseAdmin.storage
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
   * Generate a signed URL for viewing uploaded images
   * @param filePath Path to the file in storage
   * @returns Signed URL for viewing (valid for 1 hour)
   */
  async generateViewSignedUrl(filePath: string): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(JOURNAL_IMAGES_BUCKET)
        .createSignedUrl(filePath, 3600); // Valid for 1 hour

      if (error) {
        throw new Error(`Failed to generate view signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error generating view signed URL:', error);
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

      const { error } = await supabaseAdmin.storage
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
   * Create a new tag
   */
  async createTag(userId: string, tag: { name: string; category?: string; color?: string }): Promise<any> {
    try {
      const result = await sql`
        INSERT INTO tags (user_id, name, category, color)
        VALUES (${userId}, ${tag.name}, ${tag.category || 'general'}, ${tag.color || '#3b82f6'})
        RETURNING *
      `;

      return result[0];
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  /**
   * Get all tags for a user
   */
  async getTags(userId: string): Promise<any[]> {
    try {
      const result = await sql`
        SELECT * FROM tags 
        WHERE user_id = ${userId} 
        ORDER BY name ASC
      `;

      return result;
    } catch (error) {
      console.error('Error getting tags:', error);
      throw error;
    }
  }

  /**
   * Update a tag
   */
  async updateTag(userId: string, tagId: string, updates: any): Promise<any> {
    try {
      const result = await sql`
        UPDATE tags 
        SET 
          name = ${updates.name || ''},
          category = ${updates.category || 'general'},
          color = ${updates.color || '#3b82f6'}
        WHERE user_id = ${userId} AND id = ${tagId}
        RETURNING *
      `;

      return result[0];
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  }

  /**
   * Delete a tag
   */
  async deleteTag(userId: string, tagId: string): Promise<void> {
    try {
      await sql`
        DELETE FROM tags 
        WHERE user_id = ${userId} AND id = ${tagId}
      `;
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
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