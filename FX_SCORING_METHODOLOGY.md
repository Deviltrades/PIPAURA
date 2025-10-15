# FX Fundamental Bias Scoring System (Institutional-Grade v2.0)

## Overview
This algorithm calculates fundamental bias scores for 38 FX pairs using **institutional-grade quantitative methods**. Features z-score normalization, time decay, EWMA smoothing, and dynamic risk regime scaling. Updated every 30 minutes.

---

## 1. INDIVIDUAL CURRENCY SCORING

Each currency (USD, EUR, GBP, JPY, CAD, AUD, NZD, CHF) receives a score from **5 components**:

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

**NZD (Risk Sentiment - Dynamic):**
- Normal regime: SPX ±1% → ±1 weight
- Risk-off regime: SPX ±1% → ±2 weight (amplified)

---

### Component 3: Market Flows (Weight: ±2 to ±3, Dynamic)
**USD (Dollar Index + Yields):**
- DXY ≥ +1.0% → +2 (DXY↑ → USD+)
- UST10Y ≥ +0.05% → +2 (Yields↑ → USD+)

**JPY & CHF (Safe Havens - Dynamic):**
- Normal regime: SPX ±1% → ±2 weight
- Risk-off regime (VIX>20 OR SPX<-3%): SPX ±1% → ±3 weight (heightened safe haven)

---

### Component 4: Interest Rate Differential (Weight: ±3) **NEW**
**Carry trade advantage based on central bank policy rates:**

**Current Rates:**
- USD: 5.25% (Fed Funds)
- GBP: 5.25% (BoE Base)
- NZD: 5.50% (RBNZ OCR)
- CAD: 4.50% (BoC Overnight)
- AUD: 4.35% (RBA Cash)
- EUR: 4.00% (ECB Deposit)
- CHF: 1.50% (SNB Policy)
- JPY: 0.25% (BoJ Policy)

**Calculation:**
```javascript
avgRate = 3.94% (G8 average)
rateDiff = currencyRate - avgRate
rateScore = clamp(rateDiff / 1.0, -3, 3)

Example:
  NZD: (5.50 - 3.94) = +1.56% → +1.56 score (carry advantage)
  JPY: (0.25 - 3.94) = -3.69% → -3.0 score (carry disadvantage)
```

---

### Component 5: Economic Data (Weight: ±7, Z-Score Normalized) **UPGRADED**

#### 5a. Z-Score Normalization + Tanh Scaling
**Replaces raw division with statistical normalization:**

```javascript
// Old method (overshoots):
score = (actual - forecast) / forecast × impactWeight × 100

// New method (bounded ±7):
diff = actual - forecast
z = diff / sigma[eventType]  // Event-specific standard deviation
score = 7 × tanh(z / 2) × polarity × (impactWeight / 3)
```

**Event-Specific Sigma (Standard Deviations):**
- Non-Farm Payrolls: 100,000 jobs
- Unemployment Rate: 0.2%
- Core CPI: 0.2%
- GDP: 0.5%
- Retail Sales: 0.5%
- Manufacturing PMI: 1.0 points
- Trade Balance: $5B

**Event Polarity Mapping:**
- Positive indicators (higher = better): NFP, GDP, Retail Sales, PMIs (+1)
- Inverse indicators (lower = better): Unemployment Rate, Jobless Claims (-1)
- Mixed indicators: Inflation (depends on CB stance)

**Tanh Scaling Benefits:**
- Bounded output: Always ±7 (no overshooting)
- S-curve response: Small surprises → linear, large surprises → saturating
- Captures outliers without explosion

---

#### 5b. Time Decay (72-Hour Half-Life) **NEW**
**All economic events decay exponentially:**

```javascript
hoursSince = (now - eventTime) / 3600
lambda = exp(-(ln(2) × hoursSince) / 72)
finalScore = eventScore × lambda

Timeline:
  0 hours   → 100% weight (fresh event)
  72 hours  → 50% weight (half-life)
  144 hours → 25% weight
  216 hours → 12.5% weight
  1 week    → ~5% weight (negligible)
```

**Benefits:**
- Recent events dominate (NFP from yesterday > CPI from last week)
- Natural score decay prevents stale data bias
- Old events fade gracefully, not abruptly

---

### Component 6: EWMA Smoothing (α = 0.4) **NEW**
**Prevents whipsaws from volatile 30-min updates:**

```javascript
score_raw = CB_Tone + Commodities + MarketFlows + RateDiff + EconomicData
score_final = 0.6 × prev_score + 0.4 × score_raw
score_final = clamp(score_final, -12, 12)  // Soft cap
```

**Benefits:**
- 60% weight on previous score = stability
- 40% weight on new data = responsiveness
- Reduces oscillations without lag
- Smooth transitions during regime changes

---

## 2. FX PAIR BIAS CALCULATION

For each pair (e.g., EUR/USD):

```javascript
baseCurrency = EUR
quoteCurrency = USD

pairBias = quoteCurrency.score - baseCurrency.score
```

**Example (Current Market):**
```
EUR/USD:
  EUR score: -2.5 (dovish ECB, weak econ data)
  USD score: +8.2 (hawkish Fed, strong NFP, rate advantage)
  
  Bias = 8.2 - (-2.5) = +10.7
  Classification: Fundamentally Strong
  Confidence: 94%
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

## 4. DYNAMIC RISK REGIME SCALING **NEW**

**Triggers:** VIX > 20 OR SPX 7-day change < -3%

**Normal Regime:**
- JPY/CHF safe haven weight: ±2
- NZD risk weight: ±1

**Risk-Off Regime:**
- JPY/CHF safe haven weight: ±3 (50% boost)
- NZD risk weight: ±2 (100% boost)
- USD defensive bid increases
- Commodities currencies (AUD/CAD) penalized

**Real-Time Detection:**
```javascript
riskOff = VIX > 20 || SPX_7d <= -3
weights = riskOff ? { safehaven: 3, risk: 2 } : { safehaven: 2, risk: 1 }
```

---

## 5. DATA SOURCES

### Real-Time Market Data (Yahoo Finance)
Updated every 30 mins:
- **DXY** (US Dollar Index)
- **SPX** (S&P 500) - 7-day % change
- **VIX** (Volatility Index) - Risk regime trigger
- **UST10Y** (10-Year Treasury Yield)
- **WTI** (Crude Oil)
- **COPPER** (Copper futures)
- **GOLD** (Gold futures)

### Economic Calendar (Forex Factory XML)
- High-impact events: NFP, CPI, GDP, Retail Sales, etc.
- Actual vs Forecast scoring with z-score normalization
- 72-hour time decay applied
- Updated: Every 15 mins (high-impact check), Every 4 hours (full refresh)

---

## 6. CURRENT WEIGHTS SUMMARY

| Component | Weight Range | Dynamic Scaling | Currency Coverage |
|-----------|-------------|-----------------|-------------------|
| Central Bank Tone | ±3 | No | All 8 currencies |
| Commodities | ±2 to ±4 | No | CAD, AUD, NZD |
| Market Flows | ±2 to ±3 | Yes (risk regime) | USD, JPY, CHF, NZD |
| Interest Rate Differential | ±3 | No | All 8 currencies |
| Economic Data (z-score) | ±7 | No (inherently bounded) | All 8 currencies |

**Maximum Theoretical Score:** ±16 (extremely rare)
**Typical Score Range:** -8 to +8
**Soft Cap:** ±12 (EWMA enforced)
**Absolute Cap:** ±15 (hard clamp)
**Pair Bias Range:** -20 to +20 (typical -12 to +12)

---

## 7. UPDATE FREQUENCY

**Automated Cron Jobs (Vercel):**
- **Every 15 mins:** Check for high-impact event releases → instant recalc if detected
- **Every 30 mins:** Full bias update (all currencies, pairs, indices) with EWMA smoothing
- **Every 4 hours:** Economic calendar refresh

**Frontend Auto-Refresh:**
- Dashboard polls database every 60 seconds
- No API calls (reads pre-calculated data from Supabase)

---

## 8. KEY IMPROVEMENTS (v2.0)

### ✅ Solved Issues:
1. **Overshooting eliminated:** Z-score + tanh prevents +17 scores → max ±7 per component
2. **Currency balance:** All currencies now have baseline economic scores (no USD bias)
3. **Smooth transitions:** EWMA prevents 30-min whipsaws
4. **Natural decay:** Old events fade with 72-hour half-life
5. **Carry bias:** Interest rate differentials now factored (NZD/JPY advantage/disadvantage)
6. **Risk adaptation:** Weights adjust dynamically during volatility spikes

### 🎯 Expected Outcomes:
- Currency scores: ±12 soft cap (±15 absolute)
- Pair biases: Stable, realistic, responsive
- No abrupt jumps or reversals
- True macro divergence still clearly visible
- Professional-grade signal quality

---

## 9. EXAMPLE CALCULATION (v2.0)

**USD Scoring (Current Market):**
```
1. CB Tone: hawkish → +3
2. Commodities: N/A → 0
3. Market Flows: DXY neutral, yields neutral → 0
4. Rate Differential: 5.25% vs 3.94% avg → +1.31
5. Economic Data (z-score + decay):
   - NFP (3 days old): z=1.5 → 5.8 × 0.89 decay = +5.2
   - CPI (1 week old): z=0.8 → 3.4 × 0.16 decay = +0.5
   Total econ: +5.7 (capped at ±7)
6. EWMA smoothing: 0.6 × 9.5 (prev) + 0.4 × 10.0 (new) = 9.7

Total USD Score: +9.7
```

**JPY Scoring (Current Market):**
```
1. CB Tone: dovish → -3
2. Commodities: N/A → 0
3. Market Flows: Risk-off (VIX=22) → +3 (heightened)
4. Rate Differential: 0.25% vs 3.94% → -3.0 (max penalty)
5. Economic Data: Weak surprises → -2.5
6. EWMA smoothing: 0.6 × -5.0 + 0.4 × -5.5 = -5.2

Total JPY Score: -5.2
```

**USD/JPY Pair:**
```
Bias = JPY - USD = -5.2 - 9.7 = -14.9
Classification: Fundamentally Weak
Confidence: 100%
Summary: "Risk-off → JPY+ (heightened); Rate disadvantage: -369bps; CB: hawkish"

Interpretation: Despite JPY safe-haven bid, USD fundamentals overwhelm
              → Strongly favor USD (short JPY)
```

---

## 10. MAINTENANCE REQUIREMENTS

### Monthly Updates Required:
1. **Central Bank Rates** - Update after Fed, ECB, BoE, BoJ decisions
2. **Central Bank Tone** - Adjust hawkish/dovish based on meeting minutes
3. **Event Sigma Values** - Recalibrate quarterly based on actual volatility

### Quarterly Reviews:
1. **EWMA Alpha** - Adjust if scores too volatile/sluggish (0.3-0.5 range)
2. **Risk Regime Thresholds** - VIX/SPX triggers may need adjustment
3. **Weight Balance** - Validate component weights vs market behavior

---

**Note:** This institutional-grade system eliminates overshooting, provides natural decay, adapts to risk regimes, and delivers professional signal quality for trading decisions.
