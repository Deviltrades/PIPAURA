import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runUpdate as runForexFactoryUpdate } from '../../lib/cron/forex-factory';

const API_KEY = process.env.CRON_API_KEY || 'your-secret-key-here';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Check API key
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    console.log('[CRON] Running FF Full Refresh...');

    // Run Forex Factory update (all events)
    await runForexFactoryUpdate(supabaseUrl, supabaseKey, false);

    return res.status(200).json({
      success: true,
      message: 'FF full refresh completed',
    });
  } catch (error: any) {
    console.error('[CRON ERROR]', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
