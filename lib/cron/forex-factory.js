/**
 * Forex Factory Economic Calendar Integration
 * - Fetches this week's events from XML feed
 * - Scores events based on actual vs forecast
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

export function scoreEvent(actual, forecast, impactWeight) {
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

    if (isNaN(actualVal) || isNaN(forecastVal) || forecastVal === 0) {
      return 0;
    }

    const diff = (actualVal - forecastVal) / Math.abs(forecastVal);
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
    const score = scoreEvent(event.actual, event.forecast, impactWeight);

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
    const score = scoreEvent(event.actual, event.forecast, impactWeight);

    await markEventProcessed(supabaseUrl, supabaseKey, eventId, event, score);
    
    const currency = COUNTRY_TO_CURRENCY[event.country];
    if (currency && event.actual !== null) {
      currenciesUpdated.add(currency);
    }
  }
  
  // Update existing events when actual values arrive
  for (const [eventId, event] of eventsToUpdate) {
    const impactWeight = IMPACT_WEIGHTS[event.impact] || 1;
    const score = scoreEvent(event.actual, event.forecast, impactWeight);

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

export async function getEconomicScores(
  supabaseUrl,
  supabaseKey
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('economic_scores')
      .select('currency, total_score');

    if (error) throw error;

    const scores = {};
    for (const row of data || []) {
      scores[row.currency] = row.total_score || 0;
    }
    return scores;
  } catch {
    return {};
  }
}
