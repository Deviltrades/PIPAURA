/**
 * Forex Factory Economic Calendar Integration
 * - Fetches this week's events from XML feed
 * - Scores events based on actual vs forecast
 * - Detects new high-impact releases for instant bias updates
 */

import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@supabase/supabase-js';

const FF_FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';

const COUNTRY_TO_CURRENCY: Record<string, string> = {
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

interface ForexEvent {
  country: string;
  title: string;
  impact: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  date: string;
  time: string;
}

export async function fetchFeed(timeout = 15000): Promise<string | null> {
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

export function parseEvents(xmlContent: string): ForexEvent[] {
  const events: ForexEvent[] = [];

  try {
    const parser = new XMLParser();
    const result = parser.parse(xmlContent);

    const eventNodes = result.weeklyevents?.event || [];
    const eventArray = Array.isArray(eventNodes) ? eventNodes : [eventNodes];

    for (const event of eventArray) {
      const eventData: ForexEvent = {
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

export function scoreEvent(
  actual: string | null,
  forecast: string | null,
  impactWeight: number
): number {
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

export async function getProcessedEvents(supabaseUrl: string, supabaseKey: string): Promise<Set<string>> {
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
  supabaseUrl: string,
  supabaseKey: string,
  eventId: string,
  eventData: ForexEvent,
  score: number
): Promise<void> {
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

export function aggregateCurrencyScores(events: ForexEvent[]): Record<string, number> {
  const currencyScores: Record<string, number> = {};

  for (const event of events) {
    const currency = COUNTRY_TO_CURRENCY[event.country];
    if (!currency) continue;

    const impactWeight = IMPACT_WEIGHTS[event.impact as keyof typeof IMPACT_WEIGHTS] || 1;
    const score = scoreEvent(event.actual, event.forecast, impactWeight);

    if (!currencyScores[currency]) {
      currencyScores[currency] = 0;
    }
    currencyScores[currency] += score;
  }

  return currencyScores;
}

export async function updateEconomicScores(
  supabaseUrl: string,
  supabaseKey: string,
  currencyScores: Record<string, number>
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const timestamp = new Date().toISOString();

  for (const [currency, score] of Object.entries(currencyScores)) {
    try {
      await supabase.from('economic_scores').upsert({
        currency,
        total_score: Math.round(score),
        last_updated: timestamp,
      });
    } catch (error) {
      console.error(`⚠️ Failed to update score for ${currency}:`, error);
    }
  }
}

export async function runUpdate(
  supabaseUrl: string,
  supabaseKey: string,
  highImpactOnly = false
): Promise<boolean> {
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

  const newEvents: Array<[string, ForexEvent]> = [];
  for (const event of events) {
    const eventId = `${event.country}_${event.title}_${event.date}`;

    if (!processedIds.has(eventId) && event.actual !== null) {
      newEvents.push([eventId, event]);
    }
  }

  if (!newEvents.length) {
    console.log(`[${timestamp}] ForexFactory update → No new releases`);
    return false;
  }

  const allEventsData: ForexEvent[] = [];
  for (const [eventId, event] of newEvents) {
    const impactWeight = IMPACT_WEIGHTS[event.impact as keyof typeof IMPACT_WEIGHTS] || 1;
    const score = scoreEvent(event.actual, event.forecast, impactWeight);

    allEventsData.push(event);
    await markEventProcessed(supabaseUrl, supabaseKey, eventId, event, score);
  }

  const currencyScores = aggregateCurrencyScores(allEventsData);
  if (Object.keys(currencyScores).length) {
    await updateEconomicScores(supabaseUrl, supabaseKey, currencyScores);
  }

  const highImpactCount = newEvents.filter(([, e]) => e.impact === 'High').length;

  console.log(
    `[${timestamp}] ForexFactory update → ${newEvents.length} events parsed, ${highImpactCount} high impact processed ✅`
  );

  return highImpactCount > 0;
}

export async function getEconomicScores(
  supabaseUrl: string,
  supabaseKey: string
): Promise<Record<string, number>> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('economic_scores')
      .select('currency, total_score');

    if (error) throw error;

    const scores: Record<string, number> = {};
    for (const row of data || []) {
      scores[row.currency] = row.total_score || 0;
    }
    return scores;
  } catch {
    return {};
  }
}
