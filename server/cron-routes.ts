import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Simple API key authentication (set in Replit secrets)
const API_KEY = process.env.CRON_API_KEY || 'your-secret-key-here';

// Middleware to check API key
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }
  
  next();
};

export function setupCronRoutes(app: express.Express) {
  // Health check endpoint (no auth needed)
  app.get('/api/cron/health', (req, res) => {
    res.json({ status: 'ok', message: 'Cron API server running' });
  });

  // High-impact event check endpoint (every 15 min)
  app.post('/api/cron/ff-high-impact', authenticate, async (req, res) => {
    try {
      console.log('[CRON] Running FF High-Impact Check...');
      const { stdout, stderr } = await execAsync('python ff_high_impact_check.py');
      
      console.log(stdout);
      if (stderr) console.error(stderr);
      
      res.json({ 
        success: true, 
        message: 'FF high-impact check completed',
        output: stdout 
      });
    } catch (error: any) {
      console.error('[CRON ERROR]', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        output: error.stdout 
      });
    }
  });

  // Full calendar refresh endpoint (every 4 hours)
  app.post('/api/cron/ff-full-refresh', authenticate, async (req, res) => {
    try {
      console.log('[CRON] Running FF Full Refresh...');
      const { stdout, stderr } = await execAsync('python ff_full_refresh.py');
      
      console.log(stdout);
      if (stderr) console.error(stderr);
      
      res.json({ 
        success: true, 
        message: 'FF full refresh completed',
        output: stdout 
      });
    } catch (error: any) {
      console.error('[CRON ERROR]', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        output: error.stdout 
      });
    }
  });

  // Hourly bias update endpoint (every 30 min / hourly)
  app.post('/api/cron/hourly-update', authenticate, async (req, res) => {
    try {
      console.log('[CRON] Running Hourly Bias Update...');
      const { stdout, stderr } = await execAsync('python hourly_update.py');
      
      console.log(stdout);
      if (stderr) console.error(stderr);
      
      res.json({ 
        success: true, 
        message: 'Hourly bias update completed',
        output: stdout 
      });
    } catch (error: any) {
      console.error('[CRON ERROR]', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        output: error.stdout 
      });
    }
  });

  // Weekly deep analysis endpoint (Sunday 00:00 UTC)
  app.post('/api/cron/weekly-analysis', authenticate, async (req, res) => {
    try {
      console.log('[CRON] Running Weekly Deep Analysis...');
      const { stdout, stderr } = await execAsync('python main.py');
      
      console.log(stdout);
      if (stderr) console.error(stderr);
      
      res.json({ 
        success: true, 
        message: 'Weekly analysis completed',
        output: stdout 
      });
    } catch (error: any) {
      console.error('[CRON ERROR]', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        output: error.stdout 
      });
    }
  });

  console.log('🔄 Cron API routes registered on port 5000');
  console.log('🔐 API Key authentication enabled');
  console.log('📡 Endpoints:');
  console.log('   POST /api/cron/ff-high-impact');
  console.log('   POST /api/cron/ff-full-refresh');
  console.log('   POST /api/cron/hourly-update');
  console.log('   POST /api/cron/weekly-analysis');
  console.log('   GET  /api/cron/health\n');
}
