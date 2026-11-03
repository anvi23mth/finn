# COVERING EMAIL & PROJECT WRITEUP

**To:** `assessment@enam.com`
**Subject:** `ENAM - IIT screening - 2027`
**Project:** FINN – Financial Investment Agent
**Candidate Name:** Anvi Gupta

---

Dear ENAM Holdings Investment & Engineering Team,

Please find below my submission for the **ENAM Holdings AI Engineer Build Challenge: FINN (Financial Investment Agent)**.

---

## 1. What I Built

I engineered **FINN**, a mobile-first financial intelligence application tailored for high-conviction public-markets investors. Rather than building a generic stock ticker dashboard or an ungrounded chatbot, FINN was architected around the core insight stated in your brief: **the scarce skill in public markets is filtering information—surfacing what truly moves intrinsic business value and burying routine compliance noise.**

FINN delivers on the two core workflows specified in the challenge:

### A. PUSH – Proactive Surveillance Layer
- **Windowed Digest (24h, 3d, 7d, Custom):** Automatically classifies corporate exchange filings into the **17 canonical categories** defined in the Reference Document and scores them by materiality (`Critical`, `High`, `Medium`, `Low`).
- **Routine Noise Collapsing:** Procedural statutory disclosures (e.g. Regulation 74(5) demat notices, ESOP postal ballots, routine AGM filings) are cleanly collapsed into a background drawer, keeping the investor's focus exclusively on material developments.
- **Specialized Presentation:**
  - **Quarterly Results:** Extracts headline metrics (**Revenue, EBITDA, PBT, PAT**), computes **QoQ and YoY % growth**, and calculates **EBITDA margins**.
  - **Management Changes:** Pulls the incoming executive's pedigree (e.g. Dr. Stefan Weckbach from Porsche heading JLR, Jayesh Sanghrajka at Infosys) including educational background and strategic significance.
  - **Why Investors Care:** Every material filing includes a crisp, thesis-driven rationale.
- **Triggered Market Surveillance:** Automated background surveillance (via APScheduler) checks for daily price moves exceeding configurable $\pm X\%$ (default $\pm 5\%$) and trading volume surges exceeding $K \times$ the 20-day historical average (default $2.0\times$).

### B. PULL – Primary-Grounded AI Research Copilot
- Supports the **17 core portfolio companies** across Banking, IT, Energy, Auto, FMCG, Pharma, and Capital Goods, plus **arbitrary NSE ticker lookup**.
- Provides **8 Institutional Research Views**:
  1. *Business Snapshot* (segments, revenue mix)
  2. *Financial Snapshot* (current headline numbers, margins, capital efficiency)
  3. *Trajectory* (what is growing vs. what is compressing)
  4. *Balance Sheet* (debt, net debt/EBITDA, working-capital cycle)
  5. *Cash Quality* (cash conversion: CFO/EBITDA ratio, free cash flow)
  6. *Narrative vs. Numbers (Worked Example)*: 4-quarter audit tracking management guidance against actual deliveries, graded as *Exceeded*, *Met*, or *Missed*.
  7. *Guidance Tracker* (forward commitments on revenue, margins, and capex)
  8. *Bull vs. Bear Case* (3 institutional thesis points vs. 3 key risks)
- **Strict Primary Source Discipline:** Grounded entirely in Annual Reports, Quarterly Results, and Concall Transcripts. **No broker notes, no news articles, and no hallucinated secondary commentary.** Every analysis features verbatim quotes and document citations.

---

## 2. Key Architectural Decisions & Trade-Offs

1. **Mobile-First UX Over Desktop Density:**
   *Decision:* Mobile ergonomics was treated as a first-class citizen with fixed bottom navigation docks, thumb-friendly tap targets, and clean dark-mode financial contrast (inspired by Bloomberg/Koyfin).
   *Trade-off:* Multi-window charting panels were prioritized for clean single-screen cards on phones, ensuring zero horizontal scroll fatigue.

2. **Deterministic Financial Parsing vs. Unconstrained LLM Generation:**
   *Decision:* For headline quarterly numbers (Revenue, EBITDA, PBT, PAT) and volume spike ratios, I built deterministic calculation pipelines rather than relying solely on raw LLM token outputs.
   *Trade-off:* Requires explicit JSON schema normalization, but eliminates mathematical hallucination.

3. **Primary Data Purity on PULL vs. Enrichment on PUSH:**
   *Decision:* Strictly enforced the brief's guideline: PULL research uses primary filings exclusively (ARs and concalls). Conversely, PUSH items are enriched with contextual intelligence (e.g., executive career pedigree and LinkedIn-style background).

4. **Offline Resilience & Benchmark Grounding:**
   *Decision:* yfinance provides live NSE pricing (`.NS`), but the system incorporates a verified benchmark fallback layer and local vector indexing. If exchange scrapers face rate limits or an API key is omitted, the entire application continues running smoothly with zero crashes.

---

## 3. What Was Deliberately Left Out

- **Broker Research & News Commentary:** Deliberately excluded Sell-Side consensus target prices and news feeds. As highlighted in your brief, secondary commentary introduces noise; high-conviction decisions require primary ground truth.
- **Over-engineered Microservice Sprawl:** Avoided multi-container Kubernetes overhead. Built a fast, monolithic FastAPI backend and Next.js frontend with SQLite/PostgreSQL support that starts in seconds with `./start.sh`.
- **Complex Chatbot Personas:** FINN does not engage in generic small talk. It delivers concise financial tables, bullet points, and source citations.

---

## 4. Where I Would Take This Next

1. **Audio Concall Tone & Hesitation Analysis:**
   Processing the raw MP3 recordings of earnings calls to detect changes in vocal pitch, pauses, and speech cadence when management answers analyst questions regarding margin compression or debt covenants.
2. **SEBI Insider Trading Pattern Graph:**
   A temporal graph visualizing promoter pledging alongside Form C insider transactions (Regulation 7(2)) to flag creeping promoter divestments ahead of quarterly results.
3. **Automated Segment Demerger SOTP Calculator:**
   Dynamic sum-of-the-parts (SOTP) valuation modeler for conglomerates undergoing demergers (e.g., Tata Motors CV/PV split, ITC Hotels demerger).

---

## 5. Repository & Submission Links

- **Working Prototype Local Port:** `http://localhost:3000` (Backend API at `http://localhost:8000`)
- **Single-command Launch:** `./start.sh`
- **Documentation & Architecture:** `README.md` and `docs/`

Thank you for this challenge. I enjoyed building FINN and would welcome the opportunity to discuss the architecture with the investment and engineering team at ENAM Holdings.

Sincerely,
**Anvi Gupta**
*ENAM - IIT screening - 2027*

