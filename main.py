import os, datetime as dt, requests, yfinance as yf
from dateutil.relativedelta import relativedelta
from supabase import create_client

# ----------------- CONFIG -----------------
CURRENCIES = ["USD","EUR","GBP","JPY","CAD","AUD","NZD","CHF"]
PAIRS = [
    ("EUR","USD"), ("GBP","USD"), ("USD","JPY"), ("USD","CAD"),
    ("AUD","USD"), ("NZD","USD"), ("USD","CHF"),
    ("EUR","GBP"), ("EUR","JPY"), ("GBP","JPY"), ("AUD","CAD"),
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

def fetch_markets():
    """Weekly % changes for DXY, WTI, GOLD, COPPER, SPX, UST10Y (TNX)."""
    start, end = week_window()
    tickers = {
        "DXY": "DX-Y.NYB",
        "WTI": "CL=F",
        "GOLD": "GC=F",
        "COPPER": "HG=F",
        "SPX": "^GSPC",
        "UST10Y": "^TNX",
    }
    out = {}
    for k, t in tickers.items():
        try:
            df = yf.download(t, start=start.date(), end=end.date(), progress=False, interval="1d")
            if df is None or df.empty:
                out[k] = 0.0; continue
            p0 = float(df["Adj Close"].iloc[0]); p1 = float(df["Adj Close"].iloc[-1])
            out[k] = ((p1 - p0)/p0)*100.0
        except Exception:
            out[k] = 0.0
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

# ----------------- DB HELPERS -----------------
def insert_currency_scores(rows):
    if rows:
        sb.table("currency_scores").insert(rows).execute()

def upsert_pair_bias(rows):
    for row in rows:
        sb.table("fundamental_bias").upsert(row, on_conflict="pair").execute()

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

    per_ccy = {}
    for ccy in CURRENCIES:
        ds, dnotes = score_economic_data(cal.get(ccy, []))
        cbs, cbnotes = score_cb_tone(CENTRAL_BANK_TONE.get(ccy))
        cos, conotes = score_commodities(ccy, mkt)
        ms, mnotes = score_market_flows(ccy, mkt)
        total = ds + cbs + cos + ms

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
            "notes": dnotes + cbnotes + conotes + mnotes
        }

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

if __name__ == "__main__":
    run()
