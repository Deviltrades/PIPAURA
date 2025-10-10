#!/usr/bin/env python3
"""
Hourly/30-min bias engine refresh
- Uses hybrid Polygon → Yahoo fallback
- Updates 10 currencies, 38 FX pairs, 10 indices
- Upserts to Supabase every cycle
"""
import os, datetime as dt, requests
from dateutil.relativedelta import relativedelta
from supabase import create_client
import yfinance as yf
from ff_integration import get_economic_scores
from update_market_drivers import update_drivers

# ----------------- CONFIG -----------------
CURRENCIES = [
    "USD","EUR","GBP","JPY","CAD","AUD","NZD","CHF",
    "XAU","XAG"  # Gold and Silver
]

PAIRS = [
    # Majors
    ("EUR","USD"), ("GBP","USD"), ("USD","JPY"), ("USD","CHF"),
    ("USD","CAD"), ("AUD","USD"), ("NZD","USD"),
    # EUR crosses
    ("EUR","GBP"), ("EUR","JPY"), ("EUR","CHF"),
    ("EUR","AUD"), ("EUR","CAD"), ("EUR","NZD"),
    # GBP crosses
    ("GBP","JPY"), ("GBP","CHF"), ("GBP","AUD"),
    ("GBP","CAD"), ("GBP","NZD"),
    # AUD crosses
    ("AUD","JPY"), ("AUD","CHF"), ("AUD","NZD"), ("AUD","CAD"),
    # NZD crosses
    ("NZD","JPY"), ("NZD","CHF"), ("NZD","CAD"),
    # CAD & CHF crosses
    ("CAD","JPY"), ("CAD","CHF"), ("CHF","JPY"),
    # Metals
    ("XAU","USD"), ("XAG","USD"),
]

INDICES = [
    ("US500","USD","S&P 500"),
    ("US100","USD","Nasdaq 100"),
    ("US30","USD","Dow Jones"),
    ("UK100","GBP","FTSE 100"),
    ("GER40","EUR","DAX 40"),
    ("FRA40","EUR","CAC 40"),
    ("EU50","EUR","EuroStoxx 50"),
    ("JP225","JPY","Nikkei 225"),
    ("HK50","HKD","Hang Seng"),
    ("AUS200","AUD","ASX 200"),
]

# Central Bank tone (update manually as needed)
CENTRAL_BANK_TONE = {
    "USD": "hawkish",
    "EUR": "neutral",
    "GBP": "neutral",
    "JPY": "dovish",
    "CAD": "dovish",
    "AUD": "neutral",
    "NZD": "neutral",
    "CHF": "neutral",
}

# Weights
W_CB_TONE = 3
W_COMMODITY = 2
W_MARKET = 2

# Env
SB_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SB_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")

sb = create_client(SB_URL, SB_KEY)

# ----------------- TIME WINDOW -----------------
def recent_window():
    """Use last 7 days for real-time context"""
    end = dt.datetime.utcnow().replace(hour=0,minute=0,second=0,microsecond=0)
    start = end - relativedelta(days=7)
    return start, end

# ----------------- HYBRID PROVIDERS -----------------
def get_polygon_price(ticker, days=7):
    if not POLYGON_API_KEY:
        return None
    
    end_date = dt.datetime.utcnow()
    start_date = end_date - dt.timedelta(days=days)
    url = (
        f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/"
        f"{start_date.date()}/{end_date.date()}?adjusted=true&sort=asc&apiKey={POLYGON_API_KEY}"
    )

    try:
        r = requests.get(url, timeout=10)
        data = r.json()
        if "results" in data and data["results"] and len(data["results"]) >= 2:
            closes = [bar["c"] for bar in data["results"]]
            return closes[-1], closes[0]
    except:
        pass
    return None

def get_yahoo_price(ticker, days=7):
    try:
        start_date = dt.datetime.utcnow() - dt.timedelta(days=days)
        end_date = dt.datetime.utcnow()
        df = yf.download(ticker, start=start_date.date(), end=end_date.date(), progress=False, interval="1d", auto_adjust=True)
        if df is not None and not df.empty and len(df) >= 2:
            p0 = float(df["Close"].iloc[0])
            p1 = float(df["Close"].iloc[-1])
            return p1, p0
    except:
        pass
    return None

def get_percent_change_hybrid(polygon_ticker, yahoo_ticker):
    # Try Polygon first
    prices = get_polygon_price(polygon_ticker)
    if prices:
        latest, oldest = prices
        pct = round(((latest - oldest) / oldest) * 100, 2)
        return pct, "Polygon"
    
    # Fallback to Yahoo Finance
    prices = get_yahoo_price(yahoo_ticker)
    if prices:
        latest, oldest = prices
        pct = round(((latest - oldest) / oldest) * 100, 2)
        return pct, "Yahoo"
    
    return 0.0, "None"

def fetch_markets():
    """Hybrid market data: Polygon → Yahoo fallback"""
    ticker_map = {
        "DXY": ("I:DXY", "DX-Y.NYB"),
        "WTI": ("C:CLUSD", "CL=F"),
        "GOLD": ("C:XAUUSD", "GC=F"),
        "COPPER": ("C:XCUUSD", "HG=F"),
        "SPX": ("I:SPX", "^GSPC"),
        "UST10Y": ("I:US10Y", "^TNX"),
        "VIX": ("I:VIX", "^VIX"),
    }
    
    out = {}
    for key, (polygon_ticker, yahoo_ticker) in ticker_map.items():
        pct_change, _ = get_percent_change_hybrid(polygon_ticker, yahoo_ticker)
        out[key] = pct_change
    
    return out

# ----------------- SCORING -----------------
def score_cb_tone(tone):
    if tone == "hawkish": return W_CB_TONE, ["CB: hawkish"]
    if tone == "dovish":  return -W_CB_TONE, ["CB: dovish"]
    return 0, []

def score_commodities(ccy, mkt):
    s, notes = 0, []
    if ccy == "CAD":
        if mkt.get("WTI",0) >= 1.0:  s += W_COMMODITY; notes.append("Oil↑ → CAD+")
        if mkt.get("WTI",0) <= -1.0: s -= W_COMMODITY; notes.append("Oil↓ → CAD-")
    if ccy == "AUD":
        if mkt.get("COPPER",0) >= 1.0: s += 1; notes.append("Copper↑ → AUD+")
        if mkt.get("COPPER",0) <= -1.0: s -= 1; notes.append("Copper↓ → AUD-")
        if mkt.get("GOLD",0)   >= 1.0: s += 1; notes.append("Gold↑ → AUD+")
        if mkt.get("GOLD",0)   <= -1.0: s -= 1; notes.append("Gold↓ → AUD-")
    if ccy == "NZD":
        if mkt.get("SPX",0) >= 1.0:  s += 1; notes.append("Risk-on → NZD+")
        if mkt.get("SPX",0) <= -1.0: s -= 1; notes.append("Risk-off → NZD-")
    
    # Precious metals
    if ccy == "XAU":
        if mkt.get("UST10Y", 0) <= -0.05:
            s += 2; notes.append("Yields↓ → Gold+")
        if mkt.get("UST10Y", 0) >= 0.05:
            s -= 2; notes.append("Yields↑ → Gold-")
        if mkt.get("DXY", 0) <= -1.0:
            s += 2; notes.append("DXY↓ → Gold+")
        if mkt.get("DXY", 0) >= 1.0:
            s -= 2; notes.append("DXY↑ → Gold-")

    if ccy == "XAG":
        if mkt.get("DXY", 0) <= -1.0:
            s += 1; notes.append("DXY↓ → Silver+")
        if mkt.get("DXY", 0) >= 1.0:
            s -= 1; notes.append("DXY↑ → Silver-")
        if mkt.get("COPPER", 0) >= 1.0:
            s += 1; notes.append("Copper↑ → Silver+ (industrial)")
        if mkt.get("COPPER", 0) <= -1.0:
            s -= 1; notes.append("Copper↓ → Silver-")
    
    return s, notes

def score_market_flows(ccy, mkt):
    s, notes = 0, []
    if ccy == "USD":
        if mkt.get("DXY",0) >= 1.0:    s += W_MARKET; notes.append("DXY↑ → USD+")
        if mkt.get("UST10Y",0) >= 0.05: s += W_MARKET; notes.append("Yields↑ → USD+")
    if ccy in ("JPY","CHF"):
        if mkt.get("SPX",0) <= -1.0: s += W_MARKET; notes.append("Risk-off → JPY/CHF+")
        if mkt.get("SPX",0) >= 1.0:  s -= W_MARKET; notes.append("Risk-on → JPY/CHF-")
    return s, notes

def bias_label(score):
    if score >= 7:  return "Fundamentally Strong"
    if score <= -7: return "Fundamentally Weak"
    return "Neutral"

def index_bias_label(score):
    if score >= 3:  return "Fundamentally Strong"
    if score <= -3: return "Fundamentally Weak"
    return "Neutral"

def score_indices(per_ccy, markets):
    out = []
    spx = markets.get("SPX", 0.0)
    vix = markets.get("VIX", 0.0)
    ust = markets.get("UST10Y", 0.0)
    wti = markets.get("WTI", 0.0)
    copper = markets.get("COPPER", 0.0)
    gold = markets.get("GOLD", 0.0)

    for code, ccy, _ in INDICES:
        s, notes = 0, []

        # Risk sentiment
        if spx >= 1.0: s += 2; notes.append("Risk-on (SPX↑)")
        if spx <= -1.0: s -= 2; notes.append("Risk-off (SPX↓)")
        if vix <= -10: s += 1; notes.append("Vol↓")
        if vix >= 10:  s -= 1; notes.append("Vol↑")

        # Yields
        if ust >= 0.05: s -= 2; notes.append("Yields↑ headwind")
        if ust <= -0.05: s += 2; notes.append("Yields↓ tailwind")

        # Home-currency impact
        ccy_score = per_ccy.get(ccy,{}).get("total_score",0)
        if ccy_score >= 5:  s -= 1; notes.append(f"{ccy} strong (export headwind)")
        if ccy_score <= -5: s += 1; notes.append(f"{ccy} weak (export tailwind)")

        # Commodity tilt
        if code == "UK100":
            if wti >= 1.0: s += 1; notes.append("Oil↑ energy boost")
            if wti <= -1.0: s -= 1; notes.append("Oil↓ drag")
        if code == "AUS200":
            if copper >= 1.0: s += 1; notes.append("Copper↑ materials boost")
            if copper <= -1.0: s -= 1; notes.append("Copper↓ drag")
            if gold >= 1.0:   s += 1; notes.append("Gold↑ miners help")
            if gold <= -1.0:  s -= 1; notes.append("Gold↓ drag")

        label = index_bias_label(s)
        mag = min(abs(s), 6)
        confidence = int(50 + (mag/6)*50) if s != 0 else 50
        summary = "; ".join(notes[:3]) or "Real-time macro blend"

        out.append({
            "instrument": code,
            "score": s,
            "bias_text": label,
            "summary": summary[:220],
            "confidence": confidence,
            "updated_at": dt.datetime.utcnow().isoformat()
        })
    return out

# ----------------- DB HELPERS -----------------
def insert_currency_scores(rows):
    if rows:
        sb.table("currency_scores").insert(rows).execute()

def upsert_pair_bias(rows):
    for row in rows:
        sb.table("fundamental_bias").upsert(row, on_conflict="pair").execute()

def upsert_index_bias(rows):
    for row in rows:
        sb.table("index_bias").upsert(row, on_conflict="instrument").execute()

# ----------------- MAIN RUN -----------------
def one_line_reason(base, quote, per_ccy):
    qnotes = (per_ccy[quote]["notes"])[:2]
    bnotes = (per_ccy[base]["notes"])[:1]
    reason = "; ".join(qnotes + bnotes) or "Real-time macro blend"
    return reason[:220]

def run():
    w_start, w_end = recent_window()
    mkt = fetch_markets()

    per_ccy = {}
    for ccy in CURRENCIES:
        cbs, cbnotes = score_cb_tone(CENTRAL_BANK_TONE.get(ccy))
        cos, conotes = score_commodities(ccy, mkt)
        ms, mnotes = score_market_flows(ccy, mkt)
        
        total = cbs + cos + ms

        per_ccy[ccy] = {
            "window_start": w_start.isoformat(),
            "window_end":   w_end.isoformat(),
            "currency": ccy,
            "data_score": 0,
            "cb_tone_score": cbs,
            "commodity_score": cos,
            "sentiment_score": 0,
            "market_score": ms,
            "total_score": total,
            "notes": cbnotes + conotes + mnotes
        }

    # Merge Forex Factory economic scores
    economic_scores = get_economic_scores()
    for currency, eco_score in economic_scores.items():
        if currency in per_ccy:
            per_ccy[currency]["total_score"] += eco_score
            per_ccy[currency]["data_score"] = eco_score
            if eco_score != 0:
                per_ccy[currency]["notes"].append(f"Economic data: {eco_score:+d}")

    # Insert currency scores
    insert_currency_scores([{
        "window_start": r["window_start"],
        "window_end":   r["window_end"],
        "currency":     r["currency"],
        "data_score":   r["data_score"],
        "cb_tone_score":r["cb_tone_score"],
        "commodity_score": r["commodity_score"],
        "sentiment_score": r["sentiment_score"],
        "market_score": r["market_score"],
        "total_score":  r["total_score"],
        "details": {"notes": r["notes"]}
    } for r in per_ccy.values()])

    # Build FX pair biases
    pair_rows = []
    for base, quote in PAIRS:
        b = per_ccy[base]["total_score"]
        q = per_ccy[quote]["total_score"]
        tb = q - b
        label = bias_label(tb)
        summary = one_line_reason(base, quote, per_ccy)
        mag = min(abs(tb), 12)
        confidence = int(50 + (mag/12)*50) if tb != 0 else 50

        pair_rows.append({
            "pair": f"{base}/{quote}",
            "base_currency": base,
            "quote_currency": quote,
            "base_score": b,
            "quote_score": q,
            "total_bias": tb,
            "bias_text": label,
            "summary": summary,
            "confidence": confidence,
            "updated_at": dt.datetime.utcnow().isoformat()
        })

    upsert_pair_bias(pair_rows)

    # Build index biases
    index_rows = score_indices(per_ccy, mkt)
    upsert_index_bias(index_rows)

    # Update market drivers analysis
    update_drivers()

    # One-line completion log
    timestamp = dt.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{timestamp}] ✅ Updated: 10 currencies, 38 pairs, 10 indices")

if __name__ == "__main__":
    run()
