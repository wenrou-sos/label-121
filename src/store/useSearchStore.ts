import { create } from 'zustand';
import type { Team, League, MatchInfo } from '../types';
import { useDataStore } from './useDataStore';

export type SearchResultType = 'team' | 'league' | 'match';

export interface SearchResult {
  id: string;
  name: string;
  type: SearchResultType;
  subtitle?: string;
  route: string;
  routeParams?: Record<string, string>;
}

interface SearchState {
  open: boolean;
  query: string;
  selectedIndex: number;
  externalNavigate: ((path: string) => void) | null;
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  setSelectedIndex: (index: number) => void;
  setExternalNavigate: (nav: ((path: string) => void) | null) => void;
  search: (query: string) => SearchResult[];
  navigateToResult: (result: SearchResult) => void;
}

function buildSearchIndex(): { teams: Team[]; leagues: League[]; matches: MatchInfo[] } {
  const state = useDataStore.getState();
  const teams = state.teamHistory?.allTeams || [];
  const leagues = state.betDistribution?.leagues || [];
  const matches = state.oddsTracking?.matchList || [];
  return { teams, leagues, matches };
}

function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  open: false,
  query: '',
  selectedIndex: 0,
  externalNavigate: null,

  setOpen: (open) => {
    set({ open, selectedIndex: 0 });
    if (!open) {
      setTimeout(() => set({ query: '' }), 200);
    }
  },

  setQuery: (query) => set({ query, selectedIndex: 0 }),

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  setExternalNavigate: (nav) => set({ externalNavigate: nav }),

  search: (query) => {
    const { teams, leagues, matches } = buildSearchIndex();
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResult[] = [];

    const matchedTeams = teams
      .filter(t => fuzzyMatch(q, t.name))
      .map(t => ({
        id: `team-${t.id}`,
        name: t.name,
        type: 'team' as SearchResultType,
        subtitle: t.league,
        route: '/team-history',
        routeParams: { team: t.id }
      }));

    const matchedLeagues = leagues
      .filter(l => fuzzyMatch(q, l.name))
      .map(l => ({
        id: `league-${l.id}`,
        name: l.name,
        type: 'league' as SearchResultType,
        subtitle: '联赛',
        route: '/bet-distribution',
        routeParams: { league: l.id }
      }));

    const matchedMatches = matches
      .filter(m => fuzzyMatch(q, m.name) || fuzzyMatch(q, m.team1) || fuzzyMatch(q, m.team2))
      .map(m => ({
        id: `match-${m.id}`,
        name: m.name,
        type: 'match' as SearchResultType,
        subtitle: m.date,
        route: '/odds-tracking',
        routeParams: { matchId: m.id }
      }));

    results.push(...matchedTeams, ...matchedLeagues, ...matchedMatches);
    return results;
  },

  navigateToResult: (result) => {
    const params = new URLSearchParams();
    if (result.routeParams) {
      Object.entries(result.routeParams).forEach(([k, v]) => params.set(k, v));
    }
    const url = params.toString() ? `${result.route}?${params.toString()}` : result.route;
    const nav = get().externalNavigate;
    if (nav) {
      nav(url);
    } else {
      window.location.href = url;
    }
    get().setOpen(false);
  }
}));
