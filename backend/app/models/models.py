from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    sector = Column(String(100), default="Diversified")
    is_active = Column(Boolean, default=True)
    shares_held = Column(Float, default=100.0)
    avg_buy_price = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class StockPriceSnapshot(Base):
    __tablename__ = "stock_price_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(30), index=True, nullable=False)
    current_price = Column(Float, nullable=False)
    previous_close = Column(Float, nullable=False)
    change = Column(Float, default=0.0)
    pct_change = Column(Float, default=0.0)
    open_price = Column(Float, default=0.0)
    day_high = Column(Float, default=0.0)
    day_low = Column(Float, default=0.0)
    volume = Column(Float, default=0.0)
    avg_vol_20d = Column(Float, default=0.0)
    volume_spike_ratio = Column(Float, default=1.0)
    volatility_20d = Column(Float, default=0.0)
    market_cap = Column(Float, default=0.0)
    pe_ratio = Column(Float, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow)

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(30), index=True, nullable=False)
    company_name = Column(String(200), nullable=False)
    title = Column(String(500), nullable=False)
    filing_datetime = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # 17 standard categories specified in ENAM Challenge Reference:
    # results, M&A, fund_raise, management_change, litigation, insider_trading,
    # earnings_call, investor_meetings, credit_rating, dividend, bonus_split,
    # capex, press_release, postal_ballot, agm_egm, pledging, unclassified
    category = Column(String(50), index=True, nullable=False, default="unclassified")
    
    # Priority level: Critical, High, Medium, Low
    priority = Column(String(20), index=True, nullable=False, default="Medium")
    
    document_url = Column(String(500), nullable=True)
    summary = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    
    # JSON field storing structured financial extractions or executive bio
    # For results: {"revenue": 24000, "ebitda": 5800, "pbt": 4200, "pat": 3100, "qoq_growth": 4.2, "yoy_growth": 12.5}
    # For management_change: {"person_name": "...", "role": "...", "incoming_outgoing": "...", "bio": "...", "pedigree": "..."}
    extracted_data = Column(JSON, nullable=True)
    
    is_routine = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(30), index=True, nullable=False)
    company_name = Column(String(200), nullable=False)
    alert_type = Column(String(50), nullable=False) # "announcement" | "price_shock" | "volume_spike"
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(20), default="High")   # Critical, High, Medium, Low
    category = Column(String(50), nullable=True)
    threshold_info = Column(String(200), nullable=True)
    is_read = Column(Boolean, default=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)

class AlertThresholdConfig(Base):
    __tablename__ = "alert_threshold_configs"

    id = Column(Integer, primary_key=True, index=True)
    price_movement_threshold_pct = Column(Float, default=5.0)     # ±5%
    volume_spike_threshold_multiplier = Column(Float, default=2.0) # 2.0x 20d average
    monitored_categories = Column(JSON, default=list)             # ['results', 'M&A', 'management_change', ...]
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PrimarySourceDocument(Base):
    __tablename__ = "primary_source_documents"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(30), index=True, nullable=False)
    company_name = Column(String(200), nullable=False)
    doc_type = Column(String(50), nullable=False) # "annual_report" | "concall_transcript" | "quarterly_results"
    period = Column(String(50), nullable=False)   # e.g. "FY24", "Q2-FY25"
    title = Column(String(300), nullable=False)
    source_url = Column(String(500), nullable=True)
    content_raw = Column(Text, nullable=False)
    filing_date = Column(DateTime, default=datetime.utcnow)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("primary_source_documents.id"), nullable=False)
    ticker = Column(String(30), index=True, nullable=False)
    section_name = Column(String(200), default="General")
    page_number = Column(String(50), default="Page 1")
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    
    document = relationship("PrimarySourceDocument", back_populates="chunks")

