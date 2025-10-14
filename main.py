import os, datetime as dt, requests
from dateutil.relativedelta import relativedelta
from supabase import create_client
from fetch_fundamentals_free import combine_fundamental_scores
from ff_integration import get_economic_scores
import yfinance as yf

# ----------------- CONFIG -----------------
# Full universe: 8 fiat currencies + 2 precious metals
CURRENCIES = [
    "USD","EUR","GBP","JPY","CAD","AUD","NZD","CHF",
    "XAU","XAG"  # Gold and Silver
]

# 38 FX pairs total: majors + crosses + metals
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
    ("XAU","USD"),  # Gold
    ("XAG","USD"),  # Silver
]

# Major global indices to score
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

# Central-bank tone: update weekly if you don't parse headlines yet.
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
W_DATA = {"low":1, "medium":2, "high":3}
W_CB_TONE = 3
W_COMMODITY = 2
W_MARKET = 2

# Env
SB_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SB_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TE_KEY = os.getenv("TRADING_ECONOMICS_API_KEY")
POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")

if not SB_URL or not SB_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

sb = create_client(SB_URL, SB_KEY)

# ----------------- TIME WINDOW -----------------
def week_window():
    end = dt.datetime.utcnow().replace(hour=0,minute=0,second=0,microsecond=0)
    start = end - relativedelta(days=7)
    return start, end

# ----------------- PROVIDERS -----------------
def fetch_tradingeconomics_calendar():
    """Return dict[currency] -> list of {event, actual, forecast, importance} for last 7d."""
    start, end = week_window()
    out = {c: [] for c in CURRENCIES}
    if not TE_KEY:
        return out
    try:
        url = ( "https://api.tradingeconomics.com/calendar"
                f"?d1={start.date()}&d2={end.date()}&c=all&format=json&token={TE_KEY}" )
        r = requests.get(url, timeout=20); r.raise_for_status()
        rows = r.json()
        for row in rows:
            ccy = row.get("Currency")
            if ccy in out:
                actual = row.get("Actual")
                forecast = row.get("Forecast")
                imp = (row.get("Importance") or "").lower()  # low/medium/high
                ev = row.get("Event")
                out[ccy].append({"event": ev, "actual": actual, "forecast": forecast, "importance": imp})
    except Exception:
        pass
    return out

def get_polygon_price(ticker, days=7):
    """
    Fetch daily closing prices using Polygon.io
    Returns (latest_close, oldest_close) or None if unavailable
    """
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
    """
    Fetch daily closing prices using Yahoo Finance
    Returns (latest_close, oldest_close) or None if unavailable
    """
    try:
        start_date = dt.datetime.utcnow() - dt.timedelta(days=days)
        end_date = dt.datetime.utcnow()
        df = yf.download(ticker, start=start_date.date(), end=end_date.date(), progress=False, interval="1d", auto_adjust=True)
        if df is not None and not df.empty and len(df) >= 2:
            # With auto_adjust=True, use "Close" column
            p0 = float(df["Close"].iloc[0])
            p1 = float(df["Close"].iloc[-1])
            return p1, p0
    except:
        pass
    return None

def get_percent_change_hybrid(polygon_ticker, yahoo_ticker):
    """
    Try Polygon first, fallback to Yahoo Finance
    Returns (pct_change, source_used)
    """
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
    """
    Hybrid market data fetcher: tries Polygon.io first, falls back to Yahoo Finance
    Ensures all 7 critical metrics are populated
    """
    print("\n📊 Fetching market data (Polygon → Yahoo fallback)...")
    
    # Ticker mappings: {key: (polygon_ticker, yahoo_ticker)}
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
        pct_change, source = get_percent_change_hybrid(polygon_ticker, yahoo_ticker)
        out[key] = pct_change
        if pct_change != 0:
            print(f"  ✅ {key}: {pct_change:+.2f}% ({source})")
        else:
            print(f"  ⚠️ {key}: No data from either provider")
    
    return out

# ----------------- SCORING -----------------
def score_economic_data(events):
    """Actual vs Forecast, weighted by importance."""
    if not events: return 0, []
    s, notes = 0, []
    for ev in events:
        a, f = ev.get("actual"), ev.get("forecast")
        imp = ev.get("importance") or "low"
        if a is None or f is None: continue
        try:
            aval = float(str(a).replace("%","").replace(",",""))
            fval = float(str(f).replace("%","").replace(",",""))
        except Exception:
            continue
        delta = 1 if aval > fval else (-1 if aval < fval else 0)
        w = W_DATA.get(imp, 1)
        s += delta * w
        if delta != 0:
            notes.append(f"{ev['event']} {'beat' if delta>0 else 'miss'} ({imp})")
    return s, notes

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
    if ccy == "XAU":  # Gold
        if mkt.get("UST10Y", 0) <= -0.05:
            s += 2; notes.append("Yields↓ → Gold+")
        if mkt.get("UST10Y", 0) >= 0.05:
            s -= 2; notes.append("Yields↑ → Gold-")
        if mkt.get("DXY", 0) <= -1.0:
            s += 2; notes.append("DXY↓ → Gold+")
        if mkt.get("DXY", 0) >= 1.0:
            s -= 2; notes.append("DXY↑ → Gold-")

    if ccy == "XAG":  # Silver
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
    """
    Generates bias for global stock indices using risk sentiment, yields,
    and home-currency influence.
    """
    out = []
    spx = markets.get("SPX", 0.0)
    vix = markets.get("VIX", 0.0)
    ust = markets.get("UST10Y", 0.0)
    wti = markets.get("WTI", 0.0)
    copper = markets.get("COPPER", 0.0)
    gold = markets.get("GOLD", 0.0)

    for code, ccy, _ in INDICES:
        s, notes = 0, []

        # 1) Risk-on/off
        if spx >= 1.0: s += 2; notes.append("Risk-on (SPX↑)")
        if spx <= -1.0: s -= 2; notes.append("Risk-off (SPX↓)")
        if vix <= -10: s += 1; notes.append("Vol↓")
        if vix >= 10:  s -= 1; notes.append("Vol↑")

        # 2) Yields
        if ust >= 0.05: s -= 2; notes.append("Yields↑ headwind")
        if ust <= -0.05: s += 2; notes.append("Yields↓ tailwind")

        # 3) Home-currency impact
        ccy_score = per_ccy.get(ccy,{}).get("total_score",0)
        if ccy_score >= 5:  s -= 1; notes.append(f"{ccy} strong (export headwind)")
        if ccy_score <= -5: s += 1; notes.append(f"{ccy} weak (export tailwind)")

        # 4) Commodity tilt for FTSE & ASX
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
        summary = "; ".join(notes[:3]) or "Weekly macro blend"

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

# ----------------- ORCHESTRATION -----------------
def one_line_reason(base, quote, per_ccy):
    qnotes = (per_ccy[quote]["notes"])[:2]
    bnotes = (per_ccy[base]["notes"])[:1]
    reason = "; ".join(qnotes + bnotes) or "Weekly macro blend"
    return reason[:220]

def run():
    w_start, w_end = week_window()

    cal = fetch_tradingeconomics_calendar()
    mkt = fetch_markets()
    
    # Fetch free fundamental data (EconDB + ForexFactory)
    print("\n🔄 Fetching free fundamental data sources...")
    macro_scores = combine_fundamental_scores()

    per_ccy = {}
    for ccy in CURRENCIES:
        ds, dnotes = score_economic_data(cal.get(ccy, []))
        cbs, cbnotes = score_cb_tone(CENTRAL_BANK_TONE.get(ccy))
        cos, conotes = score_commodities(ccy, mkt)
        ms, mnotes = score_market_flows(ccy, mkt)
        
        # Add macro scores from EconDB + ForexFactory
        macro_score = macro_scores.get(ccy, 0)
        macro_notes = [f"Macro data: {macro_score:+d}"] if macro_score != 0 else []
        
        total = ds + cbs + cos + ms + macro_score

        per_ccy[ccy] = {
            "window_start": w_start.isoformat(),
            "window_end":   w_end.isoformat(),
            "currency": ccy,
            "data_score": ds,
            "cb_tone_score": cbs,
            "commodity_score": cos,
            "sentiment_score": 0,
            "market_score": ms,
            "total_score": total,
            "notes": dnotes + cbnotes + conotes + mnotes + macro_notes
        }

    # Merge Forex Factory economic scores (from event-driven feed)
    ff_economic_scores = get_economic_scores()
    for currency, eco_score in ff_economic_scores.items():
        if currency in per_ccy:
            per_ccy[currency]["total_score"] += eco_score
            per_ccy[currency]["data_score"] += eco_score
            if eco_score != 0:
                per_ccy[currency]["notes"].append(f"FF economic events: {eco_score:+d}")

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

    # Score and store indices
    index_rows = score_indices(per_ccy, mkt)
    upsert_index_bias(index_rows)

if __name__ == "__main__":
    run()
