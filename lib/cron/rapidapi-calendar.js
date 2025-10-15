/**
 * RapidAPI Economic Calendar Integration
 * - Fetches economic events from RapidAPI Ultimate Economic Calendar
 * - Processes actual, forecast, and previous values
 * - Compatible with existing forex_events database schema
 */

import { createClient } from '@supabase/supabase-js';

const RAPIDAPI_HOST = 'ultimate-economic-calendar.p.rapidapi.com';

// Map RapidAPI countries to currencies
const COUNTRY_TO_CURRENCY = {
  US: 'USD',
  EU: 'EUR',
  GB: 'GBP',
  JP: 'JPY',
  AU: 'AUD',
  NZ: 'NZD',
  CA: 'CAD',
  CH: 'CHF',
};

// Map importance levels to impact
const IMPORTANCE_TO_IMPACT = {
  3: 'High',
  2: 'Medium',
  1: 'Low',
  0: 'Low',
  '-1': 'Low',
};

/**
 * Fetch economic events from RapidAPI
 * @param {string} rapidApiKey - RapidAPI key
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to - End date (YYYY-MM-DD)
 * @param {string[]} countries - Array of country codes (default: ['US', 'EU', 'GB', 'JP', 'AU', 'NZ', 'CA', 'CH'])
 */
export async function fetchEconomicEvents(
  rapidApiKey,
  from = null,
  to = null,
  countries = ['US', 'EU', 'GB', 'JP', 'AU', 'NZ', 'CA', 'CH']
) {
  try {
    // Default to past 14 days + next 7 days to get both historical and upcoming events
    const today = new Date();
    const startDate = from || new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = to || new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const countryParam = countries.join(', ');
    const url = `https://${RAPIDAPI_HOST}/economic-events/tradingview?from=${startDate}&to=${endDate}&countries=${countryParam}`;

    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`RapidAPI HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    // RapidAPI wraps response in { result: [...] }
    if (data.result && Array.isArray(data.result)) {
      return data.result;
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('⚠️ RapidAPI fetch error:', error.message);
    return [];
  }
}

/**
 * Transform RapidAPI event to our database format
 */
export function transformEvent(event) {
  const country = event.country || 'US';
  const currency = COUNTRY_TO_CURRENCY[country] || country;
  const impact = IMPORTANCE_TO_IMPACT[event.importance] || 'Low';
  
  // Extract date and time from ISO string
  const eventDateTime = new Date(event.date);
  const eventDate = eventDateTime.toISOString().split('T')[0];
  const eventTime = eventDateTime.toISOString().split('T')[1].substring(0, 5);

  return {
    country,
    currency,
    title: event.title || event.indicator || 'Unknown Event',
    impact,
    actual: event.actual !== null && event.actual !== undefined ? String(event.actual) : null,
    forecast: event.forecast !== null && event.forecast !== undefined ? String(event.forecast) : null,
    previous: event.previous !== null && event.previous !== undefined ? String(event.previous) : null,
    date: eventDate,
    time: eventTime,
    rawEvent: event,
  };
}

/**
 * Calculate event score based on actual vs forecast
 */
export function scoreEvent(actual, forecast) {
  if (actual === null || forecast === null) {
    return 0;
  }

  try {
    const actualVal = parseFloat(String(actual).replace('%', '').replace('K', '').replace('M', '').replace('B', ''));
    const forecastVal = parseFloat(String(forecast).replace('%', '').replace('K', '').replace('M', '').replace('B', ''));

    if (isNaN(actualVal) || isNaN(forecastVal) || forecastVal === 0) {
      return 0;
    }

    const diff = (actualVal - forecastVal) / Math.abs(forecastVal);
    return Math.round(diff * 100 * 100) / 100;
  } catch {
    return 0;
  }
}

/**
 * Get already processed event IDs
 */
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

/**
 * Store event in database
 */
export async function storeEvent(
  supabaseUrl,
  supabaseKey,
  eventId,
  eventData,
  score
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('forex_events').insert({
      event_id: eventId,
      country: eventData.country,
      currency: eventData.currency,
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
    console.error('⚠️ Failed to store event:', error);
  }
}

/**
 * Update event when actual value arrives
 */
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

/**
 * Update economic scores for currencies
 */
export async function updateEconomicScores(
  supabaseUrl,
  supabaseKey,
  currenciesUpdated
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const timestamp = new Date().toISOString();

  for (const currency of currenciesUpdated) {
    try {
      const { data: events, error } = await supabase
        .from('forex_events')
        .select('score')
        .eq('currency', currency);

      if (error) throw error;

      const totalScore = events?.reduce((sum, event) => sum + (event.score || 0), 0) || 0;

      await supabase.from('economic_scores').upsert({
        currency,
        total_score: Math.round(totalScore),
        last_updated: timestamp,
      });
    } catch (error) {
      console.error(`⚠️ Failed to update score for ${currency}:`, error);
    }
  }
}

/**
 * Main update function - fetch and process RapidAPI economic events
 */
export async function runRapidApiUpdate(
  supabaseUrl,
  supabaseKey,
  rapidApiKey,
  highImpactOnly = false
) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const rawEvents = await fetchEconomicEvents(rapidApiKey);
  
  if (!rawEvents.length) {
    console.log(`[${timestamp}] RapidAPI update → No events fetched`);
    return false;
  }

  let events = rawEvents.map(transformEvent);

  if (highImpactOnly) {
    events = events.filter((e) => e.impact === 'High');
  }

  const processedIds = await getProcessedEvents(supabaseUrl, supabaseKey);

  const newEvents = [];
  const eventsToUpdate = [];

  for (const event of events) {
    const eventId = `${event.country}_${event.title}_${event.date}`;

    if (!processedIds.has(eventId)) {
      newEvents.push([eventId, event]);
    } else if (event.actual !== null && processedIds.has(eventId)) {
      eventsToUpdate.push([eventId, event]);
    }
  }

  const currenciesUpdated = new Set();

  // Insert new events
  for (const [eventId, event] of newEvents) {
    const score = scoreEvent(event.actual, event.forecast);
    await storeEvent(supabaseUrl, supabaseKey, eventId, event, score);
    
    if (event.actual !== null) {
      currenciesUpdated.add(event.currency);
    }
  }

  // Update existing events with actual values
  for (const [eventId, event] of eventsToUpdate) {
    const score = scoreEvent(event.actual, event.forecast);
    await updateEventActual(supabaseUrl, supabaseKey, eventId, event.actual, score);
    currenciesUpdated.add(event.currency);
  }

  // Recalculate scores
  if (currenciesUpdated.size > 0) {
    await updateEconomicScores(supabaseUrl, supabaseKey, currenciesUpdated);
  }

  const highImpactWithActual = [...newEvents, ...eventsToUpdate].filter(
    ([, e]) => e.impact === 'High' && e.actual !== null
  ).length;

  console.log(
    `[${timestamp}] RapidAPI update → ${newEvents.length} new events, ${eventsToUpdate.length} updated, ${highImpactWithActual} high-impact with actuals ✅`
  );

  return highImpactWithActual > 0;
}
