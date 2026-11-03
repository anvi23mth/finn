# FINN: Financial Investment Agent
### Built for ENAM Holdings AI Engineer Build Challenge
**Subject Line:** `ENAM - IIT screening - 2027` | **Submission Email:** `assessment@enam.com`

---

## ⚡ Executive Overview

**FINN (Financial Investment Agent)** is a production-quality, mobile-first financial intelligence platform engineered for public-markets investors.

Modern investors are drowning in exchange filings, price noise, and secondary commentary. The scarce skill in modern public-markets investing is not information aggregation—it is **intelligent filtering: surfacing the few developments that move intrinsic value, burying routine statutory noise, and explaining precisely why they matter to high-conviction decision-makers.**

FINN operates in two interaction modes:
1. **PUSH (Proactive Financial Intelligence):** A continuous surveillance layer monitoring portfolio holdings for material corporate actions (quarterly earnings surprises, cross-border M&A, executive leadership changes, litigation) and market anomalies (volume surges > 2x 20d average, price moves > ±5%).
2. **PULL (On-Demand Primary Source Research Copilot):** An institutional RAG research engine grounded strictly in primary sources (Annual Reports, Quarterly Results filings, and Concall Transcripts). **Zero broker notes, zero news articles, and zero AI slop.**

---

## 📱 Mobile-First Design & Interaction Model

FINN was conceived from day one as a mobile-native instrument that a portfolio manager reaches for throughout the trading day on a smartphone:
- **Ergonomic One-Handed Navigation:** Fixed bottom navigation dock (`Portfolio`, `Digest`, `Alerts`, `Research`) positioned within natural thumb reach.
- **Density Over Decoration:** Clean typography with high data density (Bloomberg / Koyfin aesthetic with deep slate palettes, emerald profit accents, and rose risk flags).
- **Collapsible Statutory Paperwork:** High-priority items (CEO resignations, Q2 earnings beats) are prominently highlighted with extracted financial matrices and executive career bios, while routine compliance certificates (ESOP allotments, Regulation 74(5) paperwork) are automatically collapsed into an expandable drawer.
- **Universal Search (⌘K):** Instant modal search across any NSE-listed stock symbol.

---

## 🏗️ Architecture & Technical Stack

```
+-------------------------------------------------------------------------+
|                              FINN PLATFORM                              |
+-------------------------------------------------------------------------+
                                     |
          +--------------------------+--------------------------+
          |                                                     |
          v                                                     v
   [PUSH SURVEILLANCE]                                  [PULL RESEARCH]
+------------------------+                           +--------------------+
| 1. Windowed Digest     |                           | 1. Business Snapshot
|    - 24h / 3d / 7d     |                           | 2. Financial Snap
|    - 17 Category Class |                           | 3. Trajectory
|    - Critical/High Pri |                           | 4. Balance Sheet
| 2. Anomaly Triggers    |                           | 5. Cash Quality
|    - Price Shock (±5%) |                           | 6. Narrative vs Num
|    - Vol Spike (>2x)   |                           | 7. Guidance Tracker
| 3. Extraction Engines  |                           | 8. Bull vs Bear
|    - Results: QoQ/YoY  |                           +--------------------+
|    - Mgmt Bio: Pedigree|                                      |
+------------------------+                           +--------------------+
          |                                          | Primary Source RAG
          +--------------------------+               | (ARs + Concalls)
                                     |               | No Broker Notes
                                     v               +--------------------+
                       +---------------------------+
                       | FastAPI + SQLite / pgSQL  |
                       | APScheduler Background    |
                       | yfinance NSE Live Feed    |
                       +---------------------------+
                                     |
                                     v
                       +---------------------------+
                       | Next.js + React + TS      |
                       | Tailwind CSS + Recharts   |
                       | Mobile Bottom Navigation  |
                       +---------------------------+
```

### Frontend
- **Framework:** Next.js (React 18, TypeScript)
- **Styling:** Tailwind CSS with custom institutional dark mode theme
- **Charts:** Recharts (Area charts for 30-day closing trajectories, Bar charts for volume distribution)
- **Icons:** Lucide React

### Backend & AI
- **Framework:** Python 3.11, FastAPI, Pydantic v2
- **Database:** SQLAlchemy ORM with SQLite (PostgreSQL compatible for cloud deployment)
- **Surveillance Scheduler:** APScheduler (5-minute automated polling intervals for price moves, volume surges, and corporate filings)
- **Market Data Engine:** `yfinance` accessing NSE tickers via the `.NS` suffix with 20-day average volume, volume spike ratio, daily return %, and 20-day annualized volatility calculations.
- **RAG & Vector Search:** Granular section chunking across Annual Reports and Concall Transcripts with TF-IDF/BM25 and Google Gemini API integration (with deterministic primary-source extraction fallback).

---

## 🧩 Core Functional Modules

### MODULE 1: Portfolio Dashboard
- **17 Demonstration Companies** across 7 sectors:
  - **Banking:** HDFCBANK, ICICIBANK, SBIN
  - **IT:** TCS, INFY, WIPRO
  - **Energy:** RELIANCE, ONGC
  - **Automobile:** TATAMOTORS, MARUTI
  - **FMCG:** ITC, HINDUNILVR
  - **Pharma:** SUNPHARMA, DRREDDY
  - **Others:** LT, TITAN, BHARTIARTL
- Portfolio valuation, daily P&L (₹ and %), sector allocation visualizer.
- Dynamic watchlist: add/remove any valid NSE ticker with real-time price updates.
- **AI Morning Executive Briefing:** Synthesizes overnight disclosures and leadership announcements before market open.

### MODULE 2: Stock Data Engine
- Live and EOD price fetching via `yfinance`.
- Calculations implemented:
  - $\text{Daily Return \%} = \frac{\text{Close} - \text{Prev Close}}{\text{Prev Close}} \times 100$
  - $\text{20-Day Average Volume} = \frac{1}{20} \sum_{i=1}^{20} \text{Volume}_i$
  - $\text{Volume Spike Ratio} = \frac{\text{Today's Volume}}{\text{20-Day Average Volume}}$
  - $\text{20-Day Annualized Volatility} = \sigma_{\text{daily}} \times \sqrt{252} \times 100$
- 30-day historical OHLCV candles for interactive charting.

### MODULE 3: Corporate Announcement Engine
- Classifies exchange filings into the **17 canonical categories** specified in the ENAM Challenge Reference:
  1. `results`
  2. `M&A`
  3. `fund_raise`
  4. `management_change`
  5. `litigation`
  6. `insider_trading`
  7. `earnings_call`
  8. `investor_meetings`
  9. `credit_rating`
  10. `dividend`
  11. `bonus_split`
  12. `capex`
  13. `press_release`
  14. `postal_ballot`
  15. `agm_egm`
  16. `pledging`
  17. `unclassified`
- **Materiality Scoring:** Categorizes filings into `Critical`, `High`, `Medium`, and `Low`.
- **Specialized Presentation:**
  - **Quarterly Results:** Extracts **Revenue, EBITDA, PBT, PAT**, calculates QoQ and YoY growth %, and computes EBITDA margin %.
  - **Management Changes:** Pulls executive pedigree (e.g. Dr. Stefan Weckbach from Porsche heading JLR, Jayesh Sanghrajka at Infosys) including previous employers, qualifications, and strategic significance.
  - **Why Investors Care:** 1-2 sentence thesis explaining the operational/financial impact of the filing.

### MODULE 4: Intelligent PUSH Alerts
- **Announcement-Based Alerts:** Fires on critical filings (M&A, results surprises, leadership shakeups, litigation).
- **Market-Based Alerts:** Fires when daily price moves cross configurable $\pm X\%$ (default $\pm 5\%$) or trading volume exceeds $K \times$ the 20-day average (default $2.0\times$).
- **Configurable Thresholds:** Interactive sliders allow the investor to calibrate anomaly sensitivity.
- **Windowed Digest:** Filter by `Last 24 Hours`, `Last 3 Days`, `Last 7 Days`, or custom date range.

### MODULE 5: Primary-Grounded AI Research Copilot (PULL)
The research copilot grounds every analysis in primary disclosures. It offers **8 Institutional Research Views**:
1. **Business Snapshot:** Segments, core products, and revenue mix %.
2. **Financial Snapshot:** Headline numbers, margins, PAT, and capital efficiency ratios.
3. **Trajectory:** Multi-year trend analysis—what is accelerating vs. what is compressing.
4. **Balance Sheet:** Debt profile, net debt/EBITDA, leverage, and working-capital cycle.
5. **Cash Quality:** Cash conversion (Operating Cash Flow / EBITDA ratio), Free Cash Flow trend.
6. **Narrative vs. Numbers (Worked Example from Brief):** A 4-quarter audit comparing management's forward promises against actual reported deliveries (graded as *Exceeded*, *Met*, or *Missed*).
7. **Guidance Tracker:** Stated management targets for revenue growth, margins, and capex envelopes.
8. **Bull vs. Bear Case:** Three institutional arguments for long thesis vs. three key operational risks.
- **Verbatim Citations:** Every analysis provides source badges with document title, fiscal period, section name, and excerpt quotes.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js v18+ and npm
- Python 3.11+

### 1. Launch with Single Command
```bash
./start.sh
```
This automatically boots:
- FastAPI Backend: `http://127.0.0.1:8000` (API Docs at `http://127.0.0.1:8000/docs`)
- Next.js Web Application: `http://localhost:3000`

### 2. Manual Execution

**Backend:**
```bash
cd backend
python run.py
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🔒 Security & Primary Source Integrity
- Environment variables (`.env`) for secrets; credentials are never committed.
- Strict isolation of secondary commentary: the RAG research engine parses only verified primary documents (Annual Reports, Quarterly Results, Earnings Call Transcripts).

