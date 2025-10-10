#!/usr/bin/env python3
"""
Forex Factory Economic Calendar Integration
- Fetches this week's events from XML feed
- Scores events based on actual vs forecast
- Detects new high-impact releases for instant bias updates
"""
import os
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from supabase import create_client

# Config
FF_FEED_URL = "https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.xml"
SB_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SB_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

sb = create_client(SB_URL, SB_KEY)

# Currency mapping from country codes
COUNTRY_TO_CURRENCY = {
    "USD": "USD",
    "EUR": "EUR",
    "GBP": "GBP",
    "JPY": "JPY",
    "AUD": "AUD",
    "NZD": "NZD",
    "CAD": "CAD",
    "CHF": "CHF",
}

# Impact weights
IMPACT_WEIGHTS = {
    "High": 3,
    "Medium": 2,
    "Low": 1,
}

def fetch_feed(timeout=15):
    """Fetch Forex Factory XML feed with timeout"""
    try:
        response = requests.get(FF_FEED_URL, timeout=timeout)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"⚠️ FF feed timeout: {e}")
        return None

def parse_events(xml_content):
    """Parse XML and extract event data"""
    events = []
    try:
        root = ET.fromstring(xml_content)
        
        for event in root.findall(".//event"):
            country = event.find("country")
            title = event.find("title")
            impact = event.find("impact")
            actual = event.find("actual")
            forecast = event.find("forecast")
            previous = event.find("previous")
            date = event.find("date")
            
            # Extract text or use empty string
            event_data = {
                "country": country.text if country is not None else "",
                "title": title.text if title is not None else "",
                "impact": impact.text if impact is not None else "Low",
                "actual": actual.text if actual is not None else None,
                "forecast": forecast.text if forecast is not None else None,
                "previous": previous.text if previous is not None else None,
                "date": date.text if date is not None else "",
            }
            
            # Only add if we have minimum required fields
            if event_data["country"] and event_data["title"]:
                events.append(event_data)
    except Exception as e:
        print(f"⚠️ XML parse error: {e}")
        return []
    
    return events

def score_event(actual, forecast, impact_weight):
    """
    Score an economic event based on actual vs forecast
    Returns: percentage difference scaled by impact weight
    """
    if actual is None or forecast is None:
        return 0
    
    try:
        # Clean the values (remove %, K, M, B suffixes)
        actual_val = str(actual).replace("%", "").replace("K", "").replace("M", "").replace("B", "")
        forecast_val = str(forecast).replace("%", "").replace("K", "").replace("M", "").replace("B", "")
        
        actual_num = float(actual_val)
        forecast_num = float(forecast_val)
        
        # Avoid division by zero
        if forecast_num == 0:
            return 0
        
        # Calculate percentage difference
        diff = (actual_num - forecast_num) / abs(forecast_num)
        score = round(diff * impact_weight * 100, 2)
        
        return score
    except:
        return 0

def get_processed_events():
    """Get list of already processed event IDs from Supabase"""
    try:
        result = sb.table("forex_events").select("event_id").execute()
        return {row["event_id"] for row in result.data}
    except:
        return set()

def mark_event_processed(event_id, event_data, score):
    """Mark an event as processed in Supabase"""
    try:
        sb.table("forex_events").insert({
            "event_id": event_id,
            "country": event_data["country"],
            "title": event_data["title"],
            "impact": event_data["impact"],
            "actual": event_data["actual"],
            "forecast": event_data["forecast"],
            "score": score,
            "processed_at": datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        print(f"⚠️ Failed to mark event processed: {e}")

def aggregate_currency_scores(events):
    """
    Aggregate event scores by currency
    Returns: dict of {currency: total_score}
    """
    currency_scores = {}
    
    for event in events:
        # Get currency from country
        currency = COUNTRY_TO_CURRENCY.get(event["country"])
        if not currency:
            continue
        
        # Get impact weight
        impact_weight = IMPACT_WEIGHTS.get(event["impact"], 1)
        
        # Score the event
        score = score_event(event["actual"], event["forecast"], impact_weight)
        
        # Aggregate
        if currency not in currency_scores:
            currency_scores[currency] = 0
        currency_scores[currency] += score
    
    return currency_scores

def update_economic_scores(currency_scores):
    """Update economic_scores table in Supabase"""
    timestamp = datetime.utcnow().isoformat()
    
    for currency, score in currency_scores.items():
        try:
            sb.table("economic_scores").upsert({
                "currency": currency,
                "total_score": round(score),
                "last_updated": timestamp,
            }, on_conflict="currency").execute()
        except Exception as e:
            print(f"⚠️ Failed to update score for {currency}: {e}")

def run_update(high_impact_only=False):
    """
    Main update function
    - high_impact_only: If True, only process High impact events (for 15-min checks)
    """
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Fetch feed
    xml_content = fetch_feed()
    if not xml_content:
        print(f"[{timestamp}] ForexFactory update → Feed unavailable")
        return False
    
    # Parse events
    events = parse_events(xml_content)
    if not events:
        print(f"[{timestamp}] ForexFactory update → No events parsed")
        return False
    
    # Filter for high impact only if requested
    if high_impact_only:
        events = [e for e in events if e["impact"] == "High"]
    
    # Get processed events
    processed_ids = get_processed_events()
    
    # Find new events with actual values
    new_events = []
    for event in events:
        # Create unique event ID
        event_id = f"{event['country']}_{event['title']}_{event['date']}"
        
        # Check if new and has actual value
        if event_id not in processed_ids and event["actual"] is not None:
            new_events.append((event_id, event))
    
    if not new_events:
        print(f"[{timestamp}] ForexFactory update → No new releases")
        return False
    
    # Process new events
    all_events_data = []
    for event_id, event in new_events:
        impact_weight = IMPACT_WEIGHTS.get(event["impact"], 1)
        score = score_event(event["actual"], event["forecast"], impact_weight)
        
        all_events_data.append(event)
        mark_event_processed(event_id, event, score)
    
    # Aggregate and update scores
    currency_scores = aggregate_currency_scores(all_events_data)
    if currency_scores:
        update_economic_scores(currency_scores)
    
    # Count high impact
    high_impact_count = sum(1 for _, e in new_events if e["impact"] == "High")
    
    print(f"[{timestamp}] ForexFactory update → {len(new_events)} events parsed, {high_impact_count} high impact processed ✅")
    
    return high_impact_count > 0  # Return True if high impact events were processed

if __name__ == "__main__":
    import sys
    
    # Check for --high-impact flag
    high_impact_only = "--high-impact" in sys.argv
    
    # Run update
    has_high_impact = run_update(high_impact_only=high_impact_only)
    
    # Exit with code 1 if high impact events found (triggers bias recalc)
    if has_high_impact:
        sys.exit(1)
    else:
        sys.exit(0)
