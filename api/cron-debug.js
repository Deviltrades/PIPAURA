/**
 * Diagnostic endpoint to check cron system health
 * URL: /api/cron-debug?api_key=YOUR_KEY
 */

export default async function handler(req, res) {
  const API_KEY = process.env.CRON_API_KEY;
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
      RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ? '✅ Set' : '❌ Missing',
      FINNHUB_API_KEY: process.env.FINNHUB_API_KEY ? '✅ Set' : '❌ Missing',
      CRON_API_KEY: process.env.CRON_API_KEY ? '✅ Set' : '❌ Missing',
    },
    supabaseConnection: null,
    databaseTables: null,
  };

  // Test Supabase connection
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      diagnostics.supabaseConnection = '❌ Missing credentials';
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Test connection by checking if tables exist
      const tables = ['fundamental_bias', 'currency_scores', 'index_bias', 'forex_events', 'market_news', 'market_drivers'];
      const tableStatus = {};
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (error) {
            tableStatus[table] = `❌ Error: ${error.message}`;
          } else {
            tableStatus[table] = `✅ Exists (${data?.length || 0} sample rows)`;
          }
        } catch (err) {
          tableStatus[table] = `❌ Error: ${err.message}`;
        }
      }
      
      diagnostics.supabaseConnection = '✅ Connected';
      diagnostics.databaseTables = tableStatus;
      
      // Check last update times
      try {
        const { data: biasData } = await supabase
          .from('fundamental_bias')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);
        
        const { data: newsData } = await supabase
          .from('market_news')
          .select('datetime')
          .order('datetime', { ascending: false })
          .limit(1);
        
        diagnostics.lastUpdates = {
          fundamental_bias: biasData?.[0]?.updated_at || 'Never',
          market_news: newsData?.[0]?.datetime ? new Date(newsData[0].datetime * 1000).toISOString() : 'Never',
        };
      } catch (err) {
        diagnostics.lastUpdates = `Error checking: ${err.message}`;
      }
    }
  } catch (error) {
    diagnostics.supabaseConnection = `❌ Error: ${error.message}`;
  }

  return res.status(200).json(diagnostics);
}
