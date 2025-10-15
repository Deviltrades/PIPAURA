/**
 * Test RapidAPI Calendar Integration
 * Manually triggers calendar fetch and database update
 */

import { runRapidApiUpdate } from './lib/cron/rapidapi-calendar.js';

async function testRapidAPIIntegration() {
  console.log('🧪 Testing RapidAPI Economic Calendar Integration...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  // Check environment variables
  console.log('✓ Checking environment variables...');
  if (!supabaseUrl) {
    console.error('❌ Missing VITE_SUPABASE_URL');
    process.exit(1);
  }
  if (!supabaseKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!rapidApiKey) {
    console.error('❌ Missing RAPIDAPI_KEY');
    process.exit(1);
  }

  console.log(`✓ Supabase URL: ${supabaseUrl.substring(0, 30)}...`);
  console.log(`✓ RapidAPI Key: ${rapidApiKey.substring(0, 10)}...`);
  console.log('');

  try {
    console.log('📡 Fetching economic events from RapidAPI...\n');
    
    // Run the full calendar refresh
    const hadHighImpact = await runRapidApiUpdate(
      supabaseUrl,
      supabaseKey,
      rapidApiKey,
      false // Get all events, not just high impact
    );

    console.log('');
    console.log('✅ RapidAPI calendar update completed successfully!');
    if (hadHighImpact) {
      console.log('⚡ High-impact events with actual values detected!');
    }

    // Check what was inserted
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: events, error } = await supabase
      .from('forex_events')
      .select('*')
      .order('event_date', { ascending: true })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching events:', error);
    } else {
      console.log(`\n📊 Database now contains ${events?.length || 0} events (showing first 10):`);
      events?.forEach((event, i) => {
        console.log(`  ${i + 1}. ${event.date} ${event.time} - ${event.currency} - ${event.title} (${event.impact})`);
      });
    }

    // Check total count
    const { count } = await supabase
      .from('forex_events')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📈 Total events in database: ${count}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testRapidAPIIntegration();
