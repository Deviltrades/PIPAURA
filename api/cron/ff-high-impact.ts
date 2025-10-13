import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runUpdate as runForexFactoryUpdate } from '../../lib/cron/forex-factory';
import { runHourlyUpdate } from '../../lib/cron/hourly-bias';

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

    console.log('[CRON] Running FF High-Impact Check...');

    // Run Forex Factory update with high-impact filter
    const hasHighImpact = await runForexFactoryUpdate(supabaseUrl, supabaseKey, true);

    // If high-impact events found, trigger bias recalculation
    if (hasHighImpact) {
      console.log('🚨 High-impact events detected! Triggering instant bias update...');
      await runHourlyUpdate(supabaseUrl, supabaseKey);
    }

    return res.status(200).json({
      success: true,
      message: 'FF high-impact check completed',
      highImpactDetected: hasHighImpact,
    });
  } catch (error: any) {
    console.error('[CRON ERROR]', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
