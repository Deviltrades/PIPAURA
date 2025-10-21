/**
 * Unified cron endpoint - handles all scheduled tasks
 * Routes: /api/cron?job=<job_name>
 * 
 * Jobs:
 * - ff-high-impact: High-impact event check (every 15 min)
 * - ff-full-refresh: Full calendar refresh (every 4 hours)
 * - hourly-update: Hourly bias update (every 30 min)
 * - news-update: Market news update (every 30 min)
 * - health: Health check endpoint
 */

import { runRapidApiUpdate } from '../lib/cron/rapidapi-calendar.js';
import { runHourlyUpdate } from '../lib/cron/hourly-bias.js';
import { runNewsUpdate } from '../lib/cron/news-update.js';

export default async function handler(req, res) {
  const API_KEY = process.env.CRON_API_KEY;
  if (!API_KEY) {
    console.error('CRON_API_KEY not configured');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }

  const job = req.query.job;
  
  if (!job) {
    return res.status(400).json({ 
      error: 'Missing job parameter',
      usage: '/api/cron?job=<job_name>',
      availableJobs: ['ff-high-impact', 'ff-full-refresh', 'hourly-update', 'news-update', 'health']
    });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    switch (job) {
      case 'ff-high-impact':
        if (!rapidApiKey) {
          throw new Error('Missing RAPIDAPI_KEY');
        }
        console.log('[CRON] Checking for high-impact economic events...');
        const hasHighImpact = await runRapidApiUpdate(supabaseUrl, supabaseKey, rapidApiKey, true);
        if (hasHighImpact) {
          console.log('🚨 High-impact economic event detected! Triggering bias update...');
          await runHourlyUpdate(supabaseUrl, supabaseKey);
        }
        return res.status(200).json({
          success: true,
          message: 'High-impact RapidAPI check completed',
          highImpactDetected: hasHighImpact,
        });

      case 'ff-full-refresh':
        if (!rapidApiKey) {
          throw new Error('Missing RAPIDAPI_KEY');
        }
        console.log('[CRON] Running RapidAPI Economic Calendar Full Refresh...');
        await runRapidApiUpdate(supabaseUrl, supabaseKey, rapidApiKey, false);
        return res.status(200).json({
          success: true,
          message: 'RapidAPI economic calendar refresh completed',
        });

      case 'hourly-update':
        console.log('[CRON] Running Hourly Bias Update...');
        await runHourlyUpdate(supabaseUrl, supabaseKey);
        return res.status(200).json({
          success: true,
          message: 'Hourly bias update completed',
        });

      case 'news-update':
        const finnhubKey = process.env.FINNHUB_API_KEY;
        if (!finnhubKey) {
          throw new Error('Missing FINNHUB_API_KEY');
        }
        console.log('[CRON] Running Market News Update...');
        await runNewsUpdate(supabaseUrl, supabaseKey, finnhubKey);
        return res.status(200).json({
          success: true,
          message: 'Market news update completed',
        });

      case 'health':
        return res.status(200).json({
          success: true,
          message: 'Cron system healthy',
          timestamp: new Date().toISOString(),
          availableJobs: ['ff-high-impact', 'ff-full-refresh', 'hourly-update', 'news-update', 'health']
        });

      default:
        return res.status(400).json({
          error: `Unknown job: ${job}`,
          availableJobs: ['ff-high-impact', 'ff-full-refresh', 'hourly-update', 'news-update', 'health']
        });
    }
  } catch (error) {
    console.error('[CRON ERROR]', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
