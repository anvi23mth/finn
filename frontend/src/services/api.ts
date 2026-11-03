import {
  PortfolioSummary,
  PortfolioItem,
  StockDetail,
  AnnouncementDigest,
  AlertItem,
  AlertConfig,
  ResearchResponse,
  ExecutiveBriefing
} from '../types';

/**
 * Resolves the backend API base URL dynamically.
 * In the browser, connects directly to FastAPI on port 8000 (bypassing node proxy limits)
 * using window.location.hostname so it works seamlessly on localhost, 127.0.0.1, and LAN IPs.
 */
export const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || '127.0.0.1';
    return `http://${host}:8000/api/v1`;
  }
  return 'http://127.0.0.1:8000/api/v1';
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return res;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  }
};

export const api = {
  // Portfolio
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/portfolio/summary`);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Failed to fetch portfolio summary (${res.status}): ${errText || res.statusText}`);
    }
    return res.json();
  },

  async addPortfolioItem(ticker: string, shares: number = 100): Promise<PortfolioItem> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/portfolio/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, name: ticker, shares_held: shares })
    });
    if (!res.ok) throw new Error('Failed to add portfolio item');
    return res.json();
  },

  async removePortfolioItem(ticker: string): Promise<any> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/portfolio/items/${ticker}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to remove portfolio item');
    return res.json();
  },

  async getExecutiveBriefing(): Promise<ExecutiveBriefing> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/portfolio/briefing`);
    if (!res.ok) throw new Error('Failed to fetch executive briefing');
    return res.json();
  },

  // Stocks
  async getStockDetail(ticker: string): Promise<StockDetail> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/stocks/${ticker}`);
    if (!res.ok) throw new Error(`Failed to fetch stock detail for ${ticker}`);
    return res.json();
  },

  async searchStocks(query: string): Promise<any[]> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/stocks/search/query?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  },

  // Announcements (Push)
  async getAnnouncementDigest(
    window: '24h' | '3d' | '7d' | 'custom' = '7d',
    category?: string,
    portfolioOnly: boolean = true
  ): Promise<AnnouncementDigest> {
    const base = getApiBase();
    let url = `${base}/announcements/digest?window=${window}&portfolio_only=${portfolioOnly}`;
    if (category && category !== 'all') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('Failed to fetch announcements digest');
    return res.json();
  },

  // Alerts (Push)
  async getAlerts(unreadOnly: boolean = false): Promise<AlertItem[]> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/alerts?unread_only=${unreadOnly}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async getAlertConfig(): Promise<AlertConfig> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/alerts/config`);
    if (!res.ok) throw new Error('Failed to fetch alert config');
    return res.json();
  },

  async updateAlertConfig(config: Partial<AlertConfig>): Promise<AlertConfig> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/alerts/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update alert config');
    return res.json();
  },

  async markAlertRead(alertId: number): Promise<any> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/alerts/${alertId}/read`, { method: 'POST' });
    return res.json();
  },

  async evaluateAlerts(): Promise<any> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/alerts/evaluate`, { method: 'POST' });
    return res.json();
  },

  // Research (Pull)
  async executeResearch(ticker: string, moduleType: string, customQuery?: string): Promise<ResearchResponse> {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/research/module`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker,
        module_type: moduleType,
        custom_query: customQuery
      })
    }, 15000); // Allow 15s for RAG / LLM generation
    if (!res.ok) throw new Error(`Failed to execute research module: ${res.statusText}`);
    return res.json();
  }
};
