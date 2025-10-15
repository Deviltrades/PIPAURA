/**
 * Forex Factory Economic Calendar Integration
 * - Fetches this week's events from XML feed
 * - Scores events based on actual vs forecast with Z-score normalization
 * - Applies 72-hour time decay to event scores
 * - Detects new high-impact releases for instant bias updates
 */

import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@supabase/supabase-js';

const FF_FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';

const COUNTRY_TO_CURRENCY = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  JPY: 'JPY',
  AUD: 'AUD',
  NZD: 'NZD',
  CAD: 'CAD',
  CHF: 'CHF',
};

const IMPACT_WEIGHTS = {
  High: 3,
  Medium: 2,
  Low: 1,
};

// Event polarity mapping (positive = good for currency)
const EVENT_POLARITY = {
  // Employment (higher = better)
  'Non-Farm Employment Change': 1,
  'Unemployment Rate': -1, // Lower is better
  'ADP Non-Farm Employment Change': 1,
  'Initial Jobless Claims': -1, // Lower is better
  
  // Inflation (moderate increase = better for hawkish central banks)
  'Core CPI': 1,
  'CPI': 1,
  'Core PPI': 1,
  'PPI': 1,
  'Core PCE Price Index': 1,
  
  // Growth (higher = better)
  'GDP': 1,
  'Retail Sales': 1,
  'Core Retail Sales': 1,
  'Industrial Production': 1,
  'Manufacturing PMI': 1,
  'Services PMI': 1,
  
  // Housing (higher = better)
  'Building Permits': 1,
  'Housing Starts': 1,
  'New Home Sales': 1,
  'Existing Home Sales': 1,
  
  // Sentiment (higher = better)
  'Consumer Confidence': 1,
  'Business Confidence': 1,
  'Michigan Consumer Sentiment': 1,
  
  // Trade (surplus = positive, deficit = negative)
  'Trade Balance': 1,
};

// Rolling standard deviations for normalization (estimated from historical data)
const EVENT_SIGMA = {
  'Non-Farm Employment Change': 100000, // ~100K typical surprise
  'Unemployment Rate': 0.2,              // ~0.2% typical surprise
  'Core CPI': 0.2,                       // ~0.2% typical surprise
  'CPI': 0.3,                            // ~0.3% typical surprise
  'GDP': 0.5,                            // ~0.5% typical surprise
  'Retail Sales': 0.5,                   // ~0.5% typical surprise
  'Core Retail Sales': 0.4,
  'ADP Non-Farm Employment Change': 80000,
  'Initial Jobless Claims': 20000,
  'Manufacturing PMI': 1.0,
  'Services PMI': 1.0,
  'Trade Balance': 5.0,
  // Default for unmapped events
  DEFAULT: 1.0,
};

export async function fetchFeed(timeout = 15000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(FF_FEED_URL, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('⚠️ FF feed timeout:', error);
    return null;
  }
}

export function parseEvents(xmlContent) {
  const events = [];

  try {
    const parser = new XMLParser();
    const result = parser.parse(xmlContent);

    const eventNodes = result.weeklyevents?.event || [];
    const eventArray = Array.isArray(eventNodes) ? eventNodes : [eventNodes];

    for (const event of eventArray) {
      const eventData = {
        country: event.country || '',
        title: event.title || '',
        impact: event.impact || 'Low',
        actual: event.actual || null,
        forecast: event.forecast || null,
        previous: event.previous || null,
        date: event.date || '',
        time: event.time || '',
      };

      if (eventData.country && eventData.title) {
        events.push(eventData);
      }
    }
  } catch (error) {
    console.error('⚠️ XML parse error:', error);
    return [];
  }

  return events;
}

/**
 * Score event using Z-score normalization + Tanh scaling
 * Returns value bounded to ±7
 */
export function scoreEvent(actual, forecast, eventTitle, impactWeight) {
  if (actual === null || forecast === null) {
    return 0;
  }

  try {
    const actualVal = parseFloat(
      String(actual).replace('%', '').replace('K', '').replace('M', '').replace('B', '')
    );
    const forecastVal = parseFloat(
      String(forecast).replace('%', '').replace('K', '').replace('M', '').replace('B', '')
    );

    if (isNaN(actualVal) || isNaN(forecastVal)) {
      return 0;
    }

    // Get event-specific sigma or use default
    const sigma = EVENT_SIGMA[eventTitle] || EVENT_SIGMA.DEFAULT;
    
    // Z-score normalization
    const diff = actualVal - forecastVal;
    const z = diff / sigma;
    
    // Tanh scaling bounded to ±7, scaled by impact weight
    const baseScore = 7 * Math.tanh(z / 2);
    
    // Apply event polarity (some events are inversely correlated)
    const polarity = EVENT_POLARITY[eventTitle] || 1;
    
    // Final score with impact weight
    const finalScore = baseScore * polarity * (impactWeight / 3); // Normalize by max impact
    
    return Math.round(finalScore * 100) / 100;
  } catch {
    return 0;
  }
}

export async function getProcessedEvents(supabaseUrl, supabaseKey) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('forex_events')
      .select('event_id');

    if (error) throw error;

    return new Set(data?.map((row) => row.event_id) || []);
  } catch {
    return new Set();
  }
}

export async function markEventProcessed(
  supabaseUrl,
  supabaseKey,
  eventId,
  eventData,
  score
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const currency = COUNTRY_TO_CURRENCY[eventData.country] || eventData.country;

    await supabase.from('forex_events').insert({
      event_id: eventId,
      country: eventData.country,
      currency,
      title: eventData.title,
      impact: eventData.impact,
      actual: eventData.actual,
      forecast: eventData.forecast,
      previous: eventData.previous,
      event_date: eventData.date,
      event_time: eventData.time,
      score,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Failed to mark event processed:', error);
  }
}

export async function updateEventActual(
  supabaseUrl,
  supabaseKey,
  eventId,
  actualValue,
  score
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase
      .from('forex_events')
      .update({
        actual: actualValue,
        score,
        processed_at: new Date().toISOString(),
      })
      .eq('event_id', eventId);
  } catch (error) {
    console.error('⚠️ Failed to update event actual:', error);
  }
}

export function aggregateCurrencyScores(events) {
  const currencyScores = {};

  for (const event of events) {
    const currency = COUNTRY_TO_CURRENCY[event.country];
    if (!currency) continue;

    const impactWeight = IMPACT_WEIGHTS[event.impact] || 1;
    const score = scoreEvent(event.actual, event.forecast, event.title, impactWeight);

    if (!currencyScores[currency]) {
      currencyScores[currency] = 0;
    }
    currencyScores[currency] += score;
  }

  return currencyScores;
}

export async function updateEconomicScores(
  supabaseUrl,
  supabaseKey,
  currenciesUpdated
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const timestamp = new Date().toISOString();

  // For each currency that had new events, recalculate total from ALL processed events
  for (const currency of currenciesUpdated) {
    try {
      // Query all processed events for this currency
      const { data: events, error } = await supabase
        .from('forex_events')
        .select('score')
        .eq('currency', currency);

      if (error) throw error;

      // Sum all scores to get cumulative total
      const totalScore = events?.reduce((sum, event) => sum + (event.score || 0), 0) || 0;

      await supabase.from('economic_scores').upsert({
        currency,
        total_score: Math.round(totalScore * 100) / 100,
        last_updated: timestamp,
      });
    } catch (error) {
      console.error(`⚠️ Failed to update score for ${currency}:`, error);
    }
  }
}

export async function runUpdate(
  supabaseUrl,
  supabaseKey,
  highImpactOnly = false
) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const xmlContent = await fetchFeed();
  if (!xmlContent) {
    console.log(`[${timestamp}] ForexFactory update → Feed unavailable`);
    return false;
  }

  let events = parseEvents(xmlContent);
  if (!events.length) {
    console.log(`[${timestamp}] ForexFactory update → No events parsed`);
    return false;
  }

  if (highImpactOnly) {
    events = events.filter((e) => e.impact === 'High');
  }

  const processedIds = await getProcessedEvents(supabaseUrl, supabaseKey);

  const newEvents = [];
  const eventsToUpdate = [];
  
  for (const event of events) {
    const eventId = `${event.country}_${event.title}_${event.date}`;

    if (!processedIds.has(eventId)) {
      // Store new events even without actual values (for forecast/previous)
      newEvents.push([eventId, event]);
    } else if (event.actual !== null && processedIds.has(eventId)) {
      // Update existing events when actual value arrives
      eventsToUpdate.push([eventId, event]);
    }
  }

  const currenciesUpdated = new Set();
  
  // Insert new events (even without actual values)
  for (const [eventId, event] of newEvents) {
    const impactWeight = IMPACT_WEIGHTS[event.impact] || 1;
    const score = scoreEvent(event.actual, event.forecast, event.title, impactWeight);

    await markEventProcessed(supabaseUrl, supabaseKey, eventId, event, score);
    
    const currency = COUNTRY_TO_CURRENCY[event.country];
    if (currency && event.actual !== null) {
      currenciesUpdated.add(currency);
    }
  }
  
  // Update existing events when actual values arrive
  for (const [eventId, event] of eventsToUpdate) {
    const impactWeight = IMPACT_WEIGHTS[event.impact] || 1;
    const score = scoreEvent(event.actual, event.forecast, event.title, impactWeight);

    await updateEventActual(supabaseUrl, supabaseKey, eventId, event.actual, score);
    
    const currency = COUNTRY_TO_CURRENCY[event.country];
    if (currency) {
      currenciesUpdated.add(currency);
    }
  }

  // Recalculate total scores for currencies with new actual values
  if (currenciesUpdated.size > 0) {
    await updateEconomicScores(supabaseUrl, supabaseKey, currenciesUpdated);
  }

  const highImpactWithActual = [...newEvents, ...eventsToUpdate].filter(
    ([, e]) => e.impact === 'High' && e.actual !== null
  ).length;

  console.log(
    `[${timestamp}] ForexFactory update → ${newEvents.length} new events, ${eventsToUpdate.length} updated, ${highImpactWithActual} high-impact with actuals ✅`
  );

  return highImpactWithActual > 0;
}

/**
 * Get economic scores with 72-hour time decay applied
 */
export async function getEconomicScores(
  supabaseUrl,
  supabaseKey
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();
    
    // Get all events with their timestamps
    const { data: events, error } = await supabase
      .from('forex_events')
      .select('currency, score, processed_at')
      .not('actual', 'is', null); // Only events with actual values

    if (error) throw error;

    const currencyScores = {};
    
    for (const event of events || []) {
      const { currency, score, processed_at } = event;
      
      if (!currency || score === null || !processed_at) continue;
      
      // Calculate time decay (72-hour half-life)
      const eventTime = new Date(processed_at);
      const hoursSince = (now - eventTime) / (1000 * 60 * 60);
      const lambda = Math.exp(-(Math.log(2) * hoursSince) / 72);
      
      // Apply exponential decay
      const decayedScore = score * lambda;
      
      if (!currencyScores[currency]) {
        currencyScores[currency] = 0;
      }
      currencyScores[currency] += decayedScore;
    }
    
    // Round to 2 decimal places
    for (const currency in currencyScores) {
      currencyScores[currency] = Math.round(currencyScores[currency] * 100) / 100;
    }
    
    return currencyScores;
  } catch (error) {
    console.error('⚠️ Failed to get economic scores:', error);
    return {};
  }
}
