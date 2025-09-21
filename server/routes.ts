import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertTradeSchema, insertSignalSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";


export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Object storage routes for file uploads
  app.get("/objects/:objectPath(*)", /* isAuthenticated, */ async (req, res) => {
    const userId = (req.user as any)?.id || "development-user-id";
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", /* isAuthenticated, */ async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/trade-attachments", isAuthenticated, async (req, res) => {
    if (!req.body.fileURL) {
      return res.status(400).json({ error: "fileURL is required" });
    }

    const userId = (req.user as any)?.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.fileURL,
        {
          owner: userId,
          visibility: "private",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting trade attachment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Trade routes
  app.post("/api/trades", /* isAuthenticated, */ async (req, res) => {
    try {
      // For custom auth, user ID is directly on req.user.id
      // DEVELOPMENT: Use dummy user ID when auth is disabled
      const userId = (req.user as any)?.id || "development-user-id";
      
      // Skip authentication check for development
      /* if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      } */
      
      // Transform the data to ensure proper types
      const tradeData = {
        ...req.body,
        userId,
        // Parse date string as local date to avoid timezone conversion
        entryDate: req.body.entryDate ? new Date(req.body.entryDate + 'T12:00:00') : new Date(),
        exitDate: req.body.exitDate ? new Date(req.body.exitDate + 'T12:00:00') : undefined,
        // Normalize attachment URLs if they exist
        attachments: req.body.attachments ? req.body.attachments.map((url: string) => {
          const objectStorageService = new ObjectStorageService();
          return objectStorageService.normalizeObjectEntityPath(url);
        }) : [],
      };
      
      console.log("Trade data before validation:", tradeData);
      const validatedData = insertTradeSchema.parse(tradeData);

      const trade = await storage.createTrade(validatedData);
      res.status(201).json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      res.status(400).json({ message: "Invalid trade data" });
    }
  });

  app.get("/api/trades", /* isAuthenticated, */ async (req, res) => {
    try {
      const userId = (req.user as any)?.id || "development-user-id";
      const trades = await storage.getTradesByUser(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  app.get("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      const trade = await storage.getTrade(req.params.id);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Check if user owns this trade
      const userId = (req.user as any)?.id;
      if (trade.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(trade);
    } catch (error) {
      console.error("Error fetching trade:", error);
      res.status(500).json({ message: "Failed to fetch trade" });
    }
  });

  app.put("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      
      // Check if trade exists and user owns it
      const existingTrade = await storage.getTrade(req.params.id);
      if (!existingTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      if (existingTrade.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update trade data
      const updateData = {
        ...req.body,
        exitDate: req.body.exitDate ? new Date(req.body.exitDate) : null,
      };

      const updatedTrade = await storage.updateTrade(req.params.id, updateData);
      if (!updatedTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      res.json(updatedTrade);
    } catch (error) {
      console.error("Error updating trade:", error);
      res.status(500).json({ message: "Failed to update trade" });
    }
  });

  // Calendar settings routes
  app.put('/api/calendar/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const calendarSettings = req.body;
      await storage.updateUserCalendarSettings(userId, calendarSettings);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating calendar settings:", error);
      res.status(500).json({ message: "Failed to update calendar settings" });
    }
  });

  app.delete("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      const trade = await storage.getTrade(req.params.id);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      // Check if user owns this trade
      const userId = (req.user as any)?.id;
      if (trade.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteTrade(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating trade:", error);
      res.status(500).json({ message: "Failed to update trade" });
    }
  });

  app.delete("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      const trade = await storage.getTrade(req.params.id);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      // Check if user owns this trade
      const userId = (req.user as any)?.id;
      if (trade.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteTrade(req.params.id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Trade not found" });
      }
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ message: "Failed to delete trade" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const trades = await storage.getTradesByUser(userId);
      
      const closedTrades = trades.filter(trade => trade.status === "CLOSED" && trade.pnl !== null);
      const winningTrades = closedTrades.filter(trade => parseFloat(trade.pnl!) > 0);
      
      const totalPnL = closedTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl!), 0);
      const averageTrade = closedTrades.length > 0 ? totalPnL / closedTrades.length : 0;
      const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

      const stats = {
        totalPnL,
        totalTrades: trades.length,
        closedTrades: closedTrades.length,
        winRate: Math.round(winRate * 10) / 10,
        averageTrade: Math.round(averageTrade * 100) / 100,
      };

      res.json(stats);
    } catch (error) {
      console.error("Error calculating analytics:", error);
      res.status(500).json({ message: "Failed to calculate analytics" });
    }
  });

  app.get("/api/analytics/daily-pnl", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const trades = await storage.getTradesByUser(userId);
      
      const dailyPnL: Record<string, number> = {};
      
      trades
        .filter(trade => trade.status === "CLOSED" && trade.pnl !== null && trade.exitDate)
        .forEach(trade => {
          const date = trade.exitDate!.toISOString().split('T')[0];
          if (!dailyPnL[date]) {
            dailyPnL[date] = 0;
          }
          dailyPnL[date] += parseFloat(trade.pnl!);
        });

      res.json(dailyPnL);
    } catch (error) {
      console.error("Error calculating daily P&L:", error);
      res.status(500).json({ message: "Failed to calculate daily P&L" });
    }
  });

  // Signal routes
  app.post("/api/signals", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertSignalSchema.parse({
        ...req.body,
        userId,
      });

      const signal = await storage.createSignal(validatedData);
      res.status(201).json(signal);
    } catch (error) {
      console.error("Error creating signal:", error);
      res.status(400).json({ message: "Invalid signal data" });
    }
  });

  app.get("/api/signals", isAuthenticated, async (req, res) => {
    try {
      const signals = await storage.getSignals();
      res.json(signals);
    } catch (error) {
      console.error("Error fetching signals:", error);
      res.status(500).json({ message: "Failed to fetch signals" });
    }
  });

  app.put("/api/signals/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const updatedSignal = await storage.updateSignal(req.params.id, req.body);
      if (!updatedSignal) {
        return res.status(404).json({ message: "Signal not found" });
      }
      
      res.json(updatedSignal);
    } catch (error) {
      console.error("Error updating signal:", error);
      res.status(500).json({ message: "Failed to update signal" });
    }
  });

  // Dashboard widget preferences
  app.put("/api/dashboard/widgets", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { widgets } = req.body;

      if (!Array.isArray(widgets)) {
        return res.status(400).json({ message: "Widgets must be an array" });
      }

      const updatedUser = await storage.updateUserWidgets(userId, widgets);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ widgets: updatedUser.dashboardWidgets });
    } catch (error) {
      console.error("Error updating dashboard widgets:", error);
      res.status(500).json({ message: "Failed to update dashboard widgets" });
    }
  });

  // Dashboard layout preferences
  app.put("/api/dashboard/layouts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { layoutName, layouts } = req.body;

      if (!layoutName || typeof layoutName !== 'string') {
        return res.status(400).json({ message: "Layout name is required" });
      }

      if (!layouts || typeof layouts !== 'object') {
        return res.status(400).json({ message: "Layouts must be an object" });
      }

      // Get current user layouts
      const user = await storage.getUser(userId);
      const currentLayouts = (user?.dashboardLayout as any) || {};

      // Add/update the named layout
      const updatedLayouts = {
        ...currentLayouts,
        [layoutName]: layouts
      };

      const updatedUser = await storage.updateUserDashboardLayouts(userId, updatedLayouts);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "Layout saved successfully", 
        layoutName,
        layouts: updatedUser.dashboardLayout 
      });
    } catch (error) {
      console.error("Error updating dashboard layouts:", error);
      res.status(500).json({ message: "Failed to update dashboard layouts" });
    }
  });

  app.delete("/api/dashboard/layouts/:layoutName", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { layoutName } = req.params;

      if (!layoutName) {
        return res.status(400).json({ message: "Layout name is required" });
      }

      // Get current user layouts
      const user = await storage.getUser(userId);
      const currentLayouts = (user?.dashboardLayout as any) || {};

      // Remove the named layout
      const updatedLayouts = { ...currentLayouts };
      delete updatedLayouts[layoutName];

      const updatedUser = await storage.updateUserDashboardLayouts(userId, updatedLayouts);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "Layout deleted successfully", 
        layouts: updatedUser.dashboardLayout 
      });
    } catch (error) {
      console.error("Error deleting dashboard layout:", error);
      res.status(500).json({ message: "Failed to delete dashboard layout" });
    }
  });

  // Dashboard template routes
  app.get("/api/user/dashboard-templates", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      const user = await storage.getUser(userId);
      res.json(user?.dashboardTemplates || {});
    } catch (error) {
      console.error("Error fetching dashboard templates:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/user/dashboard-templates", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { name, layouts } = req.body;
    if (!name || !layouts) {
      return res.status(400).json({ error: "Template name and layouts are required" });
    }

    try {
      const user = await storage.getUser(userId);
      const currentTemplates = user?.dashboardTemplates || {};
      
      // Check template limit (max 5)
      if (Object.keys(currentTemplates).length >= 5 && !currentTemplates[name]) {
        return res.status(400).json({ error: "Maximum of 5 templates allowed" });
      }

      const updatedTemplates = {
        ...currentTemplates,
        [name]: layouts
      };

      await storage.updateUserDashboardTemplates(userId, updatedTemplates);
      res.json({ message: "Template saved successfully" });
    } catch (error) {
      console.error("Error saving dashboard template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/user/dashboard-templates/:name", isAuthenticated, async (req, res) => {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: "Template name is required" });
    }

    try {
      const user = await storage.getUser(userId);
      const currentTemplates = user?.dashboardTemplates || {};
      
      if (!currentTemplates[name]) {
        return res.status(404).json({ error: "Template not found" });
      }

      const updatedTemplates = { ...currentTemplates };
      delete updatedTemplates[name];

      await storage.updateUserDashboardTemplates(userId, updatedTemplates);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting dashboard template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
