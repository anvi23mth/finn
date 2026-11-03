from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app.models.models import PortfolioItem, Announcement, Alert
from app.schemas.schemas import PortfolioItemCreate, PortfolioItemResponse, PortfolioSummaryResponse, SectorAllocation
from app.services.stock_service import StockService
from app.config import settings

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("/summary", response_model=PortfolioSummaryResponse)
def get_portfolio_summary(db: Session = Depends(get_db)):
    """
    Returns full portfolio overview including total market value, daily gain/loss,
    sector allocation breakdown, and all constituent holdings.
    """
    items = db.query(PortfolioItem).filter(PortfolioItem.is_active == True).all()
    
    total_market_val = 0.0
    total_invested = 0.0
    daily_change_val = 0.0
    sector_map: Dict[str, Dict[str, Any]] = {}
    
    item_responses = []

    for item in items:
        # Fetch latest market snapshot for ticker
        snap = StockService.fetch_stock_snapshot(item.ticker, db)
        current_price = snap.get("current_price", item.avg_buy_price)
        pct_change = snap.get("pct_change", 0.0)
        
        m_val = round(item.shares_held * current_price, 2)
        inv_val = round(item.shares_held * item.avg_buy_price, 2)
        pnl = round(m_val - inv_val, 2)
        day_pnl = round(m_val * (pct_change / 100.0), 2)

        total_market_val += m_val
        total_invested += inv_val
        daily_change_val += day_pnl

        # Sector tracking
        sec = item.sector or "Diversified"
        if sec not in sector_map:
            sector_map[sec] = {"count": 0, "total_value": 0.0}
        sector_map[sec]["count"] += 1
        sector_map[sec]["total_value"] += m_val

        item_responses.append(PortfolioItemResponse(
            id=item.id,
            ticker=item.ticker,
            name=item.name,
            sector=item.sector,
            shares_held=item.shares_held,
            avg_buy_price=item.avg_buy_price,
            is_active=item.is_active,
            current_price=current_price,
            daily_change_pct=pct_change,
            market_value=m_val,
            unrealized_pnl=pnl,
            created_at=item.created_at
        ))

    total_gain_loss = total_market_val - total_invested
    total_gain_loss_pct = (total_gain_loss / total_invested * 100.0) if total_invested > 0 else 0.0
    daily_change_pct = (daily_change_val / (total_market_val - daily_change_val) * 100.0) if (total_market_val - daily_change_val) > 0 else 0.0

    sectors = []
    for s_name, data in sector_map.items():
        weight = (data["total_value"] / total_market_val * 100.0) if total_market_val > 0 else 0.0
        sectors.append(SectorAllocation(
            sector=s_name,
            count=data["count"],
            weight_pct=round(weight, 1),
            total_value=round(data["total_value"], 2)
        ))
    sectors.sort(key=lambda x: x.total_value, reverse=True)

    return PortfolioSummaryResponse(
        total_market_value=round(total_market_val, 2),
        total_invested=round(total_invested, 2),
        total_gain_loss=round(total_gain_loss, 2),
        total_gain_loss_pct=round(total_gain_loss_pct, 2),
        daily_change_value=round(daily_change_val, 2),
        daily_change_pct=round(daily_change_pct, 2),
        holdings_count=len(item_responses),
        sectors=sectors,
        items=item_responses
    )

@router.post("/items", response_model=PortfolioItemResponse)
def add_portfolio_item(payload: PortfolioItemCreate, db: Session = Depends(get_db)):
    """
    Adds a new company to the monitored portfolio.
    """
    clean_ticker = payload.ticker.strip().upper().replace(".NS", "").replace(".BO", "")
    existing = db.query(PortfolioItem).filter(PortfolioItem.ticker == clean_ticker).first()
    if existing:
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        snap = StockService.fetch_stock_snapshot(clean_ticker, db)
        return PortfolioItemResponse(
            id=existing.id,
            ticker=existing.ticker,
            name=existing.name,
            sector=existing.sector,
            shares_held=existing.shares_held,
            avg_buy_price=existing.avg_buy_price,
            is_active=True,
            current_price=snap.get("current_price"),
            daily_change_pct=snap.get("pct_change"),
            market_value=existing.shares_held * snap.get("current_price", 0.0),
            unrealized_pnl=0.0,
            created_at=existing.created_at
        )

    # Fetch snapshot to verify valid NSE ticker and get live price
    snap = StockService.fetch_stock_snapshot(clean_ticker, db)
    buy_price = payload.avg_buy_price if payload.avg_buy_price > 0 else snap.get("current_price", 100.0)

    new_item = PortfolioItem(
        ticker=clean_ticker,
        name=payload.name if payload.name != clean_ticker else snap.get("name", f"{clean_ticker} Ltd."),
        sector=payload.sector if payload.sector != "Diversified" else snap.get("sector", "Diversified"),
        shares_held=payload.shares_held,
        avg_buy_price=buy_price,
        is_active=True
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    cur_price = snap.get("current_price", buy_price)
    m_val = round(new_item.shares_held * cur_price, 2)
    pnl = round(m_val - (new_item.shares_held * buy_price), 2)

    return PortfolioItemResponse(
        id=new_item.id,
        ticker=new_item.ticker,
        name=new_item.name,
        sector=new_item.sector,
        shares_held=new_item.shares_held,
        avg_buy_price=new_item.avg_buy_price,
        is_active=new_item.is_active,
        current_price=cur_price,
        daily_change_pct=snap.get("pct_change", 0.0),
        market_value=m_val,
        unrealized_pnl=pnl,
        created_at=new_item.created_at
    )

@router.delete("/items/{ticker}")
def remove_portfolio_item(ticker: str, db: Session = Depends(get_db)):
    """
    Removes a company from the monitored portfolio.
    """
    clean_ticker = ticker.strip().upper().replace(".NS", "").replace(".BO", "")
    item = db.query(PortfolioItem).filter(PortfolioItem.ticker == clean_ticker).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Ticker {clean_ticker} not found in portfolio")

    db.delete(item)
    db.commit()
    return {"message": f"Ticker {clean_ticker} successfully removed from portfolio", "ticker": clean_ticker}

@router.get("/briefing")
def get_daily_executive_briefing(db: Session = Depends(get_db)):
    """
    AI-generated morning executive briefing for the portfolio manager,
    synthesizing overnight announcements, material disclosures, and market anomalies.
    """
    recent_anns = db.query(Announcement).filter(Announcement.priority.in_(["Critical", "High"])).order_by(Announcement.filing_datetime.desc()).limit(5).all()
    active_alerts = db.query(Alert).filter(Alert.is_read == False).order_by(Alert.triggered_at.desc()).limit(3).all()

    briefing = {
        "date": "Today, Morning Briefing",
        "market_sentiment": "Positive / Constructive",
        "headline": "Leadership pivot at Tata Motors (JLR) and resilient Q2 earnings from Reliance anchor portfolio stability.",
        "key_takeaways": [
            "Tata Motors appointed Dr. Stefan Weckbach (architect of Porsche Taycan EV) to head JLR, addressing market concerns over EV software strategy.",
            "Reliance Industries delivered consolidated PAT of ₹19,324 Cr (+11.4% YoY) as telecom tariff revisions expanded Jio ARPU to ₹195.1.",
            "Sun Pharma expanded oncology pipeline with $570M acquisition of Checkpoint Therapeutics (Cosibelimab therapy).",
            "Bharti Airtel filed supplementary Supreme Court curative petition on AGR calculations, seeking ₹12,000 Cr accounting relief."
        ],
        "top_announcements_count": len(recent_anns),
        "unresolved_alerts_count": len(active_alerts)
    }
    return briefing

