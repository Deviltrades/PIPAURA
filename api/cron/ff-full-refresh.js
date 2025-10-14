import { runRapidApiUpdate } from '../../lib/cron/rapidapi-calendar.js';

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

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    if (!rapidApiKey) {
      throw new Error('Missing RAPIDAPI_KEY');
    }

    console.log('[CRON] Running RapidAPI Economic Calendar Full Refresh...');

    await runRapidApiUpdate(supabaseUrl, supabaseKey, rapidApiKey, false);

    return res.status(200).json({
      success: true,
      message: 'RapidAPI economic calendar refresh completed',
    });
  } catch (error) {
    console.error('[CRON ERROR]', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
