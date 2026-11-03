from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.models.models import PortfolioItem
from app.schemas.schemas import StockSnapshotResponse, StockDetailResponse, StockHistoryDataPoint
from app.services.stock_service import StockService, FALLBACK_BASE_PRICES

router = APIRouter(prefix="/stocks", tags=["Stock Data"])

@router.get("/{ticker}", response_model=StockDetailResponse)
def get_stock_detail(ticker: str, db: Session = Depends(get_db)):
    """
    Returns full stock intelligence:
    - Real-time snapshot with price, % change, volume
    - Calculated 20-day average volume & volume spike ratio
    - Calculated 20-day historical volatility
    - 30-day historical OHLCV series for interactive charting
    """
    clean_ticker = ticker.strip().upper().replace(".NS", "").replace(".BO", "")
    
    # 1. Fetch snapshot
    snapshot_data = StockService.fetch_stock_snapshot(clean_ticker, db)
    
    # 2. Fetch 30-day historical series
    history_data = StockService.fetch_stock_history_30d(clean_ticker)

    # 3. Check if in user portfolio
    is_in_portfolio = db.query(PortfolioItem).filter(
        PortfolioItem.ticker == clean_ticker,
        PortfolioItem.is_active == True
    ).first() is not None

    return StockDetailResponse(
        snapshot=StockSnapshotResponse(**snapshot_data),
        history_30d=[StockHistoryDataPoint(**p) for p in history_data],
        is_in_portfolio=is_in_portfolio
    )

@router.get("/{ticker}/snapshot", response_model=StockSnapshotResponse)
def get_stock_snapshot(ticker: str, db: Session = Depends(get_db)):
    """
    Returns immediate price and volume snapshot for any valid NSE ticker.
    """
    clean_ticker = ticker.strip().upper().replace(".NS", "").replace(".BO", "")
    snapshot_data = StockService.fetch_stock_snapshot(clean_ticker, db)
    return StockSnapshotResponse(**snapshot_data)

@router.get("/search/query")
def search_stocks(q: str = Query(..., min_length=1)):
    """
    Autocompletes and searches across Indian listed equities.
    """
    query = q.strip().upper()
    results = []

    for t, info in FALLBACK_BASE_PRICES.items():
        if query in t or query in info["name"].upper() or query in info["sector"].upper():
            results.append({
                "ticker": t,
                "name": info["name"],
                "sector": info["sector"],
                "base_price": info["price"]
            })

    # If query not matched in standard list, allow arbitrary NSE lookup
    if not results and len(query) >= 2:
        results.append({
            "ticker": query,
            "name": f"{query} (NSE Listed)",
            "sector": "Equities",
            "base_price": 0.0
        })

    return results

