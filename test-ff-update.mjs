import { runUpdate } from './lib/cron/forex-factory.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔄 Testing Forex Factory update...\n');
const result = await runUpdate(supabaseUrl, supabaseKey, false);
console.log('\n✅ Test complete! High impact detected:', result);
