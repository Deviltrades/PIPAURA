/**
 * Finnhub Market News Integration
 * - Fetches latest forex and general market news
 * - Classifies impact level based on category
 * - Stores in Supabase market_news table
 */

import { createClient } from '@supabase/supabase-js';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Impact classification based on news category
const CATEGORY_IMPACT = {
  'forex': 'high',
  'crypto': 'high',
  'merger': 'high',
  'ipo': 'medium',
  'company': 'medium',
  'general': 'low',
};

/**
 * Fetch market news from Finnhub API
 */
async function fetchFinnhubNews(apiKey, category = 'forex') {
  try {
    const url = `${FINNHUB_BASE_URL}/news?category=${category}&token=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`Failed to fetch ${category} news:`, error.message);
    return [];
  }
}

/**
 * Determine impact level based on keywords and category
 */
function classifyImpact(headline, summary, category) {
  const text = `${headline} ${summary || ''}`.toLowerCase();
  
  // High impact keywords
  const highImpactKeywords = [
    'federal reserve', 'fed', 'ecb', 'central bank', 'interest rate',
    'nfp', 'non-farm', 'employment', 'unemployment', 'cpi', 'inflation',
    'gdp', 'fomc', 'rate cut', 'rate hike', 'policy', 'crisis'
  ];

  // Medium impact keywords
  const mediumImpactKeywords = [
    'retail sales', 'consumer', 'manufacturing', 'pmi', 'jobs',
    'housing', 'trade', 'deficit', 'surplus', 'earnings'
  ];

  // Check for high impact
  if (highImpactKeywords.some(keyword => text.includes(keyword))) {
    return 'high';
  }

  // Check for medium impact
  if (mediumImpactKeywords.some(keyword => text.includes(keyword))) {
    return 'medium';
  }

  // Default to category-based impact
  return CATEGORY_IMPACT[category] || 'low';
}

/**
 * Store news articles in Supabase
 */
async function storeNews(supabase, newsArticles) {
  const timestamp = new Date().toISOString();
  let inserted = 0;
  let skipped = 0;

  for (const article of newsArticles) {
    try {
      const impactLevel = classifyImpact(
        article.headline,
        article.summary,
        article.category
      );

      const newsData = {
        headline: article.headline,
        summary: article.summary || '',
        source: article.source || 'Market News',
        category: article.category || 'general',
        datetime: article.datetime,
        url: article.url || '',
        image: article.image || '',
        related: article.related || '',
        impact_level: impactLevel,
      };

      // Use upsert to avoid duplicates
      const { error } = await supabase
        .from('market_news')
        .upsert(newsData, { 
          onConflict: 'headline,datetime',
          ignoreDuplicates: true 
        });

      if (error) {
        if (error.code !== '23505') { // Ignore duplicate key errors
          console.error('Error storing news:', error.message);
        }
        skipped++;
      } else {
        inserted++;
      }
    } catch (error) {
      console.error('Failed to store article:', error.message);
      skipped++;
    }
  }

  return { inserted, skipped };
}

/**
 * Clean up old news (keep last 7 days)
 */
async function cleanupOldNews(supabase) {
  try {
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

    const { error } = await supabase
      .from('market_news')
      .delete()
      .lt('datetime', sevenDaysAgo);

    if (error) throw error;

    console.log('✅ Cleaned up news older than 7 days');
  } catch (error) {
    console.error('⚠️ Failed to cleanup old news:', error.message);
  }
}

/**
 * Main update function
 */
export async function updateMarketNews(supabaseUrl, supabaseKey, finnhubKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  console.log(`[${timestamp}] Fetching market news from Finnhub...`);

  // Fetch news from multiple categories
  const categories = ['forex', 'general', 'crypto'];
  const allNews = [];

  for (const category of categories) {
    const news = await fetchFinnhubNews(finnhubKey, category);
    allNews.push(...news);
  }

  if (allNews.length === 0) {
    console.log(`[${timestamp}] No news articles fetched`);
    return false;
  }

  // Sort by datetime (newest first) and limit to 50 most recent
  const sortedNews = allNews
    .sort((a, b) => b.datetime - a.datetime)
    .slice(0, 50);

  // Store news in database
  const { inserted, skipped } = await storeNews(supabase, sortedNews);

  console.log(
    `[${timestamp}] Market News Update → ${inserted} inserted, ${skipped} skipped/duplicate`
  );

  // Cleanup old news
  await cleanupOldNews(supabase);

  console.log(`[${timestamp}] ✅ Market news updated successfully`);
  return true;
}
