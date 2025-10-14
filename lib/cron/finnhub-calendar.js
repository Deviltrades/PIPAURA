/**
 * Finnhub Economic Calendar Integration
 * - Fetches economic events with actual vs forecast data
 * - Scores events based on surprise factor
 * - Updates forex_events and economic_scores tables
 */

import { createClient } from '@supabase/supabase-js';

const FINNHUB_API_URL = 'https://finnhub.io/api/v1/calendar/economic';

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

const IMPACT_WEIGHTS = {
  high: 3,
  medium: 2,
  low: 1,
};

export async function fetchEconomicCalendar(apiKey) {
  try {
    const response = await fetch(`${FINNHUB_API_URL}?token=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.economicCalendar || [];
  } catch (error) {
    console.error('⚠️ Finnhub API error:', error);
    return [];
  }
}

export function scoreEvent(actual, estimate, impact) {
  if (actual === null || estimate === null || estimate === 0) {
    return 0;
  }

  try {
    const actualNum = parseFloat(actual);
    const estimateNum = parseFloat(estimate);

    if (isNaN(actualNum) || isNaN(estimateNum)) {
      return 0;
    }

    const impactWeight = IMPACT_WEIGHTS[impact?.toLowerCase()] || 1;
    const diff = (actualNum - estimateNum) / Math.abs(estimateNum);
    return Math.round(diff * impactWeight * 100 * 100) / 100;
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
  event,
  score
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const currency = COUNTRY_TO_CURRENCY[event.country] || event.country;

    await supabase.from('forex_events').insert({
      event_id: eventId,
      country: event.country,
      currency,
      title: event.event || '',
      impact: event.impact || 'low',
      actual: event.actual?.toString() || null,
      forecast: event.estimate?.toString() || null,
      previous: event.prev?.toString() || null,
      event_date: new Date(event.time * 1000).toISOString().split('T')[0],
      event_time: new Date(event.time * 1000).toISOString().split('T')[1].substring(0, 5),
      score,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('⚠️ Failed to mark event processed:', error);
  }
}

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

export async function runUpdate(
  supabaseUrl,
  supabaseKey,
  finnhubApiKey
) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const events = await fetchEconomicCalendar(finnhubApiKey);
  
  if (!events.length) {
    console.log(`[${timestamp}] Finnhub update → No events returned`);
    return false;
  }

  const processedIds = await getProcessedEvents(supabaseUrl, supabaseKey);

  const newEvents = [];
  for (const event of events) {
    // Only process events with actual values
    if (event.actual !== null && event.actual !== undefined) {
      const eventId = `${event.country}_${event.event}_${event.time}`;
      
      if (!processedIds.has(eventId)) {
        newEvents.push([eventId, event]);
      }
    }
  }

  if (!newEvents.length) {
    console.log(`[${timestamp}] Finnhub update → No new releases`);
    return false;
  }

  const currenciesUpdated = new Set();
  for (const [eventId, event] of newEvents) {
    const score = scoreEvent(event.actual, event.estimate, event.impact);
    
    await markEventProcessed(supabaseUrl, supabaseKey, eventId, event, score);
    
    const currency = COUNTRY_TO_CURRENCY[event.country];
    if (currency) {
      currenciesUpdated.add(currency);
    }
  }

  if (currenciesUpdated.size > 0) {
    await updateEconomicScores(supabaseUrl, supabaseKey, currenciesUpdated);
  }

  console.log(
    `[${timestamp}] Finnhub update → ${newEvents.length} events processed ✅`
  );

  return true;
}
