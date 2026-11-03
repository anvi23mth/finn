import sys
import os
import json

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app, seed_database

# Initialize database
seed_database()
client = TestClient(app)

def test_all():
    print("==================================================")
    print("🚀 FINN FINANCIAL INVESTMENT AGENT - TEST SUITE")
    print("==================================================\n")

    # 1. Health check
    print("Test 1: Health Check Root Endpoint")
    r = client.get("/")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    data = r.json()
    assert data["status"] == "online"
    print(f"  ✓ Root status: {data['status']}, App: {data['app']}, Version: {data['version']}")

    # 2. Portfolio Summary
    print("\nTest 2: Portfolio Overview & Valuation")
    r = client.get("/api/v1/portfolio/summary")
    assert r.status_code == 200
    summary = r.json()
    print(f"  ✓ Total Market Value: ₹{summary['total_market_value']:,.2f}")
    print(f"  ✓ Total Holdings Count: {summary['holdings_count']} companies")
    print(f"  ✓ Daily Change: {summary['daily_change_pct']:+.2f}% (₹{summary['daily_change_value']:,.2f})")
    print(f"  ✓ Sectors Tracked ({len(summary['sectors'])}): {', '.join([s['sector'] + ' (' + str(s['weight_pct']) + '%)' for s in summary['sectors'][:4]])}...")
    assert summary["holdings_count"] >= 15

    # 3. AI Morning Executive Briefing
    print("\nTest 3: AI Morning Executive Briefing")
    r = client.get("/api/v1/portfolio/briefing")
    assert r.status_code == 200
    brief = r.json()
    print(f"  ✓ Headline: {brief['headline']}")
    print(f"  ✓ Key Takeaways ({len(brief['key_takeaways'])}):")
    for t in brief['key_takeaways'][:2]:
        print(f"    - {t}")

    # 4. Watchlist Dynamic Add and Remove
    print("\nTest 4: Dynamic Watchlist Management (Add & Remove)")
    r = client.post("/api/v1/portfolio/items", json={"ticker": "ZOMATO", "name": "Zomato Ltd.", "shares_held": 500})
    assert r.status_code == 200
    print(f"  ✓ Successfully added ZOMATO to portfolio (Price: ₹{r.json()['current_price']})")
    
    r_del = client.delete("/api/v1/portfolio/items/ZOMATO")
    assert r_del.status_code == 200
    print(f"  ✓ Successfully removed ZOMATO from portfolio")

    # 5. Stock Technical & Volume Metrics Engine
    print("\nTest 5: Stock Technical & Volume Metrics Engine (RELIANCE)")
    r = client.get("/api/v1/stocks/RELIANCE")
    assert r.status_code == 200
    stk = r.json()
    snap = stk["snapshot"]
    print(f"  ✓ Current Price: ₹{snap['current_price']:,.2f} ({snap['pct_change']:+.2f}%)")
    print(f"  ✓ 20-Day Avg Volume: {snap['avg_vol_20d']:,.0f} shares")
    print(f"  ✓ Volume Spike Ratio: {snap['volume_spike_ratio']:.2f}x")
    print(f"  ✓ 20-Day Annualized Volatility: {snap['volatility_20d']:.1f}%")
    print(f"  ✓ 30-Day Historical Candle Data: {len(stk['history_30d'])} daily data points")
    assert len(stk["history_30d"]) > 10

    # 6. Corporate Announcements Digest (PUSH Mode)
    print("\nTest 6: Windowed Announcements Digest & Materiality Scoring")
    r = client.get("/api/v1/announcements/digest?window=7d")
    assert r.status_code == 200
    digest = r.json()
    print(f"  ✓ Total Filings: {digest['total_count']}")
    print(f"  ✓ Critical Priority: {digest['critical_count']}")
    print(f"  ✓ High Priority: {digest['high_count']}")
    print(f"  ✓ Routine Paperwork Collapsed: {digest['routine_collapsed_count']}")
    
    # Check Quarterly Results headline number extraction
    results_ann = next((a for a in digest["material_announcements"] if a["category"] == "results" and a["results_data"]), None)
    if results_ann:
        res = results_ann["results_data"]
        print(f"  ✓ Extracted Results for {results_ann['ticker']}:")
        print(f"    - Revenue: ₹{res['revenue_cr']:,.0f} Cr ({res['revenue_yoy_pct']:+.1f}% YoY)")
        print(f"    - EBITDA: ₹{res['ebitda_cr']:,.0f} Cr ({res['ebitda_margin_pct']}% margin)")
        print(f"    - PAT: ₹{res['pat_cr']:,.0f} Cr ({res['pat_yoy_pct']:+.1f}% YoY)")

    # Check Management Bio extraction
    mgmt_ann = next((a for a in digest["material_announcements"] if a["category"] == "management_change" and a["management_bio"]), None)
    if mgmt_ann:
        bio = mgmt_ann["management_bio"]
        print(f"  ✓ Extracted Management Change for {mgmt_ann['ticker']}:")
        print(f"    - Executive: {bio['person_name']} ({bio['role']})")
        print(f"    - Pedigree: {bio['previous_experience']}")

    # 7. 17 Announcement Categories
    print("\nTest 7: Verification of the 17 Canonical Announcement Categories")
    r = client.get("/api/v1/announcements/categories")
    assert r.status_code == 200
    cats = r.json()["categories"]
    print(f"  ✓ All 17 categories registered: {', '.join(cats[:6])}...")
    assert len(cats) == 17

    # 8. Surveillance Alerts & Threshold Configuration
    print("\nTest 8: Surveillance Alerts & Threshold Configuration")
    r = client.get("/api/v1/alerts")
    assert r.status_code == 200
    alerts = r.json()
    print(f"  ✓ Active Triggered Alerts: {len(alerts)} alerts")
    for a in alerts[:2]:
        print(f"    - [{a['priority']}] {a['ticker']}: {a['title']} ({a['threshold_info']})")

    # Update Threshold Config
    r_cfg = client.put("/api/v1/alerts/config", json={"price_movement_threshold_pct": 6.0, "volume_spike_threshold_multiplier": 2.5})
    assert r_cfg.status_code == 200
    cfg = r_cfg.json()
    assert cfg["price_movement_threshold_pct"] == 6.0
    assert cfg["volume_spike_threshold_multiplier"] == 2.5
    print(f"  ✓ Config Updated: Price ±{cfg['price_movement_threshold_pct']}%, Volume {cfg['volume_spike_threshold_multiplier']}x")

    # 9. AI Fundamental Research Copilot (PULL Mode) - The 8 Modules
    print("\nTest 9: AI Fundamental Research Copilot (PULL Mode)")
    
    # 9a. Narrative vs Numbers (Worked Example from Brief)
    print("  Testing Module 6: Narrative vs. Numbers (4-Quarter Delivery Audit for RELIANCE)...")
    r = client.post("/api/v1/research/module", json={"ticker": "RELIANCE", "module_type": "narrative_vs_numbers"})
    assert r.status_code == 200
    res = r.json()
    print(f"    ✓ Title: {res['title']}")
    print(f"    ✓ Grounded in Primary Data Only: {res['grounded_in_primary_only']}")
    print(f"    ✓ Quarters Audited: {len(res['narrative_table'])}")
    for d in res['narrative_table'][:2]:
        print(f"      [{d['quarter']}] Promised: {d['management_guidance'][:50]}... -> Delivered: {d['actual_delivered'][:45]}... (Outcome: {d['outcome']})")
    print(f"    ✓ Primary Source Citations ({len(res['citations'])}):")
    for c in res['citations'][:2]:
        print(f"      - {c['source_title']} ({c['period']}) -> Section: {c['section']}")

    # 9b. Balance Sheet Module
    print("  Testing Module 4: Balance Sheet & Leverage (TCS)...")
    r = client.post("/api/v1/research/module", json={"ticker": "TCS", "module_type": "balance_sheet"})
    assert r.status_code == 200
    res_bs = r.json()
    print(f"    ✓ Title: {res_bs['title']}")
    for m in res_bs['key_metrics'][:3]:
        print(f"      {m['label']}: {m['value']} ({m['change']})")

    # 9c. Bull vs Bear Case
    print("  Testing Module 8: Bull vs. Bear Case (RELIANCE)...")
    r = client.post("/api/v1/research/module", json={"ticker": "RELIANCE", "module_type": "bull_vs_bear"})
    assert r.status_code == 200
    res_bb = r.json()
    print(f"    ✓ Summary: {res_bb['executive_summary'][:80]}...")

    print("\n==================================================")
    print("🎉 ALL 9 TEST SUITES PASSED FLAWLESSLY (100% SUCCESS)!")
    print("==================================================")

if __name__ == "__main__":
    test_all()

