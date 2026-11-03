import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import Announcement, Alert

# The 17 canonical announcement categories from ENAM Build Challenge Reference
ANNOUNCEMENT_CATEGORIES = [
    "results",
    "M&A",
    "fund_raise",
    "management_change",
    "litigation",
    "insider_trading",
    "earnings_call",
    "investor_meetings",
    "credit_rating",
    "dividend",
    "bonus_split",
    "capex",
    "press_release",
    "postal_ballot",
    "agm_egm",
    "pledging",
    "unclassified"
]

CATEGORY_MATERIALITY_DEFAULTS = {
    "results": "High",
    "M&A": "Critical",
    "management_change": "Critical",
    "litigation": "Critical",
    "fund_raise": "High",
    "credit_rating": "High",
    "capex": "High",
    "dividend": "Medium",
    "bonus_split": "Medium",
    "insider_trading": "High",
    "pledging": "High",
    "press_release": "Medium",
    "earnings_call": "Medium",
    "investor_meetings": "Low",
    "postal_ballot": "Low",
    "agm_egm": "Low",
    "unclassified": "Low"
}

class AnnouncementService:
    @classmethod
    def classify_announcement(cls, title: str, content: str = "") -> Tuple[str, str, bool]:
        """
        Classifies corporate filings into the 17 categories and assigns materiality priority:
        Critical, High, Medium, Low.
        Returns: (category, priority, is_routine)
        """
        text = f"{title} {content}".lower()

        # Rules for classification based on exchange filing syntax
        if any(w in text for w in ["financial results", "quarterly results", "un-audited results", "audited results", "q1 results", "q2 results", "q3 results", "q4 results"]):
            category = "results"
            priority = "Critical" if any(w in text for w in ["loss", "exceptional item", "profit jump", "surprise"]) else "High"
            is_routine = False
        elif any(w in text for w in ["acquisition", "merger", "amalgamation", "demerger", "joint venture", "jv", "slump sale", "stake purchase"]):
            category = "M&A"
            priority = "Critical"
            is_routine = False
        elif any(w in text for w in ["resignation", "appointment", "superannuation", "chief executive", "chief financial", "ceo", "cfo", "managing director", "director appointment", "key managerial"]):
            category = "management_change"
            priority = "Critical" if any(w in text for w in ["ceo", "cfo", "managing director", "resignation", "resigned"]) else "High"
            is_routine = False
        elif any(w in text for w in ["litigation", "court", "arbitration", "nclt", "penalty", "show cause", "notice from sebi", "fine imposed", "tax demand"]):
            category = "litigation"
            priority = "Critical"
            is_routine = False
        elif any(w in text for w in ["qip", "rights issue", "preferential allotment", "commercial paper", "ncd", "fund raise", "raising of funds", "buyback"]):
            category = "fund_raise"
            priority = "High"
            is_routine = False
        elif any(w in text for w in ["credit rating", "crisil", "icra", "care ratings", "fitch", "rating upgrade", "rating downgrade"]):
            category = "credit_rating"
            priority = "Critical" if "downgrade" in text else "High"
            is_routine = False
        elif any(w in text for w in ["capex", "capacity expansion", "new manufacturing facility", "greenfield", "brownfield plant"]):
            category = "capex"
            priority = "High"
            is_routine = False
        elif any(w in text for w in ["dividend", "interim dividend", "final dividend", "special dividend", "record date for dividend"]):
            category = "dividend"
            priority = "Medium"
            is_routine = False
        elif any(w in text for w in ["bonus issue", "stock split", "sub-division of shares"]):
            category = "bonus_split"
            priority = "Medium"
            is_routine = False
        elif any(w in text for w in ["insider trading", "regulation 7(2)", "sast", "pit regulation", "promoter acquisition of shares"]):
            category = "insider_trading"
            priority = "High"
            is_routine = False
        elif any(w in text for w in ["pledge", "encumbrance", "release of pledge", "creation of pledge"]):
            category = "pledging"
            priority = "High"
            is_routine = False
        elif any(w in text for w in ["concall transcript", "audio recording", "earnings conference call", "analysts call"]):
            category = "earnings_call"
            priority = "Medium"
            is_routine = False
        elif any(w in text for w in ["investor meet", "analyst meet", "investor presentation", "morgan stanley conference", "citigroup summit"]):
            category = "investor_meetings"
            priority = "Low"
            is_routine = True
        elif any(w in text for w in ["postal ballot", "remote e-voting", "scrutinizer's report"]):
            category = "postal_ballot"
            priority = "Low"
            is_routine = True
        elif any(w in text for w in ["annual general meeting", "extraordinary general meeting", "agm notice", "egm notice"]):
            category = "agm_egm"
            priority = "Low"
            is_routine = True
        elif any(w in text for w in ["press release", "media release", "order win", "strategic partnership", "mou signed"]):
            category = "press_release"
            priority = "Medium"
            is_routine = False
        else:
            category = "unclassified"
            priority = "Low"
            is_routine = True

        return category, priority, is_routine

    @classmethod
    def get_windowed_digest(
        cls,
        db: Session,
        window: str = "24h",
        custom_start: Optional[datetime] = None,
        custom_end: Optional[datetime] = None,
        selected_tickers: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Returns announcements across portfolio grouped by window with routine items collapsed.
        Supported windows: '24h', '3d', '7d', 'custom'
        """
        now = datetime.utcnow()
        if window == "24h":
            start_date = now - timedelta(hours=24)
        elif window == "3d":
            start_date = now - timedelta(days=3)
        elif window == "7d":
            start_date = now - timedelta(days=7)
        elif window == "custom" and custom_start:
            start_date = custom_start
        else:
            start_date = now - timedelta(days=7) # Default to 7d to ensure rich demonstration data

        end_date = custom_end if custom_end else now

        query = db.query(Announcement).filter(
            Announcement.filing_datetime >= start_date,
            Announcement.filing_datetime <= end_date
        )

        if selected_tickers:
            query = query.filter(Announcement.ticker.in_(selected_tickers))

        # Sort by filing date descending
        all_announcements = query.order_by(Announcement.filing_datetime.desc()).all()

        material = []
        routine = []

        critical_count = 0
        high_count = 0

        for ann in all_announcements:
            if ann.priority == "Critical":
                critical_count += 1
            elif ann.priority == "High":
                high_count += 1

            # Routine items (unclassified, agm notices, postal ballot, small investor meetings)
            if ann.is_routine or ann.priority == "Low":
                routine.append(ann)
            else:
                material.append(ann)

        return {
            "window": window,
            "start_date": start_date,
            "end_date": end_date,
            "total_count": len(all_announcements),
            "critical_count": critical_count,
            "high_count": high_count,
            "routine_collapsed_count": len(routine),
            "material_announcements": material,
            "routine_announcements": routine
        }

    @classmethod
    def seed_initial_announcements(cls, db: Session):
        """
        Pre-seeds high-signal, realistic corporate announcements for the 18 portfolio stocks
        spanning 24h, 3d, and 7d time windows with actual quarterly results breakdowns and executive bios.
        """
        if db.query(Announcement).count() > 0:
            return

        now = datetime.utcnow()

        seed_data = [
            # 1. Critical Management Change with LinkedIn / Pedigree Bio (within last 6 hours)
            {
                "ticker": "TATAMOTORS",
                "company_name": "Tata Motors Ltd.",
                "title": "Appointment of Dr. Stefan Weckbach as Chief Executive Officer of Jaguar Land Rover & Executive Director",
                "filing_datetime": now - timedelta(hours=3),
                "category": "management_change",
                "priority": "Critical",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/tatamotors_ceo_app.pdf",
                "summary": "Tata Motors board approves appointment of Dr. Stefan Weckbach as CEO of JLR and Executive Director of Tata Motors.",
                "why_it_matters": "High-conviction leadership turnaround for JLR EV division. Dr. Weckbach previously headed Porsche's Taycan EV program and oversaw Porsche Boxster/Cayman development. Accelerates JLR's £15B Reimagine electrification plan.",
                "is_routine": False,
                "extracted_data": {
                    "management_bio": {
                        "person_name": "Dr. Stefan Weckbach",
                        "role": "CEO (JLR) & Executive Director",
                        "nature_of_change": "Appointment",
                        "previous_experience": "Head of Product Strategy & Taycan EV Platform at Porsche AG; 15+ years in Volkswagen Group automotive leadership.",
                        "education": "Ph.D. in Business Administration, University of St. Gallen, Switzerland.",
                        "pedigree_summary": "Architect of Porsche's most successful luxury EV line; expected to resolve JLR's software architecture bottlenecks."
                    }
                }
            },

            # 2. Critical Quarterly Results with Headline Numbers & QoQ / YoY (within last 12 hours)
            {
                "ticker": "RELIANCE",
                "company_name": "Reliance Industries Ltd.",
                "title": "Outcome of Board Meeting: Unaudited Financial Results for Q2 FY25",
                "filing_datetime": now - timedelta(hours=8),
                "category": "results",
                "priority": "Critical",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/reliance_q2fy25.pdf",
                "summary": "Consolidated Q2 Net Profit reaches ₹19,324 Cr (+11.4% YoY) led by Retail footfall growth and 5G subscriber monetisation in Jio Platforms.",
                "why_it_matters": "Operating cash conversion expanded to 91%. Retail EBITDA margins expanded 80 bps to 8.8%. Oil-to-Chemicals (O2C) downstream margins stabilized despite volatile Singapore GRMs.",
                "is_routine": False,
                "extracted_data": {
                    "results_data": {
                        "revenue_cr": 235481.0,
                        "ebitda_cr": 43934.0,
                        "pbt_cr": 26820.0,
                        "pat_cr": 19324.0,
                        "revenue_qoq_pct": 2.1,
                        "revenue_yoy_pct": 9.8,
                        "ebitda_margin_pct": 18.66,
                        "pat_qoq_pct": 4.5,
                        "pat_yoy_pct": 11.4
                    }
                }
            },

            # 3. Critical M&A (within last 18 hours)
            {
                "ticker": "SUNPHARMA",
                "company_name": "Sun Pharmaceutical Industries Ltd.",
                "title": "Execution of Definitive Agreement to Acquire US Specialty Dermatological Biotech Checkpoint Therapeutics for $570 Million",
                "filing_datetime": now - timedelta(hours=16),
                "category": "M&A",
                "priority": "Critical",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/sunpharma_checkpoint_acquisition.pdf",
                "summary": "Sun Pharma acquires 100% equity in Nasdaq-listed Checkpoint Therapeutics to bolster its global oncology and dermatology pipeline.",
                "why_it_matters": "Adds FDA-reviewed cutaneous squamous cell carcinoma therapy Cosibelimab to Sun's high-margin global specialty portfolio, diversifying away from generic pricing pressure.",
                "is_routine": False,
                "extracted_data": None
            },

            # 4. High Quarterly Results with QoQ / YoY (within last 24 hours)
            {
                "ticker": "TCS",
                "company_name": "Tata Consultancy Services Ltd.",
                "title": "Audited Standalone and Consolidated Financial Results for the Quarter Ended September 30, 2026",
                "filing_datetime": now - timedelta(hours=22),
                "category": "results",
                "priority": "High",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/tcs_q2_results.pdf",
                "summary": "TCS delivers Q2 Revenue of ₹64,259 Cr (+7.6% YoY) with Operating Margins standing resilient at 24.1%. Deal TCV secured at $10.0 Billion.",
                "why_it_matters": "BFSI vertical in North America staged a positive inflection (+2.1% QoQ constant currency). Record TCV order book provides clear multi-quarter revenue visibility.",
                "is_routine": False,
                "extracted_data": {
                    "results_data": {
                        "revenue_cr": 64259.0,
                        "ebitda_cr": 17285.0,
                        "pbt_cr": 16210.0,
                        "pat_cr": 11909.0,
                        "revenue_qoq_pct": 2.6,
                        "revenue_yoy_pct": 7.6,
                        "ebitda_margin_pct": 26.9,
                        "pat_qoq_pct": 3.8,
                        "pat_yoy_pct": 5.0
                    }
                }
            },

            # 5. High Fund Raise (within 2 days)
            {
                "ticker": "HDFCBANK",
                "company_name": "HDFC Bank Ltd.",
                "title": "Board Approves Issuance of Long Term Infrastructure Bonds aggregating up to ₹15,000 Crore",
                "filing_datetime": now - timedelta(days=2),
                "category": "fund_raise",
                "priority": "High",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/hdfcbank_bond_raise.pdf",
                "summary": "HDFC Bank board approves private placement of Tier II and Infrastructure bonds up to ₹15,000 Cr to support credit expansion.",
                "why_it_matters": "Exempt from CRR and SLR reserve requirements; lowers bank's blended cost of long-term funding and supports sustained 14-15% loan book growth.",
                "is_routine": False,
                "extracted_data": None
            },

            # 6. High Capex Approval (within 2.5 days)
            {
                "ticker": "LT",
                "company_name": "Larsen & Toubro Ltd.",
                "title": "Approval of ₹8,200 Crore Capex for Electrolyser & Green Hydrogen Gigafactory in Hazira",
                "filing_datetime": now - timedelta(days=2, hours=10),
                "category": "capex",
                "priority": "High",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/lt_green_hydrogen_capex.pdf",
                "summary": "L&T board sanctions phase-2 commercial scaling of its high-efficiency pressurized alkaline electrolyser manufacturing hub.",
                "why_it_matters": "Directly positions L&T to capture India's National Green Hydrogen Mission tenders with indigenous equipment, expanding high-margin manufacturing revenue.",
                "is_routine": False,
                "extracted_data": None
            },

            # 7. Critical Litigation / Regulatory Update (within 3 days)
            {
                "ticker": "BHARTIARTL",
                "company_name": "Bharti Airtel Ltd.",
                "title": "Supreme Court Curative Petition Filing on AGR Dues and Computational Rectification",
                "filing_datetime": now - timedelta(days=3),
                "category": "litigation",
                "priority": "Critical",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/bharti_agr_petition.pdf",
                "summary": "Airtel files supplementary affidavit requesting hearing on clerical arithmetic errors in Department of Telecommunications AGR demands.",
                "why_it_matters": "Potential cash-flow relief of up to ₹12,000 Cr if computational errors are remitted for re-assessment, substantially accelerating free cash flow accretion.",
                "is_routine": False,
                "extracted_data": None
            },

            # 8. High Credit Rating Upgrade (within 4 days)
            {
                "ticker": "ICICIBANK",
                "company_name": "ICICI Bank Ltd.",
                "title": "S&P Global Ratings Upgrades Long-Term Issuer Credit Rating to 'BBB' with Stable Outlook",
                "filing_datetime": now - timedelta(days=4),
                "category": "credit_rating",
                "priority": "High",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/icici_rating_upgrade.pdf",
                "summary": "S&P Global raises ICICI Bank rating to BBB from BBB- on systemic asset quality resilience and robust capital adequacy ratio of 16.8%.",
                "why_it_matters": "Reduces offshore borrowing cost for ICICI Bank's GIFT City and international syndication units by ~18-25 bps.",
                "is_routine": False,
                "extracted_data": None
            },

            # 9. Quarterly Results for Banking (within 5 days)
            {
                "ticker": "ICICIBANK",
                "company_name": "ICICI Bank Ltd.",
                "title": "Financial Results for the Quarter and Half Year ended September 30, 2026",
                "filing_datetime": now - timedelta(days=5),
                "category": "results",
                "priority": "High",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/icici_q2_results.pdf",
                "summary": "Net Profit rises 14.5% YoY to ₹11,746 Cr. Net Interest Margin (NIM) stands strong at 4.27% with Net NPA at historical low of 0.42%.",
                "why_it_matters": "Best-in-class return on equity (RoE) of 18.9% with pristine asset quality; domestic loan growth driven by retail and SME portfolios.",
                "is_routine": False,
                "extracted_data": {
                    "results_data": {
                        "revenue_cr": 40537.0,
                        "ebitda_cr": 16043.0,
                        "pbt_cr": 15480.0,
                        "pat_cr": 11746.0,
                        "revenue_qoq_pct": 3.4,
                        "revenue_yoy_pct": 16.2,
                        "ebitda_margin_pct": 39.5,
                        "pat_qoq_pct": 6.2,
                        "pat_yoy_pct": 14.5
                    }
                }
            },

            # 10. Management Change - CFO Appointment (within 5.5 days)
            {
                "ticker": "INFY",
                "company_name": "Infosys Ltd.",
                "title": "Appointment of Mr. Jayesh Sanghrajka as Chief Financial Officer",
                "filing_datetime": now - timedelta(days=5, hours=14),
                "category": "management_change",
                "priority": "Critical",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/infy_cfo_appointment.pdf",
                "summary": "Board approves elevation of long-time internal finance veteran Jayesh Sanghrajka to CFO position.",
                "why_it_matters": "Seamless leadership continuity; Sanghrajka spent 18+ years at Infosys as Deputy CFO, removing capital allocation uncertainty.",
                "is_routine": False,
                "extracted_data": {
                    "management_bio": {
                        "person_name": "Jayesh Sanghrajka",
                        "role": "Chief Financial Officer",
                        "nature_of_change": "Appointment",
                        "previous_experience": "18+ years at Infosys as Executive VP and Deputy CFO; prior tenure at KPMG and Mu Sigma.",
                        "education": "Chartered Accountant (Rank Holder), Institute of Chartered Accountants of India (ICAI).",
                        "pedigree_summary": "Extensive institutional familiarity, trusted by global enterprise clients and international institutional investors."
                    }
                }
            },

            # 11. Dividend Announcement (within 6 days)
            {
                "ticker": "ITC",
                "company_name": "ITC Ltd.",
                "title": "Declaration of Interim Dividend of ₹6.25 per Ordinary Share of ₹1 each",
                "filing_datetime": now - timedelta(days=6),
                "category": "dividend",
                "priority": "Medium",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/itc_dividend.pdf",
                "summary": "ITC board declares interim dividend of ₹6.25 per share; record date fixed as November 14.",
                "why_it_matters": "Reinforces ITC's high shareholder payout policy (>80% free cash flow conversion); annualised dividend yield remains above 3.4%.",
                "is_routine": False,
                "extracted_data": None
            },

            # Routine Filings (to show filtering and collapsing)
            {
                "ticker": "RELIANCE",
                "company_name": "Reliance Industries Ltd.",
                "title": "Compliance Certificate under Regulation 74(5) of SEBI (DP) Regulations for Quarter ended Sep 30",
                "filing_datetime": now - timedelta(hours=5),
                "category": "unclassified",
                "priority": "Low",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/reliance_reg74.pdf",
                "summary": "Routine quarterly confirmation from registrar KFin Technologies regarding dematerialisation of physical shares.",
                "why_it_matters": "Standard procedural compliance paperwork. Zero market or operational impact.",
                "is_routine": True,
                "extracted_data": None
            },
            {
                "ticker": "TCS",
                "company_name": "Tata Consultancy Services Ltd.",
                "title": "Schedule of Analyst / Institutional Investor Meet with Fidelity Investments",
                "filing_datetime": now - timedelta(hours=14),
                "category": "investor_meetings",
                "priority": "Low",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/tcs_fidelity_meet.pdf",
                "summary": "Notification of 1-on-1 virtual institutional investor discussion with Fidelity Management.",
                "why_it_matters": "Routine investor relations engagement. No unpublished price sensitive information (UPSI) shared.",
                "is_routine": True,
                "extracted_data": None
            },
            {
                "ticker": "HDFCBANK",
                "company_name": "HDFC Bank Ltd.",
                "title": "Postal Ballot Notice for Approval of Employee Stock Option Scheme (ESOP 2026)",
                "filing_datetime": now - timedelta(days=1, hours=6),
                "category": "postal_ballot",
                "priority": "Low",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/hdfc_postal_ballot.pdf",
                "summary": "Notice to shareholders seeking approval via electronic voting for grant of options under employee incentive plan.",
                "why_it_matters": "Routine governance agenda item; expected dilution is negligible (<0.15% of equity base).",
                "is_routine": True,
                "extracted_data": None
            },
            {
                "ticker": "INFY",
                "company_name": "Infosys Ltd.",
                "title": "Notice of Postal Ballot and Voting Results on Appointment of Independent Director",
                "filing_datetime": now - timedelta(days=3, hours=8),
                "category": "agm_egm",
                "priority": "Low",
                "document_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/infy_voting_results.pdf",
                "summary": "Shareholders approve re-appointment of Independent Director with 99.4% majority.",
                "why_it_matters": "Routine statutory compliance. No impact on business operations.",
                "is_routine": True,
                "extracted_data": None
            }
        ]

        for item in seed_data:
            ann = Announcement(**item)
            db.add(ann)

        db.commit()

