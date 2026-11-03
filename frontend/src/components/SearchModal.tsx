import React, { useState, useEffect } from 'react';
import { Search, X, Plus, TrendingUp, Check } from 'lucide-react';
import { api } from '../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuccess: () => void;
  onSelectStock: (ticker: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onAddSuccess,
  onSelectStock
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedTickers, setAddedTickers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (query.trim().length >= 1) {
        setIsSearching(true);
        try {
          const res = await api.searchStocks(query);
          setResults(res);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleAddStock = async (ticker: string) => {
    try {
      await api.addPortfolioItem(ticker);
      setAddedTickers((prev) => new Set(prev).add(ticker));
      onAddSuccess();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#0d1424] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800/80 flex items-center space-x-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any NSE stock (e.g. RELIANCE, TCS, ZOMATO, BEL)..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg border border-slate-800">
            Esc
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-3 space-y-1.5">
          {isSearching ? (
            <div className="text-center py-8 text-xs text-slate-500 animate-pulse">
              Searching NSE listings...
            </div>
          ) : results.length > 0 ? (
            results.map((item) => {
              const isAdded = addedTickers.has(item.ticker);
              return (
                <div
                  key={item.ticker}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/40 transition-all"
                >
                  <div
                    onClick={() => {
                      onClose();
                      onSelectStock(item.ticker);
                    }}
                    className="cursor-pointer min-w-0 flex-1 mr-3"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{item.ticker}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {item.sector}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{item.name}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAddStock(item.ticker)}
                      disabled={isAdded}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-black shadow active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Portfolio</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-400 mb-2">Ticker &ldquo;{query.toUpperCase()}&rdquo; ready for lookup.</p>
              <button
                onClick={() => handleAddStock(query.toUpperCase())}
                className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {query.toUpperCase()} to Portfolio</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              Type at least 1 character to search Indian stocks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

