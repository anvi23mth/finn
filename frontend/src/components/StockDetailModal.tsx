import React from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Sparkles, 
  BarChart2, 
  Calendar,
  Layers,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';
import { StockDetail } from '../types';

interface StockDetailModalProps {
  stockDetail: StockDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerResearch: (ticker: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stockDetail,
  isOpen,
  onClose,
  onTriggerResearch
}) => {
  if (!isOpen || !stockDetail) return null;

  const snap = stockDetail.snapshot;
  const isPos = snap.pct_change >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#0d1424] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-white text-sm">
              {snap.ticker.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{snap.ticker}</h2>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {snap.sector}
                </span>
                {stockDetail.is_in_portfolio && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    <span>In Portfolio</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{snap.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Price & Change */}
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
                ₹{snap.current_price != null ? snap.current_price.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`flex items-center text-xs font-bold font-mono px-2 py-0.5 rounded ${
                    isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {isPos ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                  {isPos ? '+' : ''}{snap.pct_change != null ? snap.pct_change.toFixed(2) : '—'}% (₹{snap.change != null ? snap.change.toFixed(2) : '—'})
                </span>
                <span className="text-[11px] text-slate-400">vs prev close ₹{snap.previous_close}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onTriggerResearch(snap.ticker);
              }}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run RAG Research</span>
            </button>
          </div>

          {/* 30-Day Historical Price Trend Chart */}
          <div className="p-4 rounded-2xl bg-[#090d16] border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300">30-Day Daily Closing Trajectory</span>
              <span className="font-mono text-[10px]">yfinance NSE (.NS)</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockDetail.history_30d}>
                  <defs>
                    <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                    formatter={(val: any) => [`₹${val}`, 'Close']}
                  />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorClose)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Core Technical & Volume Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-medium">Day Range</div>
              <div className="font-mono text-xs font-bold text-white mt-1">
                ₹{snap.day_low} - ₹{snap.day_high}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-medium">Today&apos;s Volume</div>
              <div className="font-mono text-xs font-bold text-white mt-1">
                {(snap.volume / 1000000).toFixed(2)}M shares
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-medium">20-Day Avg Volume</div>
              <div className="font-mono text-xs font-bold text-white mt-1">
                {(snap.avg_vol_20d / 1000000).toFixed(2)}M shares
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-medium">Volume Spike Ratio</div>
              <div className={`font-mono text-xs font-bold mt-1 ${snap.volume_spike_ratio >= 2.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {snap.volume_spike_ratio}x normal
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-medium">20-Day Volatility (Ann.)</div>
              <div className="font-mono text-xs font-bold text-white mt-1">
                {snap.volatility_20d}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-medium">Market Capitalisation</div>
              <div className="font-mono text-xs font-bold text-white mt-1">
                ₹{snap.market_cap != null ? snap.market_cap.toLocaleString('en-IN') : '—'} Cr
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

