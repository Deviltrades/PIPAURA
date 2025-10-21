/**
 * Hourly/30-min bias engine refresh (Institutional-Grade v2.0)
 * - Uses Yahoo Finance for market data
 * - Z-score normalized economic data with time decay
 * - Interest rate differential component
 * - EWMA smoothing to prevent whipsaws
 * - Dynamic risk regime scaling
 * - Updates currencies, FX pairs, and indices
 */

import { createClient } from '@supabase/supabase-js';
import { getEconomicScores } from './forex-factory.js';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'XAU', 'XAG'];

const PAIRS = [
  // Majors
  ['EUR', 'USD'],
  ['GBP', 'USD'],
  ['USD', 'JPY'],
  ['USD', 'CHF'],
  ['USD', 'CAD'],
  ['AUD', 'USD'],
  ['NZD', 'USD'],
  // EUR crosses
  ['EUR', 'GBP'],
  ['EUR', 'JPY'],
  ['EUR', 'CHF'],
  ['EUR', 'AUD'],
  ['EUR', 'CAD'],
  ['EUR', 'NZD'],
  // GBP crosses
  ['GBP', 'JPY'],
  ['GBP', 'CHF'],
  ['GBP', 'AUD'],
  ['GBP', 'CAD'],
  ['GBP', 'NZD'],
  // AUD crosses
  ['AUD', 'JPY'],
  ['AUD', 'CHF'],
  ['AUD', 'NZD'],
  ['AUD', 'CAD'],
  // NZD crosses
  ['NZD', 'JPY'],
  ['NZD', 'CHF'],
  ['NZD', 'CAD'],
  // CAD & CHF crosses
  ['CAD', 'JPY'],
  ['CAD', 'CHF'],
  ['CHF', 'JPY'],
  // Metals
  ['XAU', 'USD'],
  ['XAG', 'USD'],
];

const INDICES = [
  ['US500', 'USD', 'S&P 500'],
  ['US100', 'USD', 'Nasdaq 100'],
  ['US30', 'USD', 'Dow Jones'],
  ['UK100', 'GBP', 'FTSE 100'],
  ['GER40', 'EUR', 'DAX 40'],
  ['FRA40', 'EUR', 'CAC 40'],
  ['EU50', 'EUR', 'EuroStoxx 50'],
  ['JP225', 'JPY', 'Nikkei 225'],
  ['HK50', 'HKD', 'Hang Seng'],
  ['AUS200', 'AUD', 'ASX 200'],
];

const CENTRAL_BANK_TONE = {
  USD: 'hawkish',
  EUR: 'neutral',
  GBP: 'neutral',
  JPY: 'dovish',
  CAD: 'dovish',
  AUD: 'neutral',
  NZD: 'neutral',
  CHF: 'neutral',
};

// Central bank policy rates (updated manually based on latest decisions)
const CENTRAL_BANK_RATES = {
  USD: 5.25,  // Fed Funds Rate (midpoint)
  EUR: 4.00,  // ECB Deposit Rate
  GBP: 5.25,  // BoE Base Rate
  JPY: 0.25,  // BoJ Policy Rate
  CAD: 4.50,  // BoC Overnight Rate
  AUD: 4.35,  // RBA Cash Rate
  NZD: 5.50,  // RBNZ OCR
  CHF: 1.50,  // SNB Policy Rate
};

// Base weights (can be adjusted by risk regime)
const W_CB_TONE = 3;
const W_COMMODITY = 2;
const W_MARKET = 2;
const W_RATE_DIFF = 3;
const W_ECONOMIC = 7; // Reduced from 10 due to z-score normalization

// EWMA smoothing parameter (balanced: responsive yet stable)
const EWMA_ALPHA = 0.55; // New score weight (0.45 for previous)

async function getYahooPrice(ticker, days = 7) {
  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;

    const response = await fetch(url);
    const data = await response.json();

    const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
    if (closes && closes.length >= 2) {
      const validCloses = closes.filter((c) => c !== null);
      if (validCloses.length >= 2) {
        return [validCloses[validCloses.length - 1], validCloses[0]];
      }
    }
  } catch {
    // Silent fail
  }
  return null;
}

async function getPercentChange(ticker) {
  const prices = await getYahooPrice(ticker);
  if (prices) {
    const [latest, oldest] = prices;
    return Math.round(((latest - oldest) / oldest) * 100 * 100) / 100;
  }
  return 0.0;
}

async function fetchMarkets() {
  const tickerMap = {
    DXY: 'DX-Y.NYB',
    WTI: 'CL=F',
    GOLD: 'GC=F',
    COPPER: 'HG=F',
    SPX: '^GSPC',
    UST10Y: '^TNX',
    VIX: '^VIX',
  };

  const results = await Promise.all(
    Object.entries(tickerMap).map(async ([key, ticker]) => {
      const pct = await getPercentChange(ticker);
      return [key, pct];
    })
  );

  return Object.fromEntries(results);
}

function scoreCBTone(tone) {
  if (tone === 'hawkish') return [W_CB_TONE, ['CB: hawkish']];
  if (tone === 'dovish') return [-W_CB_TONE, ['CB: dovish']];
  return [0, []];
}

function scoreCommodities(ccy, mkt) {
  let s = 0;
  const notes = [];

  if (ccy === 'CAD') {
    if (mkt.WTI >= 1.0) {
      s += W_COMMODITY;
      notes.push('Oil↑ → CAD+');
    }
    if (mkt.WTI <= -1.0) {
      s -= W_COMMODITY;
      notes.push('Oil↓ → CAD-');
    }
  }

  if (ccy === 'AUD') {
    if (mkt.COPPER >= 1.0) {
      s += 1;
      notes.push('Copper↑ → AUD+');
    }
    if (mkt.COPPER <= -1.0) {
      s -= 1;
      notes.push('Copper↓ → AUD-');
    }
    if (mkt.GOLD >= 1.0) {
      s += 1;
      notes.push('Gold↑ → AUD+');
    }
    if (mkt.GOLD <= -1.0) {
      s -= 1;
      notes.push('Gold↓ → AUD-');
    }
  }

  if (ccy === 'NZD') {
    if (mkt.SPX >= 1.0) {
      s += 1;
      notes.push('Risk-on → NZD+');
    }
    if (mkt.SPX <= -1.0) {
      s -= 1;
      notes.push('Risk-off → NZD-');
    }
  }

  if (ccy === 'XAU') {
    if (mkt.UST10Y <= -0.05) {
      s += 2;
      notes.push('Yields↓ → Gold+');
    }
    if (mkt.UST10Y >= 0.05) {
      s -= 2;
      notes.push('Yields↑ → Gold-');
    }
    if (mkt.DXY <= -1.0) {
      s += 2;
      notes.push('DXY↓ → Gold+');
    }
    if (mkt.DXY >= 1.0) {
      s -= 2;
      notes.push('DXY↑ → Gold-');
    }
  }

  if (ccy === 'XAG') {
    if (mkt.DXY <= -1.0) {
      s += 1;
      notes.push('DXY↓ → Silver+');
    }
    if (mkt.DXY >= 1.0) {
      s -= 1;
      notes.push('DXY↑ → Silver-');
    }
    if (mkt.COPPER >= 1.0) {
      s += 1;
      notes.push('Copper↑ → Silver+ (industrial)');
    }
    if (mkt.COPPER <= -1.0) {
      s -= 1;
      notes.push('Copper↓ → Silver-');
    }
  }

  return [s, notes];
}

/**
 * Dynamic risk regime scaling for safe haven and risk currencies
 */
function getMarketWeights(markets) {
  const vix = markets.VIX || 0;
  const spx = markets.SPX || 0;
  
  // Risk-off regime: VIX > 20 OR SPX down > 3%
  const riskOff = vix > 20 || spx <= -3;
  
  if (riskOff) {
    return {
      safehaven: 3,  // Increased from 2
      risk: 2,       // Increased from 1
    };
  }
  
  return {
    safehaven: 2,
    risk: 1,
  };
}

function scoreMarketFlows(ccy, mkt, weights) {
  let s = 0;
  const notes = [];

  if (ccy === 'USD') {
    if (mkt.DXY >= 1.0) {
      s += W_MARKET;
      notes.push('DXY↑ → USD+');
    }
    if (mkt.UST10Y >= 0.05) {
      s += W_MARKET;
      notes.push('Yields↑ → USD+');
    }
  }

  if (ccy === 'JPY' || ccy === 'CHF') {
    if (mkt.SPX <= -1.0) {
      s += weights.safehaven;
      notes.push(`Risk-off → ${ccy}+${weights.safehaven > 2 ? ' (heightened)' : ''}`);
    }
    if (mkt.SPX >= 1.0) {
      s -= weights.safehaven;
      notes.push(`Risk-on → ${ccy}-`);
    }
  }

  if (ccy === 'NZD') {
    // NZD is the most risk-sensitive currency
    const riskWeight = weights.risk;
    if (mkt.SPX >= 1.0) {
      s += riskWeight;
      if (riskWeight > 1) notes.push('Risk-on → NZD+ (amplified)');
    }
    if (mkt.SPX <= -1.0) {
      s -= riskWeight;
      if (riskWeight > 1) notes.push('Risk-off → NZD- (amplified)');
    }
  }

  return [s, notes];
}

/**
 * Interest rate differential component
 */
function scoreRateDifferential(ccy) {
  const baseRate = CENTRAL_BANK_RATES[ccy];
  if (!baseRate) return [0, []];
  
  // Calculate carry advantage vs average G8 rate
  const avgRate = Object.values(CENTRAL_BANK_RATES).reduce((a, b) => a + b, 0) / Object.keys(CENTRAL_BANK_RATES).length;
  const rateDiff = baseRate - avgRate;
  
  // Cap at ±3, normalize by 1% differential
  const score = Math.max(-W_RATE_DIFF, Math.min(W_RATE_DIFF, rateDiff / 1.0));
  const notes = [];
  
  if (Math.abs(score) >= 1) {
    notes.push(`Rate ${rateDiff > 0 ? 'advantage' : 'disadvantage'}: ${rateDiff > 0 ? '+' : ''}${Math.round(rateDiff * 100)}bps`);
  }
  
  return [Math.round(score * 100) / 100, notes];
}

function biasLabel(score) {
  if (score >= 7) return 'Fundamentally Strong';
  if (score <= -7) return 'Fundamentally Weak';
  return 'Neutral';
}

function indexBiasLabel(score) {
  if (score >= 3) return 'Fundamentally Strong';
  if (score <= -3) return 'Fundamentally Weak';
  return 'Neutral';
}

function scoreIndices(perCcy, markets) {
  const out = [];
  const spx = markets.SPX || 0;
  const vix = markets.VIX || 0;
  const ust = markets.UST10Y || 0;
  const wti = markets.WTI || 0;
  const copper = markets.COPPER || 0;
  const gold = markets.GOLD || 0;

  for (const [code, ccy] of INDICES) {
    let s = 0;
    const notes = [];

    // Risk sentiment (apply differently by region)
    const isUS = ['US500', 'US100', 'US30'].includes(code);
    const isEU = ['EU50', 'GER40', 'FRA40'].includes(code);
    const isAsia = ['JP225', 'HK50', 'AUS200'].includes(code);
    
    if (spx >= 1.0) {
      s += isUS ? 3 : 2; // US indices more correlated to SPX
      notes.push('Risk-on (SPX↑)');
    }
    if (spx <= -1.0) {
      s -= isUS ? 3 : 2;
      notes.push('Risk-off (SPX↓)');
    }
    if (vix <= -10) {
      s += 1;
      notes.push('Vol↓');
    }
    if (vix >= 10) {
      s -= 1;
      notes.push('Vol↑');
    }

    // Yields (US indices more sensitive)
    if (ust >= 0.05) {
      s -= isUS ? 3 : 1;
      notes.push(isUS ? 'Yields↑ major headwind' : 'Yields↑ headwind');
    }
    if (ust <= -0.05) {
      s += isUS ? 3 : 1;
      notes.push(isUS ? 'Yields↓ major tailwind' : 'Yields↓ tailwind');
    }

    // Home-currency impact (amplified)
    const ccyScore = perCcy[ccy]?.total_score || 0;
    if (ccyScore >= 5) {
      s -= 2;
      notes.push(`${ccy} strong (export headwind)`);
    }
    if (ccyScore <= -5) {
      s += 2;
      notes.push(`${ccy} weak (export tailwind)`);
    }
    
    // European-specific factors
    if (isEU && perCcy['EUR']) {
      const eurScore = perCcy['EUR'].total_score || 0;
      if (eurScore >= 3) {
        s -= 1;
        notes.push('EUR strength drag');
      }
      if (eurScore <= -3) {
        s += 1;
        notes.push('EUR weakness boost');
      }
    }
    
    // Asian risk-off sensitivity
    if (isAsia && spx <= -1.0) {
      s -= 1;
      notes.push('Asia risk-off hit');
    }

    // Commodity tilt
    if (code === 'UK100') {
      if (wti >= 1.0) {
        s += 1;
        notes.push('Oil↑ energy boost');
      }
      if (wti <= -1.0) {
        s -= 1;
        notes.push('Oil↓ drag');
      }
    }
    if (code === 'AUS200') {
      if (copper >= 1.0) {
        s += 1;
        notes.push('Copper↑ materials boost');
      }
      if (copper <= -1.0) {
        s -= 1;
        notes.push('Copper↓ drag');
      }
      if (gold >= 1.0) {
        s += 1;
        notes.push('Gold↑ miners help');
      }
      if (gold <= -1.0) {
        s -= 1;
        notes.push('Gold↓ drag');
      }
    }

    const label = indexBiasLabel(s);
    const mag = Math.min(Math.abs(s), 6);
    const confidence = s !== 0 ? Math.floor(50 + (mag / 6) * 50) : 50;
    const summary = notes.slice(0, 3).join('; ') || 'Real-time macro blend';

    out.push({
      instrument: code,
      score: s,
      bias_text: label,
      summary: summary.substring(0, 220),
      confidence,
      updated_at: new Date().toISOString(),
    });
  }

  return out;
}

/**
 * Get previous currency scores for EWMA smoothing
 */
async function getPreviousScores(supabase) {
  try {
    const { data, error } = await supabase
      .from('currency_scores')
      .select('currency, total_score')
      .order('window_end', { ascending: false })
      .limit(10); // Get last 10 to handle multiple currencies

    if (error) throw error;

    const scores = {};
    for (const row of data || []) {
      if (!scores[row.currency]) {
        scores[row.currency] = row.total_score || 0;
      }
    }
    return scores;
  } catch {
    return {};
  }
}

/**
 * Apply EWMA smoothing to prevent whipsaws
 */
function applyEWMASmoothing(newScore, prevScore) {
  if (prevScore === undefined || prevScore === null) {
    return newScore;
  }
  
  // EWMA formula: score_final = (1 - alpha) * prev + alpha * new
  const smoothed = (1 - EWMA_ALPHA) * prevScore + EWMA_ALPHA * newScore;
  
  // Final clamp to ±12 (soft cap, ±15 absolute)
  return Math.max(-12, Math.min(12, smoothed));
}

export async function runHourlyUpdate(supabaseUrl, supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const now = new Date();
  const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  console.log('[CRON] Running Hourly Bias Update (Institutional v2.0)...');
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  console.log(`[${timestamp}] Updating Market Drivers...`);

  const mkt = await fetchMarkets();
  
  // Determine risk regime
  const riskOff = mkt.VIX > 20 || mkt.SPX <= -3;
  console.log(`  ✅ Risk Regime: ${riskOff ? 'RISK-OFF (VIX>20 or SPX<-3%)' : 'Normal'}`);
  console.log(`  ✅ VIX: ${mkt.VIX}% | SPX 7d: ${mkt.SPX}%`);

  const marketWeights = getMarketWeights(mkt);
  const prevScores = await getPreviousScores(supabase);

  const perCcy = {};

  for (const ccy of CURRENCIES) {
    const [cbs, cbnotes] = scoreCBTone(CENTRAL_BANK_TONE[ccy] || '');
    const [cos, conotes] = scoreCommodities(ccy, mkt);
    const [ms, mnotes] = scoreMarketFlows(ccy, mkt, marketWeights);
    const [rds, rdnotes] = scoreRateDifferential(ccy);

    const rawTotal = cbs + cos + ms + rds;

    perCcy[ccy] = {
      window_start: windowStart.toISOString(),
      window_end: now.toISOString(),
      currency: ccy,
      data_score: 0,
      cb_tone_score: cbs,
      commodity_score: cos,
      sentiment_score: 0,
      market_score: ms,
      rate_diff_score: rds,
      total_score: rawTotal,
      notes: [...cbnotes, ...conotes, ...mnotes, ...rdnotes],
    };
  }

  // Merge economic scores (z-score normalized + time decayed from forex-factory.js)
  const economicScores = await getEconomicScores(supabaseUrl, supabaseKey);
  
  for (const [currency, ecoScore] of Object.entries(economicScores)) {
    if (perCcy[currency]) {
      // Economic scores are already z-score normalized and time-decayed
      // Cap at ±7 for balance with other components
      const capped = Math.max(-W_ECONOMIC, Math.min(W_ECONOMIC, ecoScore));
      
      perCcy[currency].total_score += capped;
      perCcy[currency].data_score = capped;
      if (Math.abs(capped) >= 0.5) {
        perCcy[currency].notes.push(`Econ data: ${capped >= 0 ? '+' : ''}${Math.round(capped * 10) / 10}`);
      }
    }
  }

  // Apply EWMA smoothing to total scores
  for (const ccy of CURRENCIES) {
    if (perCcy[ccy]) {
      const rawScore = perCcy[ccy].total_score;
      const prevScore = prevScores[ccy];
      const smoothed = applyEWMASmoothing(rawScore, prevScore);
      
      perCcy[ccy].total_score = Math.round(smoothed * 100) / 100;
      
      // Add smoothing note if significant change was dampened
      if (prevScore !== undefined && Math.abs(rawScore - smoothed) > 1) {
        perCcy[ccy].notes.push(`Smoothed from ${Math.round(rawScore * 10) / 10}`);
      }
    }
  }

  // Insert currency scores
  const currencyRows = Object.values(perCcy).map((r) => ({
    window_start: r.window_start,
    window_end: r.window_end,
    currency: r.currency,
    data_score: r.data_score,
    cb_tone_score: r.cb_tone_score,
    commodity_score: r.commodity_score,
    sentiment_score: r.sentiment_score,
    market_score: r.market_score,
    total_score: r.total_score,
    details: { notes: r.notes },
  }));

  await supabase.from('currency_scores').insert(currencyRows);

  // Build FX pair biases
  const pairRows = [];
  for (const [base, quote] of PAIRS) {
    const b = perCcy[base].total_score;
    const q = perCcy[quote].total_score;
    const tb = q - b;
    const label = biasLabel(tb);

    const qnotes = perCcy[quote].notes.slice(0, 2);
    const bnotes = perCcy[base].notes.slice(0, 1);
    const summary = [...qnotes, ...bnotes].join('; ') || 'Real-time macro blend';

    const mag = Math.min(Math.abs(tb), 12);
    const confidence = tb !== 0 ? Math.floor(50 + (mag / 12) * 50) : 50;

    pairRows.push({
      pair: `${base}/${quote}`,
      base_currency: base,
      quote_currency: quote,
      base_score: b,
      quote_score: q,
      total_bias: tb,
      bias_text: label,
      summary: summary.substring(0, 220),
      confidence,
      updated_at: new Date().toISOString(),
    });
  }

  for (const row of pairRows) {
    await supabase.from('fundamental_bias').upsert(row, { onConflict: 'pair' });
  }

  // Build index biases
  const indexRows = scoreIndices(perCcy, mkt);
  for (const row of indexRows) {
    await supabase.from('index_bias').upsert(row, { onConflict: 'instrument' });
  }

  console.log(`[${timestamp}] ✅ Updated: 10 currencies, 38 pairs, 10 indices (Institutional v2.0)`);
  console.log(`[${timestamp}] 📊 Currency Score Range: ${Math.min(...Object.values(perCcy).map(c => c.total_score))} to ${Math.max(...Object.values(perCcy).map(c => c.total_score))}`);
}
