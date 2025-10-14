import { runUpdate } from '../../lib/cron/forex-factory.js';
import { runHourlyUpdate } from '../../lib/cron/hourly-bias.js';

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

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    console.log('[CRON] Checking for high-impact events...');

    const hasHighImpact = await runUpdate(supabaseUrl, supabaseKey, true);

    if (hasHighImpact) {
      console.log('🚨 High-impact economic event detected! Triggering bias update...');
      await runHourlyUpdate(supabaseUrl, supabaseKey);
    }

    return res.status(200).json({
      success: true,
      message: 'High-impact check completed',
      highImpactDetected: hasHighImpact,
    });
  } catch (error) {
    console.error('[CRON ERROR]', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
