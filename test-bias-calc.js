/**
 * Test Bias Calculation
 * Manually triggers hourly bias update
 */

import { runHourlyUpdate } from './lib/cron/hourly-bias.js';

async function testBiasCalculation() {
  console.log('🧪 Testing Hourly Bias Calculation...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  console.log('✓ Environment variables configured');
  console.log('📊 Running bias calculation for all currencies and pairs...\n');

  try {
    await runHourlyUpdate(supabaseUrl, supabaseKey);

    console.log('\n✅ Bias calculation completed!');

    // Check results
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: biasData, error: biasError } = await supabase
      .from('fundamental_bias')
      .select('*')
      .order('total_bias', { ascending: false })
      .limit(10);

    if (biasError) {
      console.error('❌ Error fetching bias data:', biasError);
    } else {
      console.log(`\n📈 Top 10 FX Pairs by Bias:`);
      biasData?.forEach((bias, i) => {
        console.log(`  ${i + 1}. ${bias.pair}: ${bias.total_bias > 0 ? '+' : ''}${bias.total_bias} (${bias.bias_text})`);
      });
    }

    const { count } = await supabase
      .from('fundamental_bias')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total FX pairs calculated: ${count}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testBiasCalculation();
