from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import PrimarySourceDocument
from app.schemas.schemas import ResearchModuleRequest, ResearchResponse
from app.services.research_service import ResearchService
from app.services.rag_service import RAGService

router = APIRouter(prefix="/research", tags=["AI Document Intelligence (RAG)"])

@router.post("/module", response_model=ResearchResponse)
def execute_research_module(payload: ResearchModuleRequest, db: Session = Depends(get_db)):
    """
    On-demand AI Research grounded strictly in primary sources (Annual Reports + Concall Transcripts):
    Supports 8 institutional modules:
    1. business_snapshot
    2. financial_snapshot
    3. trajectory
    4. balance_sheet
    5. cash_quality
    6. narrative_vs_numbers (4-quarter guidance vs delivered audit)
    7. guidance
    8. bull_vs_bear
    Or any custom natural language investor question (e.g. 'Analyse Reliance Industries', 'Explain margin changes').
    """
    clean_ticker = payload.ticker.strip().upper().replace(".NS", "").replace(".BO", "")
    
    response = ResearchService.execute_research_module(
        ticker=clean_ticker,
        module_type=payload.module_type,
        custom_query=payload.custom_query,
        db=db
    )
    return response

@router.get("/{ticker}/documents")
def get_primary_documents(ticker: str, db: Session = Depends(get_db)):
    """
    Returns verified primary source documents available for the ticker.
    """
    clean_ticker = ticker.strip().upper().replace(".NS", "").replace(".BO", "")
    docs = RAGService.get_or_seed_primary_sources(clean_ticker, db)
    return [
        {
            "id": d.id,
            "ticker": d.ticker,
            "company_name": d.company_name,
            "doc_type": d.doc_type,
            "period": d.period,
            "title": d.title,
            "source_url": d.source_url,
            "filing_date": d.filing_date
        }
        for d in docs
    ]

