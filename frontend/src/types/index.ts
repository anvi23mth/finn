export interface PortfolioItem {
  id: number;
  ticker: string;
  name: string;
  sector: string;
  shares_held: number;
  avg_buy_price: number;
  is_active: boolean;
  current_price: number;
  daily_change_pct: number;
  market_value: number;
  unrealized_pnl: number;
  created_at: string;
}

export interface SectorAllocation {
  sector: string;
  count: number;
  weight_pct: number;
  total_value: number;
}

export interface PortfolioSummary {
  total_market_value: number;
  total_invested: number;
  total_gain_loss: number;
  total_gain_loss_pct: number;
  daily_change_value: number;
  daily_change_pct: number;
  holdings_count: number;
  sectors: SectorAllocation[];
  items: PortfolioItem[];
}

export interface StockSnapshot {
  ticker: string;
  name: string;
  sector: string;
  current_price: number;
  previous_close: number;
  change: number;
  pct_change: number;
  open_price: number;
  day_high: number;
  day_low: number;
  volume: number;
  avg_vol_20d: number;
  volume_spike_ratio: number;
  volatility_20d: number;
  market_cap: number;
  pe_ratio?: number;
  last_updated: string;
}

export interface HistoryDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  daily_return_pct?: number;
}

export interface StockDetail {
  snapshot: StockSnapshot;
  history_30d: HistoryDataPoint[];
  is_in_portfolio: boolean;
}

export interface QuarterlyResultsBreakdown {
  revenue_cr: number;
  ebitda_cr: number;
  pbt_cr: number;
  pat_cr: number;
  revenue_qoq_pct?: number;
  revenue_yoy_pct?: number;
  ebitda_margin_pct?: number;
  pat_qoq_pct?: number;
  pat_yoy_pct?: number;
}

export interface ManagementBio {
  person_name: string;
  role: string;
  nature_of_change: string;
  previous_experience?: string;
  education?: string;
  pedigree_summary?: string;
}

export interface Announcement {
  id: number;
  ticker: string;
  company_name: string;
  title: string;
  filing_datetime: string;
  category: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  document_url?: string;
  summary: string;
  why_it_matters: string;
  is_routine: boolean;
  results_data?: QuarterlyResultsBreakdown;
  management_bio?: ManagementBio;
}

export interface AnnouncementDigest {
  window: "24h" | "3d" | "7d" | "custom";
  start_date: string;
  end_date: string;
  total_count: number;
  critical_count: number;
  high_count: number;
  routine_collapsed_count: number;
  material_announcements: Announcement[];
  routine_announcements: Announcement[];
}

export interface AlertItem {
  id: number;
  ticker: string;
  company_name: string;
  alert_type: "announcement" | "price_shock" | "volume_spike";
  title: string;
  message: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  category?: string;
  threshold_info?: string;
  is_read: boolean;
  triggered_at: string;
}

export interface AlertConfig {
  price_movement_threshold_pct: number;
  volume_spike_threshold_multiplier: number;
  monitored_categories: string[];
}

export interface SourceCitation {
  source_title: string;
  doc_type: string;
  period: string;
  section: string;
  page_number?: string;
  quote: string;
}

export interface MetricItem {
  label: string;
  value: string;
  change?: string;
  sentiment?: "positive" | "negative" | "neutral";
}

export interface NarrativeVsNumbersDelivery {
  quarter: string;
  management_guidance: string;
  actual_delivered: string;
  outcome: "Exceeded" | "Met" | "Missed";
  analysis: string;
}

export interface ResearchResponse {
  ticker: string;
  company_name: string;
  module_type: string;
  title: string;
  executive_summary: string;
  content_markdown: string;
  key_metrics: MetricItem[];
  citations: SourceCitation[];
  narrative_table?: NarrativeVsNumbersDelivery[];
  grounded_in_primary_only: boolean;
}

export interface ExecutiveBriefing {
  date: string;
  market_sentiment: string;
  headline: string;
  key_takeaways: string[];
  top_announcements_count: number;
  unresolved_alerts_count: number;
}

