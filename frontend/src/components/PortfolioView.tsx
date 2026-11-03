import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Sparkles, 
  ChevronRight, 
  PieChart as PieIcon,
  Activity,
  AlertCircle,
  RefreshCw,
  ServerCrash
} from 'lucide-react';
import { PortfolioSummary, PortfolioItem, ExecutiveBriefing } from '../types';

interface PortfolioViewProps {
  summary: PortfolioSummary | null;
  briefing: ExecutiveBriefing | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectStock: (ticker: string) => void;
  onOpenAddModal: () => void;
  onRemoveStock: (ticker: string) => void;
  onTriggerResearch: (ticker: string) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  summary,
  briefing,
  isLoading,
  error,
  onRetry,
  onSelectStock,
  onOpenAddModal,
  onRemoveStock,
  onTriggerResearch
}) => {
  const [showBriefingDetails, setShowBriefingDetails] = useState(true);

  // 1. Loading Skeleton State
  if (isLoading && !summary) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-[#0d1424] border border-slate-800 rounded-2xl p-5">
          <div className="h-4 w-48 bg-slate-800 rounded mb-3"></div>
          <div className="h-8 w-64 bg-slate-700/60 rounded mb-3"></div>
          <div className="h-4 w-36 bg-slate-800 rounded"></div>
        </div>
        <div className="h-28 bg-[#0d1424] border border-slate-800 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-[#0d1424] border border-slate-800/80 rounded-xl p-3.5">
              <div className="h-4 w-20 bg-slate-800 rounded mb-2"></div>
              <div className="h-3 w-32 bg-slate-800/60 rounded mb-4"></div>
              <div className="h-6 w-full bg-slate-800/40 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State (No endless skeleton!)
  if (error && !summary) {
    return (
      <div className="p-8 rounded-3xl bg-[#0d1424] border border-rose-500/30 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <ServerCrash className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="font-bold text-base text-white">Backend Connection Error</h3>
          <p className="text-xs text-rose-300/90 mt-1 leading-relaxed font-mono">
            {error}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Please ensure the FINN FastAPI backend server is running on <code className="text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">http://127.0.0.1:8000</code>.
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    );
  }

  // 3. Fallback if summary is somehow empty
  if (!summary) {
    return null;
  }

  const isNetPositive = summary.daily_change_pct >= 0;

  return (
    <div className="space-y-5">
      {/* 1. Portfolio Net Value & P&L Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111c33] via-[#0d1527] to-[#090e1a] border border-slate-800 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
              <span>PORTFOLIO VALUATION & PERFORMANCE</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                {summary.holdings_count} Companies
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                NSE Benchmark
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              ₹{summary.total_market_value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span
                className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isNetPositive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {isNetPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                {isNetPositive ? '+' : ''}{summary.daily_change_pct.toFixed(2)}% (₹{Math.abs(summary.daily_change_value).toLocaleString('en-IN')})
              </span>
              <span className="text-[11px] text-slate-400">Daily Trajectory</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock</span>
            </button>
            {onRetry && (
              <button
                onClick={onRetry}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
                title="Refresh portfolio prices"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sector Allocation distribution ribbon */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1.5">
              <PieIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-slate-300">Sector Allocation</span>
            </span>
            <span className="text-[11px] text-slate-400">{summary.sectors.length} Industry Pillars</span>
          </div>

          {/* Color bar */}
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            {summary.sectors.map((sec, i) => {
              const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-teal-400', 'bg-rose-400', 'bg-indigo-400', 'bg-cyan-400'];
              return (
                <div
                  key={sec.sector}
                  style={{ width: `${Math.max(sec.weight_pct, 1)}%` }}
                  className={`h-full ${colors[i % colors.length]}`}
                  title={`${sec.sector}: ${sec.weight_pct}% (₹${sec.total_value.toLocaleString('en-IN')})`}
                />
              );
            })}
          </div>

          {/* Sector tags */}
          <div className="flex flex-wrap gap-2 mt-2.5">
            {summary.sectors.slice(0, 6).map((sec) => (
              <span key={sec.sector} className="text-[11px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                <span className="text-slate-200 font-medium">{sec.sector}:</span> {sec.weight_pct}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. AI Executive Morning Briefing */}
      {briefing && (
        <div className="rounded-2xl bg-[#0f172a]/90 border border-emerald-500/30 p-4.5 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-white">Daily Intelligence Briefing</h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                    {briefing.date}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 font-medium leading-relaxed">
                  {briefing.headline}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBriefingDetails(!showBriefingDetails)}
              className="text-xs text-slate-400 hover:text-slate-200 underline font-medium ml-2 shrink-0"
            >
              {showBriefingDetails ? 'Collapse' : 'Details'}
            </button>
          </div>

          {showBriefingDetails && (
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-2">
              {briefing.key_takeaways.map((takeaway, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span className="leading-snug">{takeaway}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Watchlist Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-base text-white">Monitored Portfolio Companies</h2>
            <span className="text-xs text-slate-400">({summary.items.length})</span>
          </div>
          <span className="text-xs text-slate-400">Tap card for OHLCV & Volatility</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {summary.items.map((item) => {
            const isPos = (item.daily_change_pct || 0) >= 0;
            return (
              <div
                key={item.ticker}
                onClick={() => onSelectStock(item.ticker)}
                className="group relative rounded-xl bg-[#0d1424] hover:bg-[#111a30] border border-slate-800 hover:border-slate-700/80 p-3.5 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                        {item.ticker}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate">
                        {item.sector}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.name}
                    </p>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <div className="font-mono font-bold text-sm text-white">
                      ₹{(item.current_price || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`font-mono text-xs font-semibold flex items-center justify-end ${
                        isPos ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPos ? '+' : ''}{(item.daily_change_pct || 0).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Activity className="w-3 h-3 text-slate-500" />
                    <span>Holdings: {item.shares_held} sh</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTriggerResearch(item.ticker);
                      }}
                      className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                    >
                      AI Research
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveStock(item.ticker);
                      }}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                      title="Remove from portfolio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
