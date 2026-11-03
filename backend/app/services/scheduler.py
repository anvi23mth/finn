import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from app.services.alert_service import AlertService

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()

def scheduled_market_check():
    """Background task running every 5 minutes to audit market alerts."""
    db = SessionLocal()
    try:
        AlertService.evaluate_market_alerts(db)
    except Exception as e:
        logger.error(f"Error in background market alert evaluation: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(scheduled_market_check, "interval", minutes=5, id="market_alert_check", replace_existing=True)
        scheduler.start()
        logger.info("APScheduler initialized for background financial surveillance.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shut down cleanly.")

