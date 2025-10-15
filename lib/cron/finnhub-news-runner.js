/**
 * Finnhub News Update Runner
 * Executable script for cron endpoint
 */

import { updateMarketNews } from './finnhub-news.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for cron jobs
const finnhubKey = process.env.FINNHUB_API_KEY;

if (!supabaseUrl || !supabaseKey || !finnhubKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

updateMarketNews(supabaseUrl, supabaseKey, finnhubKey)
  .then((success) => {
    if (success) {
      console.log('✅ Market news update completed');
      process.exit(0);
    } else {
      console.error('⚠️ No news articles fetched');
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error('❌ Market news update failed:', error.message);
    process.exit(1);
  });
