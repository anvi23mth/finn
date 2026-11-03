import os
from pydantic_settings import BaseSettings
from typing import List, Dict

class Settings(BaseSettings):
    PROJECT_NAME: str = "FINN – Financial Investment Agent"
    VERSION: str = "1.0.0"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "*")
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/finn.db")
    
    # AI / LLM Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # Alert defaults as required by ENAM specification
    DEFAULT_PRICE_THRESHOLD_PCT: float = 5.0   # ±5% intraday / daily price change
    DEFAULT_VOLUME_THRESHOLD_MULT: float = 2.0 # 2.0x the 20-day average volume
    
    # Demonstration Portfolio of 17 Core NSE-listed companies across sectors
    DEFAULT_PORTFOLIO: List[Dict[str, str]] = [
        {"ticker": "HDFCBANK", "name": "HDFC Bank Ltd.", "sector": "Banking"},
        {"ticker": "ICICIBANK", "name": "ICICI Bank Ltd.", "sector": "Banking"},
        {"ticker": "SBIN", "name": "State Bank of India", "sector": "Banking"},
        {"ticker": "TCS", "name": "Tata Consultancy Services Ltd.", "sector": "IT"},
        {"ticker": "INFY", "name": "Infosys Ltd.", "sector": "IT"},
        {"ticker": "WIPRO", "name": "Wipro Ltd.", "sector": "IT"},
        {"ticker": "RELIANCE", "name": "Reliance Industries Ltd.", "sector": "Energy"},
        {"ticker": "ONGC", "name": "Oil & Natural Gas Corporation Ltd.", "sector": "Energy"},
        {"ticker": "TATAMOTORS", "name": "Tata Motors Ltd.", "sector": "Automobile"},
        {"ticker": "MARUTI", "name": "Maruti Suzuki India Ltd.", "sector": "Automobile"},
        {"ticker": "ITC", "name": "ITC Ltd.", "sector": "FMCG"},
        {"ticker": "HINDUNILVR", "name": "Hindustan Unilever Ltd.", "sector": "FMCG"},
        {"ticker": "SUNPHARMA", "name": "Sun Pharmaceutical Industries Ltd.", "sector": "Pharma"},
        {"ticker": "DRREDDY", "name": "Dr. Reddy's Laboratories Ltd.", "sector": "Pharma"},
        {"ticker": "LT", "name": "Larsen & Toubro Ltd.", "sector": "Capital Goods"},
        {"ticker": "TITAN", "name": "Titan Company Ltd.", "sector": "Consumer Discretionary"},
        {"ticker": "BHARTIARTL", "name": "Bharti Airtel Ltd.", "sector": "Telecom"}
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

