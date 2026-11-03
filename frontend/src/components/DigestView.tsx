import React, { useState } from 'react';
import { 
  Filter, 
  ExternalLink, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  TrendingUp, 
  FileText, 
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  ServerCrash
} from 'lucide-react';
import { AnnouncementDigest, Announcement } from '../types';

interface DigestViewProps {
  digest: AnnouncementDigest | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  selectedWindow: '24h' | '3d' | '7d' | 'custom';
  onSelectWindow: (w: '24h' | '3d' | '7d' | 'custom') => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onTriggerResearch: (ticker: string) => void;
}

const CATEGORIES = [
  'all',
  'results',
  'M&A',
  'management_change',
  'fund_raise',
  'capex',
  'litigation',
  'credit_rating',
  'dividend',
  'bonus_split',
  'insider_trading',
  'pledging',
  'press_release'
];

export const DigestView: React.FC<DigestViewProps> = ({
  digest,
  isLoading,
  error,
  onRetry,
  selectedWindow,
  onSelectWindow,
  selectedCategory,
  onSelectCategory,
  onTriggerResearch
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'high' | 'routine'>('all');
  const [expandedRoutine, setExpandedRoutine] = useState(false);

  // 1. Loading Skeleton
  if (isLoading && !digest) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 bg-slate-800/50 rounded-xl"></div>
        <div className="h-48 bg-slate-800/40 rounded-xl"></div>
        <div className="h-48 bg-slate-800/40 rounded-xl"></div>
      </div>
    );
  }

  // 2. Error State
  if (error && !digest) {
    return (
      <div className="p-8 rounded-3xl bg-[#0d1424] border border-rose-500/30 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <ServerCrash className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="font-bold text-base text-white">Digest Ingestion Error</h3>
          <p className="text-xs text-rose-300/90 mt-1 leading-relaxed font-mono">
            {error}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Digest Feed</span>
          </button>
        )}
      </div>
    );
  }

  if (!digest) return null;

  let displayedMaterial = digest.material_announcements;
  if (activeFilter === 'critical') {
    displayedMaterial = displayedMaterial.filter(a => a.priority === 'Critical');
  } else if (activeFilter === 'high') {
    displayedMaterial = displayedMaterial.filter(a => a.priority === 'High');
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Window Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Corporate Announcements Digest</h1>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
              Surveillance Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Surfacing material disclosures across portfolio, collapsing low-relevance statutory filings.
          </p>
        </div>

        {/* Time Window Buttons */}
        <div className="flex items-center bg-[#0d1424] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {(['24h', '3d', '7d'] as const).map((w) => (
            <button
              key={w}
              onClick={() => onSelectWindow(w)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedWindow === w
                  ? 'bg-emerald-500 text-black shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {w === '24h' ? '24 Hours' : w === '3d' ? '3 Days' : '7 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Category Chips Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-slate-200 text-slate-900 font-bold'
                : 'bg-[#0d1424] text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat === 'all' ? 'All Categories' : cat.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* 3. Priority Summary Filter Ribbon */}
      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Material Feed ({displayedMaterial.length})
          </button>
          <button
            onClick={() => setActiveFilter('critical')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeFilter === 'critical'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Critical ({digest.critical_count})
          </button>
          <button
            onClick={() => setActiveFilter('high')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeFilter === 'high'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            High Priority ({digest.high_count})
          </button>
        </div>

        <div className="text-slate-400 text-[11px] hidden sm:block">
          {digest.routine_collapsed_count} Routine items collapsed
        </div>
      </div>

      {/* 4. Material Announcements List */}
      <div className="space-y-4">
        {displayedMaterial.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-[#0d1424] border border-slate-800">
            <p className="text-slate-400 text-sm">No material announcements found matching filters in this window.</p>
          </div>
        ) : (
          displayedMaterial.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl bg-[#0d1424] border border-slate-800/90 hover:border-slate-700 p-4.5 transition-all shadow-md"
            >
              {/* Header: Ticker, Category, Priority, Time */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-white tracking-tight">
                    {ann.ticker}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs font-semibold text-slate-300">
                    {ann.company_name}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getPriorityBadge(ann.priority)}`}>
                    {ann.priority}
                  </span>
                  <span className="text-[10px] font-medium bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 uppercase">
                    {ann.category.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] bg-slate-900/80 text-amber-400/90 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                    DEMO SEED DATA
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{new Date(ann.filing_datetime).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                {ann.title}
              </h3>

              {/* AI Summary */}
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {ann.summary}
              </p>

              {/* Special Extraction 1: Quarterly Results Matrix */}
              {ann.results_data && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
                    <span>Quarterly Headline Numbers Extracted</span>
                    <span className="text-[10px] font-mono text-slate-400">Figures in ₹ Crore (Audited)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-[#090d16] border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-medium">Revenue</div>
                      <div className="font-mono font-bold text-xs text-white mt-0.5">
                        ₹{ann.results_data.revenue_cr.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">
                        {ann.results_data.revenue_yoy_pct ? `+${ann.results_data.revenue_yoy_pct}% YoY` : ''}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#090d16] border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-medium">EBITDA</div>
                      <div className="font-mono font-bold text-xs text-white mt-0.5">
                        ₹{ann.results_data.ebitda_cr.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ann.results_data.ebitda_margin_pct ? `${ann.results_data.ebitda_margin_pct}% Margin` : ''}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#090d16] border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-medium">PBT</div>
                      <div className="font-mono font-bold text-xs text-white mt-0.5">
                        ₹{ann.results_data.pbt_cr.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Pre-Tax</div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#090d16] border border-slate-800">
                      <div className="text-[10px] text-slate-400 font-medium">PAT (Net Profit)</div>
                      <div className="font-mono font-bold text-xs text-white mt-0.5">
                        ₹{ann.results_data.pat_cr.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">
                        {ann.results_data.pat_yoy_pct ? `+${ann.results_data.pat_yoy_pct}% YoY` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Extraction 2: Management Bio Card */}
              {ann.management_bio && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-blue-500/20">
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 mb-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Executive Pedigree & Background</span>
                  </div>
                  <div className="text-xs text-slate-200">
                    <span className="font-bold text-white">{ann.management_bio.person_name}</span> — {ann.management_bio.role}
                  </div>
                  {ann.management_bio.previous_experience && (
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      <span className="text-slate-400 font-medium">Previous Role:</span> {ann.management_bio.previous_experience}
                    </p>
                  )}
                  {ann.management_bio.pedigree_summary && (
                    <p className="text-[11px] text-blue-300/90 mt-1 italic">
                      💡 {ann.management_bio.pedigree_summary}
                    </p>
                  )}
                </div>
              )}

              {/* Why This Matters to Investors */}
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Why Investors Care:
                  </span>
                  <p className="text-xs text-emerald-200/90 leading-relaxed mt-0.5">
                    {ann.why_it_matters}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <button
                  onClick={() => onTriggerResearch(ann.ticker)}
                  className="text-emerald-400 hover:text-emerald-300 font-medium text-[11px] flex items-center space-x-1"
                >
                  <span>Analyse {ann.ticker} in RAG Copilot</span>
                  <span>→</span>
                </button>

                {ann.document_url && (
                  <a
                    href={ann.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-200 flex items-center space-x-1 text-[11px]"
                  >
                    <span>View Official Filing PDF</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Collapsible Routine Paperwork Section */}
      {digest.routine_announcements.length > 0 && (
        <div className="rounded-2xl bg-[#0d1424]/60 border border-slate-800/60 p-4">
          <button
            onClick={() => setExpandedRoutine(!expandedRoutine)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="font-semibold">
                Routine Compliance Paperwork ({digest.routine_announcements.length} collapsed)
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-slate-500">
              <span>{expandedRoutine ? 'Hide Routine' : 'Expand'}</span>
              {expandedRoutine ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {expandedRoutine && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
              {digest.routine_announcements.map((rout) => (
                <div key={rout.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/40 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span className="font-bold text-slate-300">{rout.ticker}</span>
                    <span>{new Date(rout.filing_datetime).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-300">{rout.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
