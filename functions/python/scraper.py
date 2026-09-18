# scraper.py — Grant scraper for Grants.gov, SBIR.gov APIs
import os
import requests
from typing import List, Dict, Optional
from datetime import datetime

GRANTS_GOV_API = "https://apply07.grants.gov/grantsws/rest/opportunities/search"
SBIR_API = "https://api.sbir.gov/solicitations"

def search_grants_gov(keywords: str, location: Optional[str] = None, max_funding: Optional[float] = None, deadline_after: Optional[str] = None) -> List[Dict]:
    """Search Grants.gov REST API for opportunities."""
    params = {
        "keyword": keywords,
        "oppStatuses": "forecasted|posted",
        "rows": 25,
    }
    if max_funding:
        params["awardCeiling"] = int(max_funding)

    api_key = os.environ.get("GRANTS_GOV_API_KEY", "")
    headers = {}
    if api_key:
        headers["X-Api-Key"] = api_key

    try:
        resp = requests.post(GRANTS_GOV_API, json=params, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for opp in data.get("oppHits", []):
            deadline_str = opp.get("closeDate", "")
            results.append({
                "id": f"gg_{opp.get('id', '')}",
                "name": opp.get("title", "Untitled Grant"),
                "description": opp.get("synopsis", "")[:500],
                "deadline": deadline_str,
                "amount": float(opp.get("awardCeiling", 0) or 0),
                "source": "Grants.gov",
                "url": f"https://www.grants.gov/search-results-detail/{opp.get('id', '')}",
                "agency": opp.get("agencyName", ""),
                "eligibility": [opp.get("eligibility", "Open to eligible organizations")],
                "category": opp.get("oppCategory", ""),
                "matchScore": None,
            })
        return results
    except Exception as e:
        print(f"Grants.gov scrape error: {e}")
        return []


def search_sbir(keywords: str) -> List[Dict]:
    """Search SBIR.gov for small business grants."""
    params = {
        "keyword": keywords,
        "open": 1,
        "rows": 15,
    }
    try:
        resp = requests.get(SBIR_API, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for sol in data.get("results", []):
            results.append({
                "id": f"sbir_{sol.get('solicitation_id', '')}",
                "name": sol.get("program_title", "SBIR Grant"),
                "description": sol.get("abstract", "")[:500],
                "deadline": sol.get("close_date", ""),
                "amount": float(sol.get("award_amount", 0) or 0),
                "source": "SBIR.gov",
                "url": sol.get("solicitation_url", ""),
                "agency": sol.get("agency", ""),
                "eligibility": ["Small businesses", "Phase I/II eligible"],
                "category": "R&D / Innovation",
                "matchScore": None,
            })
        return results
    except Exception as e:
        print(f"SBIR scrape error: {e}")
        return []


def deduplicate(grants: List[Dict]) -> List[Dict]:
    seen = set()
    unique = []
    for g in grants:
        key = (g.get("name", "").lower()[:80], g.get("source", ""))
        if key not in seen:
            seen.add(key)
            unique.append(g)
    return unique


def search_all(keywords: str, location: Optional[str] = None, max_funding: Optional[float] = None, deadline_after: Optional[str] = None) -> List[Dict]:
    grants = []
    grants.extend(search_grants_gov(keywords, location, max_funding, deadline_after))
    grants.extend(search_sbir(keywords))
    return deduplicate(grants)
