export interface BetType {
  type: string;
  typeName: string;
  amount: number;
  percentage: number;
}

export interface League {
  id: string;
  name: string;
}

export interface BetDistributionResponse {
  league: string | null;
  totalAmount: number;
  betTypes: BetType[];
  heatMapData: number[][];
  leagues: League[];
  betTypeLabels: string[];
  leagueLabels: string[];
}

export interface OddsHistoryPoint {
  timestamp: string;
  homeOdds: number;
  awayOdds: number;
  handicapOdds: number;
  totalOdds: number;
}

export interface Anomaly {
  timestamp: string;
  changePercent: number;
  type: 'home' | 'away';
  description: string;
}

export interface MatchInfo {
  id: string;
  name: string;
  team1: string;
  team2: string;
  date: string;
}

export interface OddsTrackingResponse {
  matchId: string;
  matchName: string;
  team1: string;
  team2: string;
  matchList: MatchInfo[];
  oddsHistory: OddsHistoryPoint[];
  anomalies: Anomaly[];
}

export interface RegionStat {
  region: string;
  regionName: string;
  regionLevel: 'major' | 'wildcard';
  totalMatches: number;
  upsetCount: number;
  upsetRate: number;
}

export interface UpsetEvent {
  matchId: string;
  date: string;
  league: string;
  favorite: string;
  underdog: string;
  winner: string;
  upsetMagnitude: number;
  preMatchOddsFavorite: number;
  preMatchOddsUnderdog: number;
  isUpset: boolean;
}

export interface UpsetAnalysisResponse {
  regionStats: RegionStat[];
  upsetHistory: UpsetEvent[];
  summary: {
    totalUpsets: number;
    majorAvgUpsetRate: number;
    wildcardAvgUpsetRate: number;
    biggestUpset: UpsetEvent | null;
  };
}

export interface MatchHistoryItem {
  date: string;
  winner: string;
  winnerName: string;
  score: string;
  duration: number;
  boFormat: number;
  team1Score: number;
  team2Score: number;
}

export interface WinTrendPoint {
  date: string;
  value: number;
}

export interface Team {
  id: string;
  name: string;
  league: string;
}

export interface TeamHistoryResponse {
  team1: string;
  team2: string;
  team1Name: string;
  team2Name: string;
  totalMatches: number;
  team1Wins: number;
  team2Wins: number;
  team1WinRate: number;
  team2WinRate: number;
  avgBo3Duration: number;
  fullSetRate: number;
  matchHistory: MatchHistoryItem[];
  winTrend: WinTrendPoint[];
  allTeams: Team[];
  hasHistory: boolean;
}

export interface ValueBet {
  side: 'team1' | 'team2';
  edge: number;
  recommendation: string;
}

export interface LiveMatch {
  matchId: string;
  team1: string;
  team2: string;
  currentScore: [number, number];
  gameTime: string;
  goldDiff: number;
  killDiff: number;
  dragonCount: [number, number];
  baronCount: [number, number];
  towerCount: [number, number];
  winProbability: [number, number];
  currentOdds: [number, number];
  impliedProbability: [number, number];
  valueBet?: ValueBet;
  momentum: 'team1' | 'team2' | 'neutral';
}

export interface LiveAnalysisResponse {
  liveMatches: LiveMatch[];
  valueOpportunities: LiveMatch[];
  totalLiveMatches: number;
  totalValueOpportunities: number;
}

export interface DashboardSummary {
  totalBetAmount: number;
  todayMatches: number;
  liveMatches: number;
  valueOpportunities: number;
  anomaliesDetected: number;
  avgUpsetRate: number;
  biggestUpset: UpsetEvent | null;
}
