"""
Free Fundamental Data Fetcher
Integrates EconDB API and ForexFactory RSS for comprehensive fundamental analysis
"""

import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import Dict, Optional

# Currency to country mapping for ForexFactory
CURRENCY_COUNTRY_MAP = {
    'USD': 'USD',
    'EUR': 'EUR', 
    'GBP': 'GBP',
    'JPY': 'JPY',
    'AUD': 'AUD',
    'NZD': 'NZD',
    'CAD': 'CAD',
    'CHF': 'CHF'
}

# EconDB ticker mapping for key indicators
ECONDB_TICKERS = {
    'USD': {
        'cpi': 'CPIUSD',
        'gdp': 'GDPUSD',
        'rate': 'FFRUSD'  # Federal Funds Rate
    },
    'EUR': {
        'cpi': 'CPIEUR',
        'gdp': 'GDPEUR',
        'rate': 'RRTBEUR'  # ECB Rate
    },
    'GBP': {
        'cpi': 'CPIGBP',
        'gdp': 'GDPGBP',
        'rate': 'IRBRGBP'  # BOE Rate
    },
    'JPY': {
        'cpi': 'CPIJPY',
        'gdp': 'GDPJPY',
        'rate': 'IRJPJPY'  # BOJ Rate
    },
    'AUD': {
        'cpi': 'CPIAUD',
        'gdp': 'GDPAUD',
        'rate': 'IRAUAUD'  # RBA Rate
    },
    'NZD': {
        'cpi': 'CPINZD',
        'gdp': 'GDPNZD',
        'rate': 'IRNZNZD'  # RBNZ Rate
    },
    'CAD': {
        'cpi': 'CPICAD',
        'gdp': 'GDPCAD',
        'rate': 'IRCACAD'  # BOC Rate
    },
    'CHF': {
        'cpi': 'CPICHF',
        'gdp': 'GDPCHF',
        'rate': 'IRCHCHF'  # SNB Rate
    }
}


def fetch_econdb_indicator(ticker: str) -> Optional[Dict]:
    """
    Fetch indicator data from EconDB API
    Returns dict with latest value and % change
    """
    try:
        url = f"https://www.econdb.com/api/series/{ticker}/?format=json"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"⚠️ EconDB: Failed to fetch {ticker} (status {response.status_code})")
            return None
            
        data = response.json()
        
        # Extract data points
        if 'data' in data and 'values' in data['data'] and len(data['data']['values']) >= 2:
            values = data['data']['values']
            latest = values[-1][1]  # Latest value
            previous = values[-2][1]  # Previous value
            
            if latest and previous and previous != 0:
                pct_change = ((latest - previous) / abs(previous)) * 100
                return {
                    'value': latest,
                    'previous': previous,
                    'pct_change': pct_change
                }
        
        return None
    except Exception as e:
        print(f"⚠️ EconDB error for {ticker}: {e}")
        return None


def score_econdb_data(currency: str) -> int:
    """
    Score currency based on EconDB macro indicators
    Rules:
    - Indicator change > +0.5% → +2 points
    - Indicator change < -0.5% → -2 points
    """
    score = 0
    
    if currency not in ECONDB_TICKERS:
        return 0
    
    indicators = ECONDB_TICKERS[currency]
    
    # Fetch and score each indicator
    for indicator_type, ticker in indicators.items():
        data = fetch_econdb_indicator(ticker)
        
        if data:
            pct_change = data['pct_change']
            
            # Positive indicators (CPI, GDP growth) - higher is hawkish
            if indicator_type in ['cpi', 'gdp']:
                if pct_change > 0.5:
                    score += 2
                    print(f"✅ {currency} {indicator_type.upper()} +{pct_change:.2f}% → +2")
                elif pct_change < -0.5:
                    score -= 2
                    print(f"❌ {currency} {indicator_type.upper()} {pct_change:.2f}% → -2")
            
            # Interest rate changes - higher is hawkish
            elif indicator_type == 'rate':
                if pct_change > 0.5:
                    score += 2
                    print(f"✅ {currency} Rate +{pct_change:.2f}% → +2")
                elif pct_change < -0.5:
                    score -= 2
                    print(f"❌ {currency} Rate {pct_change:.2f}% → -2")
    
    return score


def fetch_forexfactory_calendar() -> list:
    """
    Parse ForexFactory RSS feed for economic events
    Returns list of events with country, impact, actual, forecast
    """
    try:
        url = "https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.xml"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"⚠️ ForexFactory RSS: Failed to fetch (status {response.status_code})")
            return []
        
        # Parse XML
        root = ET.fromstring(response.content)
        events = []
        
        for item in root.findall('.//item'):
            try:
                title_elem = item.find('title')
                desc_elem = item.find('description')
                
                title = title_elem.text if title_elem is not None and title_elem.text else ''
                description = desc_elem.text if desc_elem is not None and desc_elem.text else ''
                
                # Parse event details from description
                # ForexFactory format: <Country><Impact><Title><Actual><Forecast><Previous>
                event_data = {}
                
                # Extract country (usually first tag in description)
                if description and '<b>Country:</b>' in description:
                    country_start = description.find('<b>Country:</b>') + len('<b>Country:</b>')
                    country_end = description.find('<br', country_start)
                    event_data['country'] = description[country_start:country_end].strip()
                
                # Extract impact
                if description and '<b>Impact:</b>' in description:
                    impact_start = description.find('<b>Impact:</b>') + len('<b>Impact:</b>')
                    impact_end = description.find('<br', impact_start)
                    impact = description[impact_start:impact_end].strip().lower()
                    event_data['impact'] = impact
                
                # Extract actual value
                if description and '<b>Actual:</b>' in description:
                    actual_start = description.find('<b>Actual:</b>') + len('<b>Actual:</b>')
                    actual_end = description.find('<br', actual_start)
                    actual_text = description[actual_start:actual_end].strip()
                    try:
                        # Remove % and convert to float
                        actual_text = actual_text.replace('%', '').replace('K', '').replace('M', '')
                        event_data['actual'] = float(actual_text) if actual_text else None
                    except ValueError:
                        event_data['actual'] = None
                
                # Extract forecast value
                if description and '<b>Forecast:</b>' in description:
                    forecast_start = description.find('<b>Forecast:</b>') + len('<b>Forecast:</b>')
                    forecast_end = description.find('<br', forecast_start)
                    forecast_text = description[forecast_start:forecast_end].strip()
                    try:
                        forecast_text = forecast_text.replace('%', '').replace('K', '').replace('M', '')
                        event_data['forecast'] = float(forecast_text) if forecast_text else None
                    except ValueError:
                        event_data['forecast'] = None
                
                event_data['title'] = title
                
                if event_data.get('country') and event_data.get('impact'):
                    events.append(event_data)
                    
            except Exception as e:
                print(f"⚠️ Error parsing FF event: {e}")
                continue
        
        print(f"📊 ForexFactory: Parsed {len(events)} events")
        return events
        
    except Exception as e:
        print(f"⚠️ ForexFactory RSS error: {e}")
        return []


def score_forexfactory_data(currency: str, events: list) -> int:
    """
    Score currency based on ForexFactory economic surprises
    Rules:
    - Actual > Forecast → +impact_weight
    - Actual < Forecast → -impact_weight
    - Impact weight: low=1, medium=2, high=3
    """
    score = 0
    
    # Map currency to country code
    if currency not in CURRENCY_COUNTRY_MAP:
        return 0
    
    country_code = CURRENCY_COUNTRY_MAP[currency]
    
    # Filter events for this currency
    currency_events = [e for e in events if e.get('country') == country_code]
    
    for event in currency_events:
        actual = event.get('actual')
        forecast = event.get('forecast')
        impact = event.get('impact', 'low')
        
        if actual is None or forecast is None:
            continue
        
        # Determine impact weight
        impact_weight = 1
        if 'high' in impact:
            impact_weight = 3
        elif 'medium' in impact or 'med' in impact:
            impact_weight = 2
        
        # Calculate surprise
        surprise = actual - forecast
        
        if surprise > 0:
            score += impact_weight
            print(f"✅ {currency} {event.get('title', '')[:30]}... beat → +{impact_weight}")
        elif surprise < 0:
            score -= impact_weight
            print(f"❌ {currency} {event.get('title', '')[:30]}... miss → -{impact_weight}")
    
    return score


def combine_fundamental_scores() -> Dict[str, int]:
    """
    Main function: Combines EconDB + ForexFactory scores
    Returns dictionary: {currency: total_score}
    """
    print("\n" + "="*60)
    print("🔄 FETCHING FREE FUNDAMENTAL DATA")
    print("="*60)
    
    currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF']
    combined_scores = {}
    
    # Fetch ForexFactory events once (used for all currencies)
    print("\n📰 Fetching ForexFactory calendar...")
    ff_events = fetch_forexfactory_calendar()
    
    # Score each currency
    for currency in currencies:
        print(f"\n💱 Scoring {currency}...")
        
        # EconDB score
        print(f"  📊 EconDB indicators...")
        econdb_score = score_econdb_data(currency)
        
        # ForexFactory score
        print(f"  📰 ForexFactory events...")
        ff_score = score_forexfactory_data(currency, ff_events)
        
        # Combine
        total_score = econdb_score + ff_score
        combined_scores[currency] = total_score
        
        print(f"  ✅ {currency} Total: {total_score} (EconDB: {econdb_score}, FF: {ff_score})")
    
    print("\n" + "="*60)
    print("✅ FUNDAMENTAL SCORING COMPLETE")
    print("="*60)
    
    return combined_scores


if __name__ == "__main__":
    # Test the module
    scores = combine_fundamental_scores()
    print("\n📊 Final Scores:")
    for cur, score in scores.items():
        print(f"  {cur}: {score:+d}")
