import { create } from 'zustand';
import type {
  BetDistributionResponse,
  OddsTrackingResponse,
  UpsetAnalysisResponse,
  TeamHistoryResponse,
  LiveAnalysisResponse,
  DashboardSummary,
  OddsAlert,
  OddsAlertsResponse
} from '../types';

const API_BASE = '/api';

interface DataState {
  betDistribution: BetDistributionResponse | null;
  oddsTracking: OddsTrackingResponse | null;
  upsetAnalysis: UpsetAnalysisResponse | null;
  teamHistory: TeamHistoryResponse | null;
  liveAnalysis: LiveAnalysisResponse | null;
  dashboardSummary: DashboardSummary | null;
  oddsAlerts: OddsAlert[];
  readAlertIds: Set<string>;
  alertsPanelOpen: boolean;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;

  fetchBetDistribution: (league?: string) => Promise<void>;
  fetchOddsTracking: (matchId?: string) => Promise<void>;
  fetchUpsetAnalysis: () => Promise<void>;
  fetchTeamHistory: (team1?: string, team2?: string) => Promise<void>;
  fetchLiveAnalysis: () => Promise<void>;
  fetchDashboardSummary: () => Promise<void>;
  fetchOddsAlerts: () => Promise<OddsAlert[]>;
  markAlertRead: (alertId: string) => void;
  markAllAlertsRead: () => void;
  setAlertsPanelOpen: (open: boolean) => void;
}

export const useDataStore = create<DataState>((set) => ({
  betDistribution: null,
  oddsTracking: null,
  upsetAnalysis: null,
  teamHistory: null,
  liveAnalysis: null,
  dashboardSummary: null,
  oddsAlerts: [],
  readAlertIds: new Set(),
  alertsPanelOpen: false,
  loading: {},
  error: {},

  fetchBetDistribution: async (league?: string) => {
    set({ loading: { ...useDataStore.getState().loading, betDistribution: true } });
    try {
      const url = league 
        ? `${API_BASE}/bet-distribution?league=${league}`
        : `${API_BASE}/bet-distribution`;
      const res = await fetch(url);
      const data = await res.json();
      set({ betDistribution: data, error: { ...useDataStore.getState().error, betDistribution: null } });
    } catch (err) {
      set({ error: { ...useDataStore.getState().error, betDistribution: (err as Error).message } });
    } finally {
      set({ loading: { ...useDataStore.getState().loading, betDistribution: false } });
    }
  },

  fetchOddsTracking: async (matchId?: string) => {
    set({ loading: { ...useDataStore.getState().loading, oddsTracking: true } });
    try {
      const url = matchId
        ? `${API_BASE}/odds-tracking?matchId=${matchId}`
        : `${API_BASE}/odds-tracking`;
      const res = await fetch(url);
      const data = await res.json();
      set({ oddsTracking: data, error: { ...useDataStore.getState().error, oddsTracking: null } });
    } catch (err) {
      set({ error: { ...useDataStore.getState().error, oddsTracking: (err as Error).message } });
    } finally {
      set({ loading: { ...useDataStore.getState().loading, oddsTracking: false } });
    }
  },

  fetchUpsetAnalysis: async () => {
    set({ loading: { ...useDataStore.getState().loading, upsetAnalysis: true } });
    try {
      const res = await fetch(`${API_BASE}/upset-analysis`);
      const data = await res.json();
      set({ upsetAnalysis: data, error: { ...useDataStore.getState().error, upsetAnalysis: null } });
    } catch (err) {
      set({ error: { ...useDataStore.getState().error, upsetAnalysis: (err as Error).message } });
    } finally {
      set({ loading: { ...useDataStore.getState().loading, upsetAnalysis: false } });
    }
  },

  fetchTeamHistory: async (team1?: string, team2?: string) => {
    set({ loading: { ...useDataStore.getState().loading, teamHistory: true } });
    try {
      let url = `${API_BASE}/team-history`;
      const params = new URLSearchParams();
      if (team1) params.append('team1', team1);
      if (team2) params.append('team2', team2);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      set({ teamHistory: data, error: { ...useDataStore.getState().error, teamHistory: null } });
    } catch (err) {
      set({ error: { ...useDataStore.getState().error, teamHistory: (err as Error).message } });
    } finally {
      set({ loading: { ...useDataStore.getState().loading, teamHistory: false } });
    }
  },

  fetchLiveAnalysis: async () => {
    set({ loading: { ...useDataStore.getState().loading, liveAnalysis: true } });
    try {
      const res = await fetch(`${API_BASE}/live-analysis`);
      const data = await res.json();
      set({ liveAnalysis: data, error: { ...useDataStore.getState().error, liveAnalysis: null } });
    } catch (err) {
      set({ error: { ...useDataStore.getState().error, liveAnalysis: (err as Error).message } });
    } finally {
      set({ loading: { ...useDataStore.getState().loading, liveAnalysis: false } });
    }
  },

  fetchDashboardSummary: async () => {
    set({ loading: { ...useDataStore.getState().loading, dashboardSummary: true } });
    try {
      const res = await fetch(`${API_BASE}/dashboard-summary`);
      const data = await res.json();
      set({ dashboardSummary: data, error: { ...useDataStore.getState().error, dashboardSummary: null } });
    } catch (err) {
      set({ error: { ...useDataStore.getState().error, dashboardSummary: (err as Error).message } });
    } finally {
      set({ loading: { ...useDataStore.getState().loading, dashboardSummary: false } });
    }
  },

  fetchOddsAlerts: async () => {
    set({ loading: { ...useDataStore.getState().loading, oddsAlerts: true } });
    try {
      const res = await fetch(`${API_BASE}/odds-alerts`);
      const data: OddsAlertsResponse = await res.json();
      const prevAlerts = useDataStore.getState().oddsAlerts;
      const prevIds = new Set(prevAlerts.map(a => a.id));
      const newAlerts = data.alerts;
      set({
        oddsAlerts: newAlerts,
        error: { ...useDataStore.getState().error, oddsAlerts: null }
      });
      const fresh = newAlerts.filter(a => !prevIds.has(a.id));
      return fresh;
    } catch (err) {
      set({ error: { ...useDataStore.getState().error, oddsAlerts: (err as Error).message } });
      return [];
    } finally {
      set({ loading: { ...useDataStore.getState().loading, oddsAlerts: false } });
    }
  },

  markAlertRead: (alertId: string) => {
    const next: Set<string> = new Set<string>(useDataStore.getState().readAlertIds);
    next.add(alertId);
    set({ readAlertIds: next });
  },

  markAllAlertsRead: () => {
    const all: string[] = useDataStore.getState().oddsAlerts.map(a => a.id);
    set({ readAlertIds: new Set<string>(all) });
  },

  setAlertsPanelOpen: (open: boolean) => {
    set({ alertsPanelOpen: open });
  }
}));
