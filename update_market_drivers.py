#!/usr/bin/env python3
"""
Update Market Drivers based on fundamental analysis data
Analyzes currency scores, bias data, and market conditions to set driver statuses
"""
import os
from datetime import datetime
from supabase import create_client

# Supabase connection
SB_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SB_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SB_URL or not SB_KEY:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

sb = create_client(SB_URL, SB_KEY)

def analyze_fed_policy():
    """Analyze Fed Rate Policy based on USD strength and DXY trends"""
    try:
        # Get USD currency score
        result = sb.table("currency_scores").select("*").eq("currency", "USD").execute()
        if not result.data:
            return "Neutral", "No USD data"
        
        usd_data = result.data[0]
        total_score = usd_data.get("total_score", 0)
        cb_tone = usd_data.get("central_bank_tone", 0)
        
        # Analyze Fed stance
        if cb_tone > 10:
            status = "Hawkish"
        elif cb_tone < -10:
            status = "Dovish"
        elif total_score > 20:
            status = "Hawkish Pause"
        elif total_score < -20:
            status = "Dovish Pause"
        else:
            status = "Neutral"
        
        return status, f"USD Score: {total_score}, CB Tone: {cb_tone}"
    except Exception as e:
        print(f"Error analyzing Fed policy: {e}")
        return "Neutral", "Analysis error"

def analyze_global_growth():
    """Analyze Global Growth based on equity indices performance"""
    try:
        # Get major indices (SPX, EU50, UK100, JP225)
        indices = ["US500", "EU50", "UK100", "JP225"]
        scores = []
        
        for idx in indices:
            result = sb.table("index_bias").select("bias_score").eq("index_name", idx).execute()
            if result.data:
                scores.append(result.data[0].get("bias_score", 0))
        
        if not scores:
            return "Neutral", "No index data"
        
        avg_score = sum(scores) / len(scores)
        
        # Analyze growth outlook
        if avg_score > 3:
            status = "Expanding"
        elif avg_score > 1:
            status = "Moderate"
        elif avg_score < -3:
            status = "Contracting"
        elif avg_score < -1:
            status = "Slowing"
        else:
            status = "Neutral"
        
        return status, f"Avg Index Score: {avg_score:.1f}"
    except Exception as e:
        print(f"Error analyzing global growth: {e}")
        return "Neutral", "Analysis error"

def analyze_inflation():
    """Analyze Inflation Trends based on USD, EUR, GBP strength and Gold"""
    try:
        # Get major currency scores (inflation indicators)
        currencies = ["USD", "EUR", "GBP"]
        scores = []
        
        for curr in currencies:
            result = sb.table("currency_scores").select("economic_data_score").eq("currency", curr).execute()
            if result.data:
                scores.append(result.data[0].get("economic_data_score", 0))
        
        # Get Gold score (inflation hedge)
        gold_result = sb.table("currency_scores").select("total_score").eq("currency", "XAU").execute()
        gold_score = 0
        if gold_result.data:
            gold_score = gold_result.data[0].get("total_score", 0)
        
        if not scores:
            return "Neutral", "No inflation data"
        
        avg_econ_score = sum(scores) / len(scores)
        
        # Analyze inflation trend
        if gold_score > 20 and avg_econ_score > 10:
            status = "Rising"
        elif gold_score > 10:
            status = "Elevated"
        elif gold_score < -20 and avg_econ_score < -10:
            status = "Deflating"
        elif avg_econ_score < -10:
            status = "Cooling"
        else:
            status = "Stable"
        
        return status, f"Econ Score: {avg_econ_score:.1f}, Gold: {gold_score}"
    except Exception as e:
        print(f"Error analyzing inflation: {e}")
        return "Neutral", "Analysis error"

def analyze_geopolitical_risk():
    """Analyze Geopolitical Risk based on safe-haven currencies (JPY, CHF, Gold)"""
    try:
        # Get safe-haven assets
        safe_havens = {"JPY": 0, "CHF": 0, "XAU": 0}
        
        for asset in safe_havens.keys():
            result = sb.table("currency_scores").select("total_score").eq("currency", asset).execute()
            if result.data:
                safe_havens[asset] = result.data[0].get("total_score", 0)
        
        avg_safe_haven = sum(safe_havens.values()) / len(safe_havens)
        
        # Analyze risk level
        if avg_safe_haven > 20:
            status = "Critical"
        elif avg_safe_haven > 10:
            status = "Elevated"
        elif avg_safe_haven < -10:
            status = "Low"
        else:
            status = "Moderate"
        
        return status, f"Safe Haven Avg: {avg_safe_haven:.1f}"
    except Exception as e:
        print(f"Error analyzing geopolitical risk: {e}")
        return "Moderate", "Analysis error"

def analyze_oil_prices():
    """Analyze Oil Prices based on CAD and commodity trends"""
    try:
        # Get CAD (oil proxy) and commodity currencies
        result = sb.table("currency_scores").select("*").eq("currency", "CAD").execute()
        
        if not result.data:
            return "Neutral", "No commodity data"
        
        cad_data = result.data[0]
        commodity_score = cad_data.get("commodity_correlation", 0)
        total_score = cad_data.get("total_score", 0)
        
        # Analyze oil trend
        if commodity_score > 15:
            status = "Rising"
        elif commodity_score > 5:
            status = "Elevated"
        elif commodity_score < -15:
            status = "Falling"
        elif commodity_score < -5:
            status = "Declining"
        else:
            status = "Stable"
        
        return status, f"CAD Commodity Score: {commodity_score}"
    except Exception as e:
        print(f"Error analyzing oil prices: {e}")
        return "Neutral", "Analysis error"

def update_drivers():
    """Update all market drivers"""
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] Updating Market Drivers...")
    
    # Analyze each driver
    drivers = {
        "Fed Rate Policy": analyze_fed_policy(),
        "Global Growth": analyze_global_growth(),
        "Inflation Trends": analyze_inflation(),
        "Geopolitical Risk": analyze_geopolitical_risk(),
        "Oil Prices": analyze_oil_prices(),
    }
    
    # Update database
    updates = []
    for driver, (status, description) in drivers.items():
        try:
            sb.table("market_drivers").update({
                "status": status,
                "description": description,
                "last_updated": datetime.utcnow().isoformat()
            }).eq("driver", driver).execute()
            
            updates.append(f"{driver}: {status}")
            print(f"  ✅ {driver}: {status} ({description})")
        except Exception as e:
            print(f"  ❌ {driver}: Error - {e}")
    
    print(f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC] ✅ Market drivers updated")
    return True

if __name__ == "__main__":
    update_drivers()
