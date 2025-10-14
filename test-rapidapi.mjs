import { runRapidApiUpdate } from './lib/cron/rapidapi-calendar.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const rapidApiKey = process.env.RAPIDAPI_KEY;

console.log('🔄 Testing RapidAPI Economic Calendar...\n');
console.log('Supabase URL:', supabaseUrl ? '✓' : '✗');
console.log('Supabase Key:', supabaseKey ? '✓' : '✗');
console.log('RapidAPI Key:', rapidApiKey ? '✓' : '✗');
console.log('');

const result = await runRapidApiUpdate(supabaseUrl, supabaseKey, rapidApiKey, false);
console.log('\n✅ Test complete! High impact detected:', result);
