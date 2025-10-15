# FX Fundamental Bias Scoring System

## Overview
This algorithm calculates fundamental bias scores for 38 FX pairs by scoring individual currencies across 4 factors, then combining them. Updated every 30 minutes.

---

## 1. INDIVIDUAL CURRENCY SCORING

Each currency (USD, EUR, GBP, JPY, CAD, AUD, NZD, CHF) gets a score from **4 components**:

### Component 1: Central Bank Tone (Weight: ±3)
**Manual settings based on latest CB policy:**
```
USD: hawkish  → +3
EUR: neutral  → 0
GBP: neutral  → 0
JPY: dovish   → -3
CAD: dovish   → -3
AUD: neutral  → 0
NZD: neutral  → 0
CHF: neutral  → 0
```
**Logic:** Hawkish = currency positive, Dovish = currency negative

---

### Component 2: Commodity Correlations (Weight: ±2)
**CAD (Oil):**
- WTI ≥ +1.0% → +2 (Oil↑ → CAD+)
- WTI ≤ -1.0% → -2 (Oil↓ → CAD-)

**AUD (Copper + Gold):**
- Copper ≥ +1.0% → +1 (Copper↑ → AUD+)
- Copper ≤ -1.0% → -1 (Copper↓ → AUD-)
- Gold ≥ +1.0% → +1 (Gold↑ → AUD+)
- Gold ≤ -1.0% → -1 (Gold↓ → AUD-)

**NZD (Risk Sentiment):**
- SPX ≥ +1.0% → +1 (Risk-on → NZD+)
- SPX ≤ -1.0% → -1 (Risk-off → NZD-)

---

### Component 3: Market Flows (Weight: ±2)
**USD (Dollar Index + Yields):**
- DXY ≥ +1.0% → +2 (DXY↑ → USD+)
- UST10Y ≥ +0.05% → +2 (Yields↑ → USD+)

**JPY & CHF (Safe Havens):**
- SPX ≤ -1.0% → +2 (Risk-off → JPY/CHF+)
- SPX ≥ +1.0% → -2 (Risk-on → JPY/CHF-)

---

### Component 4: Economic Data (Weight: ±10)
**From RapidAPI Economic Calendar:**
- Aggregates event scores (actual vs forecast) from forex_events table
- Normalized to ±10 range: `score = (rawScore / 30) capped at ±10`
- Example: USD gets +10 if strong NFP, CPI, GDP surprises

**Formula:**
```javascript
currencyScore = CB_Tone + Commodities + MarketFlows + EconomicData
```

**Typical Range:** -15 to +15 per currency

---

## 2. FX PAIR BIAS CALCULATION

For each pair (e.g., EUR/USD):

```javascript
baseCurrency = EUR
quoteCurrency = USD

pairBias = quoteCurrency.score - baseCurrency.score
```

**Example (Current):**
```
EUR/USD:
  EUR score: -2
  USD score: +13
  Bias = 13 - (-2) = +15 (Fundamentally Strong)
  
Interpretation: USD very strong vs EUR → Buy USD/Sell EUR
```

---

## 3. BIAS CLASSIFICATION

**Pair Bias Labels:**
- Score ≥ +7 → **Fundamentally Strong** (bullish)
- Score ≤ -7 → **Fundamentally Weak** (bearish)
- -6 to +6 → **Neutral**

**Confidence Calculation:**
```javascript
magnitude = min(abs(pairBias), 12)
confidence = pairBias !== 0 
  ? 50 + (magnitude / 12) × 50 
  : 50

// Range: 50% (neutral) to 100% (extreme bias ±12+)
```

---

## 4. DATA SOURCES

### Real-Time Market Data (Yahoo Finance)
Updated every 30 mins:
- **DXY** (US Dollar Index)
- **SPX** (S&P 500) - 7-day % change
- **VIX** (Volatility Index)
- **UST10Y** (10-Year Treasury Yield)
- **WTI** (Crude Oil)
- **COPPER** (Copper futures)
- **GOLD** (Gold futures)

### Economic Calendar (RapidAPI)
- High-impact events: NFP, CPI, GDP, Retail Sales, etc.
- Actual vs Forecast scoring
- Updated: Every 15 mins (high-impact check), Every 4 hours (full refresh)

---

## 5. EXAMPLE CALCULATION

**USD Scoring (Current Market):**
```
1. CB Tone: hawkish → +3
2. Commodities: N/A → 0
3. Market Flows: 
   - DXY neutral → 0
   - UST10Y neutral → 0
4. Economic Data: Strong surprises → +10

Total USD Score: +13
```

**JPY Scoring (Current Market):**
```
1. CB Tone: dovish → -3
2. Commodities: N/A → 0
3. Market Flows: SPX down (risk-off) → +2
4. Economic Data: Weak surprises → -1

Total JPY Score: -2
```

**USD/JPY Pair:**
```
Bias = JPY - USD = -2 - 13 = -15
Classification: Fundamentally Weak
Confidence: 100%
Summary: "CB: dovish; Risk-off → JPY/CHF+; CB: hawkish"
```

---

## 6. CURRENT WEIGHTS SUMMARY

| Component | Weight Range | Currency Coverage |
|-----------|-------------|-------------------|
| Central Bank Tone | ±3 | All 8 currencies |
| Commodities | ±2 to ±4 | CAD, AUD, NZD |
| Market Flows | ±2 to ±4 | USD, JPY, CHF |
| Economic Data | ±10 | All 8 currencies |

**Maximum Theoretical Score per Currency:** ±17 (rare)
**Typical Score Range:** -10 to +10
**Pair Bias Range:** -25 to +25 (typical -15 to +15)

---

## 7. UPDATE FREQUENCY

**Automated Cron Jobs (Vercel):**
- **Every 15 mins:** Check for high-impact event releases → instant recalc if detected
- **Every 30 mins:** Full bias update (all currencies, pairs, indices)
- **Every 4 hours:** Economic calendar refresh

**Frontend Auto-Refresh:**
- Dashboard polls database every 60 seconds
- No API calls (reads pre-calculated data from Supabase)

---

## 8. QUESTIONS FOR OPTIMIZATION

1. **Are the weights optimal?**
   - CB Tone: ±3
   - Commodities: ±2
   - Market Flows: ±2
   - Economic Data: ±10

2. **Should economic data weight be higher/lower relative to others?**

3. **Are commodity correlations accurate?**
   - CAD ↔ Oil (±2)
   - AUD ↔ Copper/Gold (±1 each)
   - NZD ↔ SPX (±1)

4. **Missing factors?**
   - Interest rate differentials?
   - Trade balance data?
   - Political risk?
   - Liquidity conditions?

5. **Is the economic score normalization correct?**
   - Currently: `(rawScore / 30)` capped at ±10
   - Raw scores from event surprises can be -300 to +300

6. **Should safe haven behavior (JPY/CHF) have higher weight than ±2?**

7. **Is the pair bias calculation correct?**
   - `bias = quote - base`
   - Positive = quote currency stronger
   - Should we add any smoothing or momentum factors?

---

## 9. CURRENT LIMITATIONS

1. **Manual CB tone updates** - Requires manual code changes
2. **Simple commodity correlations** - Binary thresholds (±1%)
3. **No cross-currency factors** - Each currency scored independently
4. **Economic score sensitivity** - Single divisor (/30) for all currencies
5. **No time decay** - All factors weighted equally regardless of age

---

**Note:** Please review this methodology and suggest optimizations for accuracy, reliability, and trading signal quality.
