import { runUpdate as runFinnhubUpdate } from '../../lib/cron/finnhub-calendar.js';

export default async function handler(req, res) {
  // Check API key (fail closed if not configured)
  const API_KEY = process.env.CRON_API_KEY;
  if (!API_KEY) {
    console.error('CRON_API_KEY not configured');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const finnhubKey = process.env.FINNHUB_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    if (!finnhubKey) {
      throw new Error('Missing FINNHUB_API_KEY');
    }

    console.log('[CRON] Running Finnhub Economic Calendar Update...');

    // Run Finnhub economic calendar update
    await runFinnhubUpdate(supabaseUrl, supabaseKey, finnhubKey);

    return res.status(200).json({
      success: true,
      message: 'Finnhub economic calendar update completed',
    });
  } catch (error) {
    console.error('[CRON ERROR]', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
