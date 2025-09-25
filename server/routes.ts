import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, sanitizeUser, requiresPlanPermission } from "./auth";
import { createJournalEntrySchema, updateJournalEntrySchema } from "@shared/schema";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        user_metadata?: {
          first_name?: string;
          last_name?: string;
        };
      };
      userId?: string;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // User info endpoint is handled in auth.ts as /api/user

  // Journal Entry routes
  app.post("/api/journal-entries", isAuthenticated, requiresPlanPermission("create_journal"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      
      const validatedData = createJournalEntrySchema.parse(req.body);
      const entry = await storage.createJournalEntry(userId, validatedData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(400).json({ message: "Invalid journal entry data" });
    }
  });

  app.get("/api/journal-entries", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const entries = await storage.getJournalEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal-entries/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const entry = await storage.getJournalEntry(userId, req.params.id);
      
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }

      res.json(entry);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  app.put("/api/journal-entries/:id", isAuthenticated, requiresPlanPermission("edit_journal"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      
      // Check if entry exists and user owns it
      const existingEntry = await storage.getJournalEntry(userId, req.params.id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }

      const validatedData = updateJournalEntrySchema.parse(req.body);
      const updatedEntry = await storage.updateJournalEntry(userId, req.params.id, validatedData);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  app.delete("/api/journal-entries/:id", isAuthenticated, requiresPlanPermission("delete_journal"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      
      // Check if entry exists and user owns it
      const existingEntry = await storage.getJournalEntry(userId, req.params.id);
      if (!existingEntry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }

      await storage.deleteJournalEntry(userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  // Tag routes
  app.post("/api/tags", isAuthenticated, requiresPlanPermission("create_tag"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const { name, category, color } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Tag name is required" });
      }
      
      const tag = await storage.createTag(userId, { name, category, color });
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.get("/api/tags", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const tags = await storage.getTags(userId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.put("/api/tags/:id", isAuthenticated, requiresPlanPermission("edit_tag"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const tagId = req.params.id;
      const updates = req.body;
      
      const tag = await storage.updateTag(userId, tagId, updates);
      res.json(tag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  app.delete("/api/tags/:id", isAuthenticated, requiresPlanPermission("delete_tag"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const tagId = req.params.id;
      
      await storage.deleteTag(userId, tagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Image upload routes for Supabase storage
  app.post("/api/upload-image", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Calculate file size in MB
      const fileSizeMB = req.file.size / (1024 * 1024);
      
      // Check user limits before uploading
      const canUpload = await storage.checkUserLimits(userId, {
        action: "upload_image",
        storage_mb: fileSizeMB,
        image_count: 1
      });
      
      if (!canUpload) {
        return res.status(403).json({ 
          message: "Upload failed: Storage limit exceeded or plan restriction" 
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = req.file.originalname;
      const extension = originalName.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;

      // Upload to Supabase storage
      const imageUrl = await storage.uploadImage(req.file.buffer, fileName, userId);
      
      // Update user storage tracking after successful upload
      await storage.updateUserStorage(userId, {
        storage_mb_delta: fileSizeMB,
        image_count_delta: 1
      });
      
      res.json({ image_url: imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.get("/api/signed-upload-url", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const fileName = req.query.fileName as string;
      
      if (!fileName) {
        return res.status(400).json({ message: "File name is required" });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = fileName.split('.').pop();
      const uniqueFileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;

      const signedUrl = await storage.generateUploadSignedUrl(uniqueFileName, userId);
      
      res.json({ 
        signed_url: signedUrl,
        file_name: uniqueFileName
      });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Route that frontend expects for object uploads
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      
      // Check basic upload limits for signed URL generation (we'll do detailed check on completion)
      const canUpload = await storage.checkUserLimits(userId, {
        action: "upload_image",
        image_count: 1
      });
      
      if (!canUpload) {
        return res.status(403).json({ 
          message: "Upload failed: Plan restriction or limits exceeded" 
        });
      }
      
      // Generate a unique filename for the upload
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const uniqueFileName = `${timestamp}-${randomId}.jpg`; // Default to jpg, frontend will handle actual extension

      const signedUrl = await storage.generateUploadSignedUrl(uniqueFileName, userId);
      
      // Return format that frontend expects
      res.json({
        uploadURL: signedUrl,
        fileName: uniqueFileName
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Route to handle trade attachment ACL and normalization
  app.put("/api/trade-attachments", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const { fileURL, fileSize } = req.body;
      
      if (!fileURL) {
        return res.status(400).json({ message: "fileURL is required" });
      }
      
      // If fileSize is provided, update storage tracking
      if (fileSize && typeof fileSize === 'number') {
        const fileSizeMB = fileSize / (1024 * 1024);
        
        // Check storage limits with actual file size
        const canStore = await storage.checkUserLimits(userId, {
          action: "store_file",
          storage_mb: fileSizeMB
        });
        
        if (!canStore) {
          return res.status(403).json({ 
            message: "File storage failed: Storage limit exceeded" 
          });
        }
        
        // Update user storage tracking
        await storage.updateUserStorage(userId, {
          storage_mb_delta: fileSizeMB,
          image_count_delta: 1
        });
      }
      
      // For Supabase storage, we just return the original URL as the object path
      // Since the file is already uploaded to Supabase, we don't need additional ACL setup
      const objectPath = fileURL;
      
      res.json({ objectPath });
    } catch (error) {
      console.error("Error processing trade attachment:", error);
      res.status(500).json({ message: "Failed to process attachment" });
    }
  });

  // Route to get signed URL for viewing uploaded images
  app.get("/api/images/signed-url", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const { imageUrl } = req.query;
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ message: "imageUrl parameter is required" });
      }
      
      // Extract the path from the full URL for signed URL generation
      // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'journal-images');
      
      if (bucketIndex === -1) {
        return res.status(400).json({ message: "Invalid image URL format" });
      }
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      
      // Generate signed URL for viewing (valid for 1 hour)
      const signedUrl = await storage.generateViewSignedUrl(filePath);
      
      res.json({ signedUrl });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      res.status(500).json({ message: "Failed to generate signed URL" });
    }
  });

  // Analytics routes for journal entries
  app.get("/api/analytics", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const entries = await storage.getJournalEntries(userId);
      
      // Calculate basic analytics from journal entries
      const totalEntries = entries.length;
      
      // Extract trade data for analytics
      const trades = entries
        .map(entry => entry.trade_data)
        .filter(trade => trade && typeof trade === 'object');
      
      const profitableTrades = trades.filter(trade => {
        const pnl = parseFloat(trade.pnl || 0);
        return pnl > 0;
      });
      
      const totalPnL = trades.reduce((sum, trade) => {
        const pnl = parseFloat(trade.pnl || 0);
        return sum + pnl;
      }, 0);
      
      const winRate = trades.length > 0 ? (profitableTrades.length / trades.length) * 100 : 0;
      
      const analytics = {
        totalEntries,
        totalTrades: trades.length,
        totalPnL,
        winRate,
        averageTrade: trades.length > 0 ? totalPnL / trades.length : 0,
        profitableTrades: profitableTrades.length,
        losingTrades: trades.length - profitableTrades.length
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error calculating analytics:", error);
      res.status(500).json({ message: "Failed to calculate analytics" });
    }
  });

  // Trade routes (using proper trades table)
  app.post("/api/trades", isAuthenticated, requiresPlanPermission("create_trade"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const tradeData = req.body;
      
      // Map frontend field names to database field names
      const trade = {
        instrument: tradeData.instrument,
        instrument_type: tradeData.instrumentType,
        trade_type: tradeData.tradeType,
        position_size: parseFloat(tradeData.positionSize),
        entry_price: parseFloat(tradeData.entryPrice),
        exit_price: tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : undefined,
        stop_loss: tradeData.stopLoss ? parseFloat(tradeData.stopLoss) : undefined,
        take_profit: tradeData.takeProfit ? parseFloat(tradeData.takeProfit) : undefined,
        pnl: tradeData.pnl ? parseFloat(tradeData.pnl) : undefined,
        status: tradeData.status || 'CLOSED',
        notes: tradeData.notes || '',
        attachments: tradeData.attachments || [],
        entry_date: tradeData.entryDate || new Date().toISOString(),
        exit_date: tradeData.exitDate || null
      };
      
      const createdTrade = await storage.createTrade(userId, trade);
      res.status(201).json(createdTrade);
    } catch (error) {
      console.error("Error creating trade:", error);
      res.status(500).json({ message: "Failed to create trade" });
    }
  });

  app.get("/api/trades", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const trades = await storage.getTrades(userId);
      
      // Map database field names to frontend expected field names
      const formattedTrades = trades.map(trade => ({
        ...trade,
        instrumentType: trade.instrument_type,
        tradeType: trade.trade_type,
        positionSize: trade.position_size,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        stopLoss: trade.stop_loss,
        takeProfit: trade.take_profit,
        entryDate: trade.entry_date,
        exitDate: trade.exit_date,
        createdAt: trade.created_at,
        updatedAt: trade.updated_at
      }));
      
      res.json(formattedTrades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  app.get("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      const trade = await storage.getTrade(userId, req.params.id);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      // Map database field names to frontend expected field names
      const formattedTrade = {
        ...trade,
        instrumentType: trade.instrument_type,
        tradeType: trade.trade_type,
        positionSize: trade.position_size,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        stopLoss: trade.stop_loss,
        takeProfit: trade.take_profit,
        entryDate: trade.entry_date,
        exitDate: trade.exit_date,
        createdAt: trade.created_at,
        updatedAt: trade.updated_at
      };

      res.json(formattedTrade);
    } catch (error) {
      console.error("Error fetching trade:", error);
      res.status(500).json({ message: "Failed to fetch trade" });
    }
  });

  app.put("/api/trades/:id", isAuthenticated, requiresPlanPermission("edit_trade"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      
      // Check if trade exists and user owns it
      const existingTrade = await storage.getTrade(userId, req.params.id);
      if (!existingTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      // Map frontend field names to database field names
      const tradeData = req.body;
      const updates = {
        instrument: tradeData.instrument,
        instrument_type: tradeData.instrumentType,
        trade_type: tradeData.tradeType,
        position_size: tradeData.positionSize ? parseFloat(tradeData.positionSize) : undefined,
        entry_price: tradeData.entryPrice ? parseFloat(tradeData.entryPrice) : undefined,
        exit_price: tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : undefined,
        stop_loss: tradeData.stopLoss ? parseFloat(tradeData.stopLoss) : undefined,
        take_profit: tradeData.takeProfit ? parseFloat(tradeData.takeProfit) : undefined,
        pnl: tradeData.pnl ? parseFloat(tradeData.pnl) : undefined,
        status: tradeData.status,
        notes: tradeData.notes,
        attachments: tradeData.attachments,
        entry_date: tradeData.entryDate,
        exit_date: tradeData.exitDate
      };

      const updatedTrade = await storage.updateTrade(userId, req.params.id, updates);
      
      // Map database field names back to frontend expected field names
      const formattedTrade = {
        ...updatedTrade,
        instrumentType: updatedTrade.instrument_type,
        tradeType: updatedTrade.trade_type,
        positionSize: updatedTrade.position_size,
        entryPrice: updatedTrade.entry_price,
        exitPrice: updatedTrade.exit_price,
        stopLoss: updatedTrade.stop_loss,
        takeProfit: updatedTrade.take_profit,
        entryDate: updatedTrade.entry_date,
        exitDate: updatedTrade.exit_date,
        createdAt: updatedTrade.created_at,
        updatedAt: updatedTrade.updated_at
      };
      
      res.json(formattedTrade);
    } catch (error) {
      console.error("Error updating trade:", error);
      res.status(500).json({ message: "Failed to update trade" });
    }
  });

  app.delete("/api/trades/:id", isAuthenticated, requiresPlanPermission("delete_trade"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId!; // Use local database user ID, not Supabase Auth ID
      
      // Check if trade exists and user owns it
      const existingTrade = await storage.getTrade(userId, req.params.id);
      if (!existingTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      await storage.deleteTrade(userId, req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ message: "Failed to delete trade" });
    }
  });

  // User profile routes for role-based access control
  app.get("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.post("/api/user/profile/update-storage", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId;
      const { storage_mb_delta, image_count_delta } = req.body;
      
      const updatedProfile = await storage.updateUserStorage(userId, {
        storage_mb_delta: parseFloat(storage_mb_delta || 0),
        image_count_delta: parseInt(image_count_delta || 0)
      });
      
      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating user storage:", error);
      res.status(500).json({ message: "Failed to update storage usage" });
    }
  });

  app.post("/api/user/profile/check-limits", isAuthenticated, async (req, res) => {
    try {
      if (!req.user || !req.userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.userId;
      const { action, storage_mb, image_count } = req.body;
      
      const canPerformAction = await storage.checkUserLimits(userId, {
        action,
        storage_mb: parseFloat(storage_mb || 0),
        image_count: parseInt(image_count || 0)
      });
      
      res.json({ canPerformAction });
    } catch (error) {
      console.error("Error checking user limits:", error);
      res.status(500).json({ message: "Failed to check user limits" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}