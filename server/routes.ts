import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, sanitizeUser } from "./auth";
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
  app.post("/api/journal-entries", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.user.id;
      
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
      
      const userId = req.user.id;
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
      
      const userId = req.user.id;
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

  app.put("/api/journal-entries/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.user.id;
      
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

  app.delete("/api/journal-entries/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.user.id;
      
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

  // Image upload routes for Supabase storage
  app.post("/api/upload-image", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = req.file.originalname;
      const extension = originalName.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;

      // Upload to Supabase storage
      const imageUrl = await storage.uploadImage(req.file.buffer, fileName, userId);
      
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
      
      const userId = req.user.id;
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

  // Analytics routes for journal entries
  app.get("/api/analytics", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.user.id;
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

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}