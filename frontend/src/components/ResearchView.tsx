import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  FileText, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Award, 
  BarChart3, 
  PieChart, 
  Layers, 
  Scale, 
  ShieldCheck,
  TrendingUp,
  Quote,
  RefreshCw,
  ServerCrash
} from 'lucide-react';
import { ResearchResponse, SourceCitation } from '../types';

interface ResearchViewProps {
  currentTicker: string;
  onTickerChange: (ticker: string) => void;
  researchResult: ResearchResponse | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onExecuteModule: (moduleType: string, customQuery?: string) => void;
}

const MODULES = [
  { id: 'business_snapshot', label: '1. Business Snapshot', icon: PieChart, desc: 'Segments & revenue architecture' },
  { id: 'financial_snapshot', label: '2. Financial Snapshot', icon: BarChart3, desc: 'Headline figures, margins & ratios' },
  { id: 'trajectory', label: '3. Trajectory', icon: TrendingUp, desc: 'What is growing vs compressing' },
  { id: 'balance_sheet', label: '4. Balance Sheet', icon: Scale, desc: 'Debt, leverage & working capital' },
  { id: 'cash_quality', label: '5. Cash Quality', icon: Award, desc: 'Cash conversion & FCF trend' },
  { id: 'narrative_vs_numbers', label: '6. Narrative vs Numbers', icon: Layers, desc: 'Guidance vs delivery audit (4Q)' },
  { id: 'guidance', label: '7. Guidance Tracker', icon: BookOpen, desc: 'Explicit management commitments' },
  { id: 'bull_vs_bear', label: '8. Bull vs Bear Case', icon: ShieldCheck, desc: 'High-conviction institutional cases' },
];

export const ResearchView: React.FC<ResearchViewProps> = ({
  currentTicker,
  onTickerChange,
  researchResult,
  isLoading,
  error,
  onRetry,
  onExecuteModule
}) => {
  const [customInput, setCustomInput] = useState('');
  const [activeModule, setActiveModule] = useState('narrative_vs_numbers');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onExecuteModule('custom', customInput);
  };

  const handleModuleClick = (modId: string) => {
    setActiveModule(modId);
    onExecuteModule(modId);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Ticker Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">AI Fundamental Research Copilot</h1>
            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
              PULL Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Grounded strictly in primary sources (Annual Reports + Concall Transcripts). Zero broker notes, zero AI slop.
          </p>
        </div>

        {/* Target Ticker Selector */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400 font-medium">Research Target:</span>
          <div className="flex items-center space-x-1 bg-[#0d1424] p-1 rounded-xl border border-slate-800">
            {['RELIANCE', 'TCS', 'TATAMOTORS', 'HDFCBANK', 'INFY'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  onTickerChange(t);
                  onExecuteModule(activeModule);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                  currentTicker === t
                    ? 'bg-emerald-500 text-black shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Custom Prompt Input Bar */}
      <form onSubmit={handleCustomSubmit} className="relative">
        <div className="flex items-center bg-[#0d1424] border border-slate-800 focus-within:border-emerald-500/60 rounded-2xl p-1.5 shadow-lg transition-all">
          <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={`Ask anything about ${currentTicker} (e.g. "Explain margin changes", "Is management delivering?", "Major risks?")...`}
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !customInput.trim()}
            className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-black font-semibold transition-all active:scale-95 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* 3. The 8 Institutional Research Modules Menu */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Institutional Research Modules
          </span>
          <span className="text-[11px] text-slate-500">Pick any module to execute audit</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isSelected = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => handleModuleClick(mod.id)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-white shadow-md'
                    : 'bg-[#0d1424] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="font-bold text-xs">{mod.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">{mod.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Research Output Canvas */}
      {isLoading ? (
        <div className="p-8 rounded-2xl bg-[#0d1424] border border-slate-800 text-center space-y-3 animate-pulse">
          <Sparkles className="w-8 h-8 text-emerald-400 mx-auto animate-spin" />
          <p className="text-sm font-semibold text-slate-200">Retrieving Primary Source Filings & Transcripts...</p>
          <p className="text-xs text-slate-500">Parsing Annual Reports, MD&A sections, and Earnings Call quotes</p>
        </div>
      ) : error && !researchResult ? (
        <div className="p-8 rounded-2xl bg-[#0d1424] border border-rose-500/30 text-center space-y-3 shadow-md">
          <ServerCrash className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Research Retrieval Failed</h3>
          <p className="text-xs text-rose-300 font-mono">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center space-x-2 bg-emerald-500 text-black font-bold text-xs px-4 py-2 rounded-xl mt-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Research</span>
            </button>
          )}
        </div>
      ) : researchResult ? (
        <div className="space-y-4">
          {/* Main Analysis Card */}
          <div className="rounded-2xl bg-[#0d1424] border border-slate-800 p-5 shadow-lg space-y-4">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base text-white tracking-tight">
                    {researchResult.ticker}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs font-semibold text-slate-300">
                    {researchResult.company_name}
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/20">
                    Primary Data Only
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-1">
                  {researchResult.title}
                </h2>
              </div>
            </div>

            {/* Key Metrics Chips */}
            {researchResult.key_metrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {researchResult.key_metrics.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-medium">{m.label}</div>
                    <div className="font-mono font-bold text-sm text-white mt-0.5">{m.value}</div>
                    {m.change && (
                      <div className="text-[10px] text-emerald-400 mt-0.5">{m.change}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Executive Summary */}
            <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-slate-200 leading-relaxed font-medium">
              💡 {researchResult.executive_summary}
            </div>

            {/* Special Matrix: Narrative vs Numbers (Worked Example from PDF!) */}
            {researchResult.narrative_table && researchResult.narrative_table.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                    4-Quarter Management Guidance vs. Delivery Audit
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">Audited from Concalls & Results</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Quarter</th>
                        <th className="py-2.5 px-3">Stated Guidance / Promise</th>
                        <th className="py-2.5 px-3">Actual Reported Delivery</th>
                        <th className="py-2.5 px-3">Outcome</th>
                        <th className="py-2.5 px-3">Institutional Analysis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-[#0d1424]">
                      {researchResult.narrative_table.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                            {row.quarter}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 leading-relaxed">
                            {row.management_guidance}
                          </td>
                          <td className="py-2.5 px-3 text-slate-200 leading-relaxed font-medium">
                            {row.actual_delivered}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              row.outcome === 'Exceeded'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : row.outcome === 'Met'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}>
                              {row.outcome}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 leading-relaxed text-[11px]">
                            {row.analysis}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Markdown Content */}
            <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed space-y-3 pt-2">
              <div dangerouslySetInnerHTML={{ __html: formatMarkdown(researchResult.content_markdown) }} />
            </div>
          </div>

          {/* 5. Primary Source Grounding Citations */}
          {researchResult.citations.length > 0 && (
            <div className="rounded-2xl bg-[#090e1a] border border-emerald-500/30 p-4 space-y-3 shadow-md">
              <div className="flex items-center space-x-2">
                <Quote className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs text-white uppercase tracking-wider">
                  Primary Source Citations & Verbatim Proof ({researchResult.citations.length})
                </h3>
              </div>

              <div className="space-y-2">
                {researchResult.citations.map((cite, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#0d1424] border border-slate-800 text-xs">
                    <div className="flex flex-wrap items-center justify-between text-[11px] mb-1 gap-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-emerald-400">{cite.source_title}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 font-mono">{cite.period}</span>
                      </div>
                      <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                        {cite.section}
                      </span>
                    </div>
                    <blockquote className="italic text-slate-300 border-l-2 border-emerald-500/50 pl-2.5 mt-1 text-[11px]">
                      &ldquo;{cite.quote}&rdquo;
                    </blockquote>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

function formatMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-white mt-4 mb-1.5">$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300 my-0.5">$1</li>')
    .replace(/\n\n/gim, '<br />');
}
