import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { PortfolioView } from '../components/PortfolioView';
import { DigestView } from '../components/DigestView';
import { AlertsView } from '../components/AlertsView';
import { ResearchView } from '../components/ResearchView';
import { StockDetailModal } from '../components/StockDetailModal';
import { SearchModal } from '../components/SearchModal';
import { api } from '../services/api';
import { 
  PortfolioSummary, 
  AnnouncementDigest, 
  AlertItem, 
  AlertConfig, 
  ResearchResponse, 
  StockDetail, 
  ExecutiveBriefing 
} from '../types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'digest' | 'alerts' | 'research'>('portfolio');

  // Data States
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [digest, setDigest] = useState<AnnouncementDigest | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  
  // Research States
  const [currentResearchTicker, setCurrentResearchTicker] = useState('RELIANCE');
  const [researchResult, setResearchResult] = useState<ResearchResponse | null>(null);

  // Modal States
  const [selectedStockDetail, setSelectedStockDetail] = useState<StockDetail | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Filter States
  const [selectedWindow, setSelectedWindow] = useState<'24h' | '3d' | '7d' | 'custom'>('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Loading & Error States
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);

  const [isDigestLoading, setIsDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);

  const [isAlertsLoading, setIsAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);

  // Load Portfolio Data (Decoupled so briefing doesn't block summary)
  const loadPortfolioData = useCallback(async () => {
    setIsPortfolioLoading(true);
    setPortfolioError(null);
    try {
      const sumRes = await api.getPortfolioSummary();
      setSummary(sumRes);
    } catch (e: any) {
      console.error('Error loading portfolio summary:', e);
      setPortfolioError(e.message || 'Unable to connect to FINN backend service at http://127.0.0.1:8000');
    } finally {
      setIsPortfolioLoading(false);
    }

    try {
      const briefRes = await api.getExecutiveBriefing();
      setBriefing(briefRes);
    } catch (e) {
      console.warn('Briefing unavailable:', e);
    }
  }, []);

  // Load Windowed Digest
  const loadDigestData = useCallback(async (w: '24h' | '3d' | '7d' | 'custom', cat: string) => {
    setIsDigestLoading(true);
    setDigestError(null);
    try {
      const res = await api.getAnnouncementDigest(w, cat, true);
      setDigest(res);
    } catch (e: any) {
      console.error('Error loading digest:', e);
      setDigestError(e.message || 'Failed to fetch corporate filings digest');
    } finally {
      setIsDigestLoading(false);
    }
  }, []);

  // Load Active Alerts & Configuration
  const loadAlertsData = useCallback(async () => {
    setIsAlertsLoading(true);
    setAlertsError(null);
    try {
      const [alertsRes, cfgRes] = await Promise.all([
        api.getAlerts().catch(() => []),
        api.getAlertConfig().catch(() => null)
      ]);
      setAlerts(alertsRes);
      if (cfgRes) setAlertConfig(cfgRes);
    } catch (e: any) {
      console.error('Error loading alerts:', e);
      setAlertsError(e.message || 'Failed to load surveillance alerts');
    } finally {
      setIsAlertsLoading(false);
    }
  }, []);

  // Execute RAG Research
  const executeResearch = useCallback(async (ticker: string, moduleType: string, customQuery?: string) => {
    setIsResearchLoading(true);
    setResearchError(null);
    try {
      const res = await api.executeResearch(ticker, moduleType, customQuery);
      setResearchResult(res);
      setCurrentResearchTicker(ticker);
    } catch (e: any) {
      console.error('Error executing research:', e);
      setResearchError(e.message || `Failed to research ${ticker}`);
    } finally {
      setIsResearchLoading(false);
    }
  }, []);

  // Initialize Data
  useEffect(() => {
    loadPortfolioData();
    loadDigestData('7d', 'all');
    loadAlertsData();
    executeResearch('RELIANCE', 'narrative_vs_numbers');

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadPortfolioData, loadDigestData, loadAlertsData, executeResearch]);

  const handleSelectStock = async (ticker: string) => {
    try {
      const detail = await api.getStockDetail(ticker);
      setSelectedStockDetail(detail);
      setIsStockModalOpen(true);
    } catch (e) {
      console.error('Error fetching stock detail:', e);
    }
  };

  const handleRemoveStock = async (ticker: string) => {
    try {
      await api.removePortfolioItem(ticker);
      loadPortfolioData();
    } catch (e) {
      console.error('Error removing stock:', e);
    }
  };

  const handleTriggerResearchFromAnywhere = (ticker: string) => {
    setCurrentResearchTicker(ticker);
    setActiveTab('research');
    executeResearch(ticker, 'narrative_vs_numbers');
  };

  const handleWindowChange = (w: '24h' | '3d' | '7d' | 'custom') => {
    setSelectedWindow(w);
    loadDigestData(w, selectedCategory);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    loadDigestData(selectedWindow, cat);
  };

  const handleUpdateAlertConfig = async (newCfg: Partial<AlertConfig>) => {
    try {
      const updated = await api.updateAlertConfig(newCfg);
      setAlertConfig(updated);
    } catch (e) {
      console.error('Error updating config:', e);
    }
  };

  const handleMarkAlertRead = async (id: number) => {
    try {
      await api.markAlertRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    } catch (e) {
      console.error('Error marking alert read:', e);
    }
  };

  const handleRunAlertScan = async () => {
    try {
      await api.evaluateAlerts();
      loadAlertsData();
    } catch (e) {
      console.error('Error running scan:', e);
    }
  };

  const unreadAlerts = alerts.filter((a) => !a.is_read).length;

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      unreadAlertCount={unreadAlerts}
      onSearchClick={() => setIsSearchModalOpen(true)}
    >
      {/* 1. Portfolio View */}
      {activeTab === 'portfolio' && (
        <PortfolioView
          summary={summary}
          briefing={briefing}
          isLoading={isPortfolioLoading}
          error={portfolioError}
          onRetry={loadPortfolioData}
          onSelectStock={handleSelectStock}
          onOpenAddModal={() => setIsSearchModalOpen(true)}
          onRemoveStock={handleRemoveStock}
          onTriggerResearch={handleTriggerResearchFromAnywhere}
        />
      )}

      {/* 2. Windowed Digest View (PUSH) */}
      {activeTab === 'digest' && (
        <DigestView
          digest={digest}
          isLoading={isDigestLoading}
          error={digestError}
          onRetry={() => loadDigestData(selectedWindow, selectedCategory)}
          selectedWindow={selectedWindow}
          onSelectWindow={handleWindowChange}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategoryChange}
          onTriggerResearch={handleTriggerResearchFromAnywhere}
        />
      )}

      {/* 3. Alerts View (PUSH) */}
      {activeTab === 'alerts' && (
        <AlertsView
          alerts={alerts}
          config={alertConfig}
          isLoading={isAlertsLoading}
          error={alertsError}
          onRetry={loadAlertsData}
          onUpdateConfig={handleUpdateAlertConfig}
          onMarkRead={handleMarkAlertRead}
          onRunScan={handleRunAlertScan}
          onTriggerResearch={handleTriggerResearchFromAnywhere}
        />
      )}

      {/* 4. AI Research Copilot View (PULL) */}
      {activeTab === 'research' && (
        <ResearchView
          currentTicker={currentResearchTicker}
          onTickerChange={(t) => setCurrentResearchTicker(t)}
          researchResult={researchResult}
          isLoading={isResearchLoading}
          error={researchError}
          onRetry={() => executeResearch(currentResearchTicker, 'narrative_vs_numbers')}
          onExecuteModule={(mod, query) => executeResearch(currentResearchTicker, mod, query)}
        />
      )}

      {/* Stock Detail Modal */}
      <StockDetailModal
        stockDetail={selectedStockDetail}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onTriggerResearch={handleTriggerResearchFromAnywhere}
      />

      {/* Search & Add Stock Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onAddSuccess={() => loadPortfolioData()}
        onSelectStock={handleSelectStock}
      />
    </Layout>
  );
}
