/**
 * Vercel Serverless Cron: Market News Update
 * Called by cron-job.org every 30 minutes
 * Fetches latest forex/market news from Finnhub
 */

import { updateMarketNews } from '../../lib/cron/finnhub-news.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify API key for security
  const authHeader = req.headers['x-api-key'];
  const expectedKey = process.env.CRON_API_KEY || 'your-secret-key';

  if (!authHeader || authHeader !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const finnhubKey = process.env.FINNHUB_API_KEY;

    if (!supabaseUrl || !supabaseKey || !finnhubKey) {
      throw new Error('Missing environment variables');
    }

    const success = await updateMarketNews(supabaseUrl, supabaseKey, finnhubKey);

    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Market news updated successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      return res.status(200).json({
        success: false,
        message: 'No news articles fetched',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('News update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
