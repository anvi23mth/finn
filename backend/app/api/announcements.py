from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.database import get_db
from app.models.models import Announcement, PortfolioItem
from app.schemas.schemas import AnnouncementResponse, AnnouncementDigestResponse, QuarterlyResultsBreakdown, ManagementBio
from app.services.announcement_service import AnnouncementService, ANNOUNCEMENT_CATEGORIES

router = APIRouter(prefix="/announcements", tags=["Corporate Announcements"])

def _format_announcement(ann: Announcement) -> AnnouncementResponse:
    res_data = None
    bio_data = None
    
    if ann.extracted_data:
        if "results_data" in ann.extracted_data:
            res_data = QuarterlyResultsBreakdown(**ann.extracted_data["results_data"])
        if "management_bio" in ann.extracted_data:
            bio_data = ManagementBio(**ann.extracted_data["management_bio"])

    return AnnouncementResponse(
        id=ann.id,
        ticker=ann.ticker,
        company_name=ann.company_name,
        title=ann.title,
        filing_datetime=ann.filing_datetime,
        category=ann.category,
        priority=ann.priority,
        document_url=ann.document_url,
        summary=ann.summary,
        why_it_matters=ann.why_it_matters,
        is_routine=ann.is_routine,
        results_data=res_data,
        management_bio=bio_data
    )

@router.get("/digest", response_model=AnnouncementDigestResponse)
def get_announcements_digest(
    window: str = Query("7d", pattern="^(24h|3d|7d|custom)$"),
    category: Optional[str] = None,
    portfolio_only: bool = True,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns filtered and prioritized corporate filings across the portfolio:
    - Windowed: 24h, 3d, 7d, custom
    - Materiality prioritized (Critical, High)
    - Routine collapsed
    - Extracted headline quarterly numbers (Revenue, EBITDA, PBT, PAT QoQ/YoY)
    - Extracted management change bios (LinkedIn pedigree)
    """
    # Filter by user's portfolio tickers if requested
    selected_tickers = None
    if portfolio_only:
        p_items = db.query(PortfolioItem).filter(PortfolioItem.is_active == True).all()
        selected_tickers = [p.ticker for p in p_items]

    c_start = datetime.fromisoformat(start_date) if start_date else None
    c_end = datetime.fromisoformat(end_date) if end_date else None

    raw_digest = AnnouncementService.get_windowed_digest(
        db=db,
        window=window,
        custom_start=c_start,
        custom_end=c_end,
        selected_tickers=selected_tickers
    )

    # Optional category filter
    material_list = raw_digest["material_announcements"]
    routine_list = raw_digest["routine_announcements"]

    if category and category != "all":
        material_list = [a for a in material_list if a.category == category]
        routine_list = [a for a in routine_list if a.category == category]

    formatted_material = [_format_announcement(a) for a in material_list]
    formatted_routine = [_format_announcement(a) for a in routine_list]

    return AnnouncementDigestResponse(
        window=raw_digest["window"],
        start_date=raw_digest["start_date"],
        end_date=raw_digest["end_date"],
        total_count=len(formatted_material) + len(formatted_routine),
        critical_count=sum(1 for a in formatted_material if a.priority == "Critical"),
        high_count=sum(1 for a in formatted_material if a.priority == "High"),
        routine_collapsed_count=len(formatted_routine),
        material_announcements=formatted_material,
        routine_announcements=formatted_routine
    )

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """
    Returns the 17 corporate announcement categories defined in ENAM Challenge Reference
    along with filing counts in the system.
    """
    counts = {}
    for cat in ANNOUNCEMENT_CATEGORIES:
        c = db.query(Announcement).filter(Announcement.category == cat).count()
        counts[cat] = c
    return {
        "categories": ANNOUNCEMENT_CATEGORIES,
        "counts": counts
    }

@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement_by_id(announcement_id: int, db: Session = Depends(get_db)):
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return _format_announcement(ann)
