import React, { useState } from 'react';
import { 
  TrendingUp, 
  Layers, 
  Bell, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  Briefcase, 
  Clock,
  Compass
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'portfolio' | 'digest' | 'alerts' | 'research';
  setActiveTab: (tab: 'portfolio' | 'digest' | 'alerts' | 'research') => void;
  unreadAlertCount: number;
  onSearchClick: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  unreadAlertCount,
  onSearchClick
}) => {
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Left Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0d1424] border-r border-slate-800/80 p-5 shrink-0">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-950/40">
            F
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold tracking-tight text-lg text-white">FINN</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">ENAM Holdings Intelligence</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'portfolio'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Portfolio & Watchlist</span>
          </button>

          <button
            onClick={() => setActiveTab('digest')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'digest'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Layers className="w-4 h-4" />
              <span>Windowed Digest</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">
              Push
            </span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'alerts'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Bell className="w-4 h-4" />
              <span>Surveillance Alerts</span>
            </div>
            {unreadAlertCount > 0 && (
              <span className="text-[11px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">
                {unreadAlertCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'research'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="w-4 h-4" />
              <span>AI Research & RAG</span>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded-full font-mono">
              Pull
            </span>
          </button>
        </nav>

        {/* Surveillance status pill */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/70 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-medium mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Surveillance Active</span>
          </div>
          <p className="text-[11px] text-slate-400">18 Core Portfolio Stocks & Filings</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {/* Mobile / Universal Top Header */}
        <header className="sticky top-0 z-30 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black text-xs shadow-md">
              F
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white">FINN</span>
              <span className="text-[10px] text-emerald-400 font-mono ml-1.5">v1.0</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>NSE/BSE Feeds Active</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onSearchClick}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs text-slate-300 transition-all shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search any NSE ticker...</span>
              <kbd className="hidden sm:inline-block text-[10px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-mono">⌘K</kbd>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className="relative p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadAlertCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Dynamic View Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d1424]/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-around pb-safe">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-all ${
            activeTab === 'portfolio' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] mt-1">Portfolio</span>
        </button>

        <button
          onClick={() => setActiveTab('digest')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-all ${
            activeTab === 'digest' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-1">Digest</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`relative flex flex-col items-center py-1 px-2.5 rounded-lg transition-all ${
            activeTab === 'alerts' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Bell className="w-5 h-5" />
          {unreadAlertCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
          )}
          <span className="text-[10px] mt-1">Alerts</span>
        </button>

        <button
          onClick={() => setActiveTab('research')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-all ${
            activeTab === 'research' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-1">Research</span>
        </button>
      </div>
    </div>
  );
};

