#!/usr/bin/env python3
"""
Helper functions to integrate Forex Factory economic scores
into the bias calculation system
"""
import os
from supabase import create_client

SB_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SB_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

sb = create_client(SB_URL, SB_KEY)

def get_economic_scores():
    """
    Fetch latest economic scores from Forex Factory data
    Returns: dict of {currency: score}
    """
    try:
        result = sb.table("economic_scores").select("currency, total_score").execute()
        return {row["currency"]: row["total_score"] for row in result.data}
    except Exception as e:
        print(f"⚠️ Failed to fetch economic scores: {e}")
        return {}

def merge_economic_scores(base_scores):
    """
    Merge Forex Factory economic scores with existing currency scores
    base_scores: dict of {currency: {"total_score": int, ...}}
    Returns: Updated base_scores with economic data added
    """
    economic_scores = get_economic_scores()
    
    for currency, eco_score in economic_scores.items():
        if currency in base_scores:
            # Add economic score to total
            base_scores[currency]["total_score"] += eco_score
            base_scores[currency]["economic_data_score"] = eco_score
            
            # Add to notes
            if eco_score != 0:
                base_scores[currency]["notes"].append(f"Economic data: {eco_score:+d}")
    
    return base_scores

if __name__ == "__main__":
    # Test the integration
    scores = get_economic_scores()
    print("Current Economic Scores:")
    for currency, score in scores.items():
        print(f"  {currency}: {score:+d}")
