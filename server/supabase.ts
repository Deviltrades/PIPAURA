import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.Project_URL_SUPABASE;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables: Project_URL_SUPABASE and SUPABASE_API_KEY are required');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket name for trade images
export const TRADE_IMAGES_BUCKET = 'trade-images';

// Storage service for handling Supabase operations
export class SupabaseStorageService {
  
  /**
   * Upload an image to Supabase storage
   * @param file File buffer
   * @param fileName Unique file name
   * @param userId User ID for organizing files
   * @returns Public URL of the uploaded image
   */
  async uploadImage(file: Buffer, fileName: string, userId: string): Promise<string> {
    try {
      // Create a unique path: user_id/trade_images/filename
      const filePath = `${userId}/trade_images/${fileName}`;
      
      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from(TRADE_IMAGES_BUCKET)
        .upload(filePath, file, {
          contentType: this.getContentType(fileName),
          upsert: false
        });

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from(TRADE_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error uploading image to Supabase:', error);
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
      const bucketIndex = pathParts.findIndex(part => part === TRADE_IMAGES_BUCKET);
      
      if (bucketIndex === -1) {
        throw new Error('Invalid image path format');
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(TRADE_IMAGES_BUCKET)
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
   * Generate a signed URL for uploading directly from frontend
   * @param fileName File name
   * @param userId User ID
   * @returns Signed URL for upload
   */
  async generateUploadSignedUrl(fileName: string, userId: string): Promise<string> {
    try {
      const filePath = `${userId}/trade_images/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from(TRADE_IMAGES_BUCKET)
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
   * Store trade notes in Supabase database
   * @param tradeId Trade ID
   * @param notes Notes content
   * @param userId User ID
   */
  async storeTradeNotes(tradeId: string, notes: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trade_notes')
        .upsert({
          trade_id: tradeId,
          user_id: userId,
          content: notes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'trade_id'
        });

      if (error) {
        throw new Error(`Failed to store trade notes: ${error.message}`);
      }
    } catch (error) {
      console.error('Error storing trade notes:', error);
      throw error;
    }
  }

  /**
   * Get trade notes from Supabase database
   * @param tradeId Trade ID
   * @returns Notes content
   */
  async getTradeNotes(tradeId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('trade_notes')
        .select('content')
        .eq('trade_id', tradeId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw new Error(`Failed to get trade notes: ${error.message}`);
      }

      return data?.content || null;
    } catch (error) {
      console.error('Error getting trade notes:', error);
      return null;
    }
  }

  /**
   * Delete trade notes from Supabase database
   * @param tradeId Trade ID
   */
  async deleteTradeNotes(tradeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('trade_notes')
        .delete()
        .eq('trade_id', tradeId);

      if (error) {
        throw new Error(`Failed to delete trade notes: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting trade notes:', error);
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

// Initialize the storage service
export const supabaseStorageService = new SupabaseStorageService();