from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ================= Portfolio Schemas =================
class PortfolioItemBase(BaseModel):
    ticker: str
    name: str
    sector: str = "Diversified"
    shares_held: float = 100.0
    avg_buy_price: float = 0.0

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItemResponse(PortfolioItemBase):
    id: int
    is_active: bool
    current_price: Optional[float] = None
    daily_change_pct: Optional[float] = None
    market_value: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SectorAllocation(BaseModel):
    sector: str
    count: int
    weight_pct: float
    total_value: float

class PortfolioSummaryResponse(BaseModel):
    total_market_value: float
    total_invested: float
    total_gain_loss: float
    total_gain_loss_pct: float
    daily_change_value: float
    daily_change_pct: float
    holdings_count: int
    sectors: List[SectorAllocation]
    items: List[PortfolioItemResponse]

# ================= Stock Data Schemas =================
class StockSnapshotResponse(BaseModel):
    ticker: str
    name: str
    sector: str
    current_price: float
    previous_close: float
    change: float
    pct_change: float
    open_price: float
    day_high: float
    day_low: float
    volume: float
    avg_vol_20d: float
    volume_spike_ratio: float
    volatility_20d: float
    market_cap: float
    pe_ratio: Optional[float] = None
    last_updated: datetime

class StockHistoryDataPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    daily_return_pct: Optional[float] = None

class StockDetailResponse(BaseModel):
    snapshot: StockSnapshotResponse
    history_30d: List[StockHistoryDataPoint]
    is_in_portfolio: bool

# ================= Announcement Schemas =================
class QuarterlyResultsBreakdown(BaseModel):
    revenue_cr: float
    ebitda_cr: float
    pbt_cr: float
    pat_cr: float
    revenue_qoq_pct: Optional[float] = None
    revenue_yoy_pct: Optional[float] = None
    ebitda_margin_pct: Optional[float] = None
    pat_qoq_pct: Optional[float] = None
    pat_yoy_pct: Optional[float] = None

class ManagementBio(BaseModel):
    person_name: str
    role: str
    nature_of_change: str # "Appointment", "Resignation", "Retirement"
    previous_experience: Optional[str] = None
    education: Optional[str] = None
    pedigree_summary: Optional[str] = None

class AnnouncementResponse(BaseModel):
    id: int
    ticker: str
    company_name: str
    title: str
    filing_datetime: datetime
    category: str
    priority: str # Critical, High, Medium, Low
    document_url: Optional[str] = None
    summary: str
    why_it_matters: str
    is_routine: bool
    results_data: Optional[QuarterlyResultsBreakdown] = None
    management_bio: Optional[ManagementBio] = None

    class Config:
        from_attributes = True

class AnnouncementDigestResponse(BaseModel):
    window: str # "24h", "3d", "7d", "custom"
    start_date: datetime
    end_date: datetime
    total_count: int
    critical_count: int
    high_count: int
    routine_collapsed_count: int
    material_announcements: List[AnnouncementResponse]
    routine_announcements: List[AnnouncementResponse]

# ================= Alert Schemas =================
class AlertResponse(BaseModel):
    id: int
    ticker: str
    company_name: str
    alert_type: str # "announcement" | "price_shock" | "volume_spike"
    title: str
    message: str
    priority: str
    category: Optional[str] = None
    threshold_info: Optional[str] = None
    is_read: bool
    triggered_at: datetime

    class Config:
        from_attributes = True

class AlertConfigResponse(BaseModel):
    price_movement_threshold_pct: float
    volume_spike_threshold_multiplier: float
    monitored_categories: List[str]

class AlertConfigUpdate(BaseModel):
    price_movement_threshold_pct: Optional[float] = None
    volume_spike_threshold_multiplier: Optional[float] = None
    monitored_categories: Optional[List[str]] = None

# ================= RAG / Pull Research Schemas =================
class SourceCitation(BaseModel):
    source_title: str
    doc_type: str # "Annual Report", "Earnings Call Transcript", "Financial Results"
    period: str # "FY24", "Q2-FY25"
    section: str
    page_number: Optional[str] = None
    quote: str

class ResearchModuleRequest(BaseModel):
    ticker: str
    module_type: str # business_snapshot, financial_snapshot, trajectory, balance_sheet, cash_quality, narrative_vs_numbers, guidance, bull_vs_bear, custom
    custom_query: Optional[str] = None

class MetricItem(BaseModel):
    label: str
    value: str
    change: Optional[str] = None
    sentiment: Optional[str] = None # "positive", "negative", "neutral"

class NarrativeVsNumbersDelivery(BaseModel):
    quarter: str
    management_guidance: str
    actual_delivered: str
    outcome: str # "Exceeded", "Met", "Missed"
    analysis: str

class ResearchResponse(BaseModel):
    ticker: str
    company_name: str
    module_type: str
    title: str
    executive_summary: str
    content_markdown: str
    key_metrics: List[MetricItem] = []
    citations: List[SourceCitation] = []
    narrative_table: Optional[List[NarrativeVsNumbersDelivery]] = None
    grounded_in_primary_only: bool = True

