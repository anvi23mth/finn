import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.models import PortfolioItem
from app.services.announcement_service import AnnouncementService
from app.services.alert_service import AlertService
from app.services.scheduler import start_scheduler, shutdown_scheduler

from app.api.portfolio import router as portfolio_router
from app.api.stocks import router as stocks_router
from app.api.announcements import router as announcements_router
from app.api.alerts import router as alerts_router
from app.api.research import router as research_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def seed_database():
    """Initializes tables and populates default 17 portfolio companies and announcements."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed default portfolio
        if db.query(PortfolioItem).count() == 0:
            logger.info("Seeding default portfolio of 17 NSE companies across sectors...")
            for item in settings.DEFAULT_PORTFOLIO:
                # Assign initial holding shares and cost basis for demonstration
                p_item = PortfolioItem(
                    ticker=item["ticker"],
                    name=item["name"],
                    sector=item["sector"],
                    shares_held=100.0,
                    avg_buy_price=0.0, # Will be synced with market close
                    is_active=True
                )
                db.add(p_item)
            db.commit()

        # Seed corporate announcements and alerts
        AnnouncementService.seed_initial_announcements(db)
        AlertService.seed_initial_alerts(db)
        AlertService.get_or_create_config(db)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    seed_database()
    start_scheduler()
    yield
    # Shutdown
    shutdown_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="FINN – Mobile-first Financial Investment Agent for ENAM Holdings",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(portfolio_router, prefix=settings.API_V1_STR)
app.include_router(stocks_router, prefix=settings.API_V1_STR)
app.include_router(announcements_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(research_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "portfolio": f"{settings.API_V1_STR}/portfolio/summary",
            "digest": f"{settings.API_V1_STR}/announcements/digest",
            "alerts": f"{settings.API_V1_STR}/alerts",
            "research": f"{settings.API_V1_STR}/research/module"
        }
    }

