import React, { useState } from 'react';
import { 
  Bell, 
  TrendingUp, 
  Sliders, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  SlidersHorizontal,
  Flame,
  ServerCrash
} from 'lucide-react';
import { AlertItem, AlertConfig } from '../types';

interface AlertsViewProps {
  alerts: AlertItem[];
  config: AlertConfig | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onUpdateConfig: (config: Partial<AlertConfig>) => void;
  onMarkRead: (id: number) => void;
  onRunScan: () => void;
  onTriggerResearch: (ticker: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  config,
  isLoading,
  error,
  onRetry,
  onUpdateConfig,
  onMarkRead,
  onRunScan,
  onTriggerResearch
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [priceThresh, setPriceThresh] = useState<number>(config?.price_movement_threshold_pct || 5.0);
  const [volThresh, setVolThresh] = useState<number>(config?.volume_spike_threshold_multiplier || 2.0);

  const handleSaveThresholds = () => {
    onUpdateConfig({
      price_movement_threshold_pct: priceThresh,
      volume_spike_threshold_multiplier: volThresh
    });
    setShowConfig(false);
  };

  // Error State
  if (error && alerts.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-[#0d1424] border border-rose-500/30 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <ServerCrash className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="font-bold text-base text-white">Alerts Surveillance Service Error</h3>
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
            <span>Retry Alerts</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Active Surveillance Alerts</h1>
            <span className="text-[11px] bg-rose-500/10 text-rose-400 font-mono px-2 py-0.5 rounded border border-rose-500/20">
              Trigger Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated alerts fired when price move or trading volume crosses your configured limits.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Configure Thresholds</span>
          </button>

          <button
            onClick={onRunScan}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Scan Now</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Threshold Configuration Panel */}
      {showConfig && (
        <div className="p-4.5 rounded-2xl bg-[#0f172a] border border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Surveillance Trigger Thresholds</h3>
            </div>
            <span className="text-[11px] text-slate-400">Define what constitutes an anomaly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Price Movement Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Daily Price Movement Threshold:</span>
                <span className="font-mono font-bold text-emerald-400">±{priceThresh}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="0.5"
                value={priceThresh}
                onChange={(e) => setPriceThresh(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>±1% (Sensitive)</span>
                <span>±5% (Standard)</span>
                <span>±12% (Extreme)</span>
              </div>
            </div>

            {/* Volume Spike Multiplier Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Volume Spike Threshold (vs 20d Avg):</span>
                <span className="font-mono font-bold text-emerald-400">{volThresh}x Average</span>
              </div>
              <input
                type="range"
                min="1.2"
                max="4.0"
                step="0.1"
                value={volThresh}
                onChange={(e) => setVolThresh(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1.2x (Moderate)</span>
                <span>2.0x (Institutional Norm)</span>
                <span>4.0x (Massive)</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowConfig(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveThresholds}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-bold text-black text-xs transition-all shadow-md"
            >
              Save & Apply Parameters
            </button>
          </div>
        </div>
      )}

      {/* 3. Alerts Stream */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-[#0d1424] border border-slate-800">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
            <p className="text-slate-300 font-semibold text-sm">All Quiet Across Portfolio</p>
            <p className="text-slate-500 text-xs mt-1">No stocks have breached your configured price or volume thresholds.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.priority === 'Critical';
            const isVolume = alert.alert_type === 'volume_spike';
            const isPrice = alert.alert_type === 'price_shock';

            return (
              <div
                key={alert.id}
                className={`rounded-2xl bg-[#0d1424] border p-4.5 transition-all shadow-md ${
                  alert.is_read 
                    ? 'border-slate-800/80 opacity-70' 
                    : isCritical
                      ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-[#0d1424] to-[#0d1424]'
                      : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      isVolume 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : isPrice
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isVolume ? <Flame className="w-4 h-4" /> : isPrice ? <Activity className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center space-x-2">
                        <span className="font-extrabold text-sm text-white tracking-tight">
                          {alert.ticker}
                        </span>
                        <span className="text-xs text-slate-400">{alert.company_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isCritical 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {alert.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(alert.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-100 mt-1">
                        {alert.title}
                      </h3>

                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {alert.message}
                      </p>

                      {alert.threshold_info && (
                        <div className="inline-block mt-2 text-[11px] font-mono bg-slate-900/90 text-slate-300 px-2.5 py-1 rounded border border-slate-800">
                          📊 {alert.threshold_info}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2 shrink-0">
                    {!alert.is_read && (
                      <button
                        onClick={() => onMarkRead(alert.id)}
                        className="text-[10px] text-slate-400 hover:text-emerald-400 font-medium px-2 py-0.5 rounded border border-slate-800 bg-slate-900 transition-colors"
                      >
                        Dismiss
                      </button>
                    )}
                    <button
                      onClick={() => onTriggerResearch(alert.ticker)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Investigate →
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
