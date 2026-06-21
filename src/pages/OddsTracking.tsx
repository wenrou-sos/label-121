import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { formatOdds, formatPercent, formatDateTime } from '../utils/formatters';
import { cn } from '../lib/utils';
import Header from '../components/layout/Header';
import LineChart from '../components/charts/LineChart';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { Activity, AlertTriangle, TrendingDown, TrendingUp, Clock, ChevronDown, Bell, BellOff, Loader2, AlertOctagon, Calendar, SlidersHorizontal, GitCompare, X } from 'lucide-react';
import type { OddsHistoryPoint, Anomaly, OddsAlert, OddsDetail, OddsComparisonResponse } from '../types';

const POLL_INTERVAL_MS = 30 * 1000;

type TimeRangePreset = '1h' | '6h' | '12h' | '24h' | 'custom';

const TIME_RANGE_PRESETS: { value: TimeRangePreset; label: string; hours: number }[] = [
  { value: '1h', label: '近1小时', hours: 1 },
  { value: '6h', label: '近6小时', hours: 6 },
  { value: '12h', label: '近12小时', hours: 12 },
  { value: '24h', label: '近24小时', hours: 24 },
  { value: 'custom', label: '自定义', hours: 0 },
];

async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

function fireBrowserNotification(alert: OddsAlert) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const dir = alert.changePercent < 0 ? '下跌' : '上涨';
    const tag = `odds-alert-${alert.id}`;
    new Notification('赔率异动提醒', {
      tag,
      body: `${alert.matchName} · ${alert.team} 赔率${dir} ${formatPercent(Math.abs(alert.changePercent))}（${alert.startOdds.toFixed(2)} → ${alert.endOdds.toFixed(2)}）`,
      icon: undefined,
      silent: false
    });
  } catch {
    // Notification API may throw on some browsers
  }
}

export default function OddsTracking() {
  const [selectedMatch, setSelectedMatch] = useState<string | undefined>();
  const [selectedMatch2, setSelectedMatch2] = useState<string | undefined>();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedMatchInfo, setSelectedMatchInfo] = useState<{ team1: string; team2: string } | null>(null);
  const [notifEnabled, setNotifEnabled] = useState<boolean | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('24h');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const notifiedRef = useRef<Set<string>>(new Set());
  const {
    oddsTracking,
    oddsComparison,
    fetchOddsTracking,
    fetchOddsComparison,
    clearOddsComparison,
    fetchOddsAlerts,
    fetchOddsTrackingDetail,
    loading
  } = useDataStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<OddsDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentDetailPage, setCurrentDetailPage] = useState(1);

  const handlePermission = useCallback(async () => {
    const result = await ensureNotificationPermission();
    setNotifEnabled(result === 'granted');
  }, []);

  useEffect(() => {
    if (!selectedTimestamp || !modalOpen || !oddsTracking) return;
    const load = async () => {
      setDetailLoading(true);
      try {
        const data = await fetchOddsTrackingDetail(oddsTracking.matchId, selectedTimestamp);
        if (data?.detail) {
          setDetailData(data.detail);
        } else {
          setDetailData(null);
        }
      } finally {
        setDetailLoading(false);
      }
    };
    load();
  }, [selectedTimestamp, modalOpen, oddsTracking, fetchOddsTrackingDetail]);

  const handlePointClick = (point: { x: string; y: number; seriesName: string; xIndex: number }) => {
    setSelectedTimestamp(point.x);
    setCurrentDetailPage(1);
    setDetailData(null);
    setModalOpen(true);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifEnabled(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (oddsTracking) {
      setSelectedMatchInfo({ team1: oddsTracking.team1, team2: oddsTracking.team2 });
    }
  }, [oddsTracking]);

  useEffect(() => {
    if (compareMode) {
      if (!selectedMatch2 && oddsTracking?.matchList && oddsTracking.matchList.length > 1) {
        const other = oddsTracking.matchList.find(m => m.id !== selectedMatch);
        if (other) setSelectedMatch2(other.id);
      }
    } else {
      clearOddsComparison();
      setSelectedMatch2(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareMode]);

  useEffect(() => {
    if (compareMode) return;
    fetchOddsTracking(selectedMatch);
  }, [compareMode, fetchOddsTracking, selectedMatch]);

  useEffect(() => {
    if (!compareMode) return;
    fetchOddsTracking(selectedMatch);
  }, [compareMode, fetchOddsTracking, selectedMatch]);

  useEffect(() => {
    if (!compareMode) return;
    if (selectedMatch && selectedMatch2 && selectedMatch !== selectedMatch2) {
      fetchOddsComparison(selectedMatch, selectedMatch2);
    }
  }, [compareMode, fetchOddsComparison, selectedMatch, selectedMatch2]);

  useEffect(() => {
    if (timeRange === 'custom' && oddsTracking && oddsTracking.oddsHistory.length > 0) {
      if (!customStart || !customEnd) {
        const first = oddsTracking.oddsHistory[0].timestamp;
        const last = oddsTracking.oddsHistory[oddsTracking.oddsHistory.length - 1].timestamp;
        const toLocalInput = (ts: string) => {
          const d = new Date(ts);
          const pad = (n: number) => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        setCustomStart(toLocalInput(first));
        setCustomEnd(toLocalInput(last));
      }
    }
  }, [timeRange, oddsTracking, customStart, customEnd]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const fresh = await fetchOddsAlerts();
      if (!cancelled) {
        setLastCheckedAt(new Date().toISOString());
        if (fresh.length > 0 && notifEnabled) {
          fresh.forEach(alert => {
            if (!notifiedRef.current.has(alert.id)) {
              notifiedRef.current.add(alert.id);
              fireBrowserNotification(alert);
            }
          });
        }
      }
    };
    tick();
    const timer = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [fetchOddsAlerts, notifEnabled]);

  useEffect(() => {
    if (timeRange !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
    }
  }, [timeRange]);

  const handleMatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matchId = e.target.value;
    setSelectedMatch(matchId || undefined);
    const match = oddsTracking?.matchList.find(m => m.id === matchId);
    if (match) {
      setSelectedMatchInfo({ team1: match.team1, team2: match.team2 });
    }
    if (compareMode && matchId && selectedMatch2 === matchId && oddsTracking?.matchList) {
      const other = oddsTracking.matchList.find(m => m.id !== matchId);
      setSelectedMatch2(other?.id);
    }
    setCustomStart('');
    setCustomEnd('');
  };

  const handleMatch2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matchId = e.target.value;
    setSelectedMatch2(matchId || undefined);
    setCustomStart('');
    setCustomEnd('');
  };

  const handleToggleCompareMode = () => {
    setCompareMode(prev => !prev);
    setCustomStart('');
    setCustomEnd('');
  };

  const { filteredHistory, filteredAnomalies, filteredLatestAlert, timeWindowLabel } = useMemo(() => {
    if (!oddsTracking || oddsTracking.oddsHistory.length === 0) {
      return { filteredHistory: [], filteredAnomalies: [], filteredLatestAlert: null, timeWindowLabel: '' };
    }

    const history = oddsTracking.oddsHistory;
    const lastPoint = history[history.length - 1];
    const endTime = new Date(lastPoint.timestamp).getTime();
    let startTime: number;
    let label = '';
    let windowEnd: number;

    if (timeRange === 'custom') {
      if (!customStart || !customEnd) {
        const allAnom = oddsTracking.anomalies || [];
        const latestInAll = allAnom.length > 0
          ? allAnom.reduce((a, b) => new Date(a.timestamp) > new Date(b.timestamp) ? a : b)
          : null;
        const alertConverted = latestInAll ? {
          id: `anomaly-${latestInAll.timestamp}`,
          matchId: oddsTracking.matchId,
          matchName: oddsTracking.matchName,
          team1: oddsTracking.team1,
          team2: oddsTracking.team2,
          team: latestInAll.type === 'home' ? oddsTracking.team1 : oddsTracking.team2,
          type: latestInAll.type,
          changePercent: latestInAll.changePercent,
          startOdds: 0,
          endOdds: 0,
          timestamp: latestInAll.timestamp,
          description: latestInAll.description
        } as OddsAlert : null;
        return {
          filteredHistory: history,
          filteredAnomalies: allAnom,
          filteredLatestAlert: alertConverted || oddsTracking.latestAlert,
          timeWindowLabel: '自定义'
        };
      }
      startTime = new Date(customStart).getTime();
      windowEnd = new Date(customEnd).getTime();
      label = `${customStart} ~ ${customEnd}`;
    } else {
      const preset = TIME_RANGE_PRESETS.find(p => p.value === timeRange);
      const hours = preset?.hours || 24;
      startTime = endTime - hours * 60 * 60 * 1000;
      windowEnd = endTime;
      label = preset?.label || '近24小时';
    }

    const filtered = history.filter(h => {
      const t = new Date(h.timestamp).getTime();
      return t >= startTime && t <= windowEnd;
    });
    const filteredAnom = (oddsTracking.anomalies || []).filter(a => {
      const t = new Date(a.timestamp).getTime();
      return t >= startTime && t <= windowEnd;
    });

    let latest: OddsAlert | null = null;
    if (filteredAnom.length > 0) {
      const latestAnom = filteredAnom.reduce((a, b) =>
        new Date(a.timestamp) > new Date(b.timestamp) ? a : b
      );
      const pointIdx = filtered.findIndex(h => h.timestamp === latestAnom.timestamp);
      const currPoint = pointIdx >= 0 ? filtered[pointIdx] : null;
      const prevPoint = pointIdx > 0 ? filtered[pointIdx - 1] : currPoint;
      const oddsKey = latestAnom.type === 'home' ? 'homeOdds' : 'awayOdds';
      const endOdds = currPoint?.[oddsKey] || 0;
      const startOdds = prevPoint?.[oddsKey] || endOdds;
      latest = {
        id: `anomaly-${latestAnom.timestamp}`,
        matchId: oddsTracking.matchId,
        matchName: oddsTracking.matchName,
        team1: oddsTracking.team1,
        team2: oddsTracking.team2,
        team: latestAnom.type === 'home' ? oddsTracking.team1 : oddsTracking.team2,
        type: latestAnom.type,
        changePercent: latestAnom.changePercent,
        startOdds,
        endOdds,
        timestamp: latestAnom.timestamp,
        description: latestAnom.description
      } as OddsAlert;
    } else if (oddsTracking.latestAlert) {
      const alertTime = new Date(oddsTracking.latestAlert.timestamp).getTime();
      if (alertTime >= startTime && alertTime <= windowEnd) {
        latest = oddsTracking.latestAlert;
      }
    }

    return { filteredHistory: filtered, filteredAnomalies: filteredAnom, filteredLatestAlert: latest, timeWindowLabel: label };
  }, [oddsTracking, timeRange, customStart, customEnd]);

  interface ComparisonFiltered {
    timestamps: string[];
    timestampsM2: string[];
    m1NormHome: number[];
    m1NormAway: number[];
    m2NormHome: number[];
    m2NormAway: number[];
    m1History: OddsHistoryPoint[];
    m2History: OddsHistoryPoint[];
    diffSeries: number[];
    maxDiffRegion: OddsComparisonResponse['maxDiffRegion'];
    maxDiffRegionM2: OddsComparisonResponse['maxDiffRegion'];
    label: string;
  }

  const comparisonFiltered: ComparisonFiltered | null = useMemo(() => {
    if (!compareMode || !oddsComparison || oddsComparison.alignedTimestamps.length === 0) {
      return null;
    }
    const timestamps = oddsComparison.alignedTimestamps;
    const timestampsM2 = oddsComparison.alignedTimestampsM2 || timestamps;
    const lastTs = timestamps[timestamps.length - 1];
    const endTime = new Date(lastTs).getTime();
    let startTime: number;
    let windowEnd: number;
    let label: string;

    if (timeRange === 'custom') {
      if (!customStart || !customEnd) {
        return {
          timestamps,
          timestampsM2,
          m1NormHome: oddsComparison.match1NormalizedHome,
          m1NormAway: oddsComparison.match1NormalizedAway,
          m2NormHome: oddsComparison.match2NormalizedHome,
          m2NormAway: oddsComparison.match2NormalizedAway,
          m1History: oddsComparison.match1History,
          m2History: oddsComparison.match2History,
          diffSeries: oddsComparison.diffSeries,
          maxDiffRegion: oddsComparison.maxDiffRegion,
          maxDiffRegionM2: oddsComparison.maxDiffRegion ? {
            ...oddsComparison.maxDiffRegion,
            startTimestamp: timestampsM2[oddsComparison.maxDiffRegion.startIndex],
            endTimestamp: timestampsM2[oddsComparison.maxDiffRegion.endIndex]
          } : null,
          label: '自定义'
        };
      }
      startTime = new Date(customStart).getTime();
      windowEnd = new Date(customEnd).getTime();
      label = `${customStart} ~ ${customEnd}`;
    } else {
      const preset = TIME_RANGE_PRESETS.find(p => p.value === timeRange);
      const hours = preset?.hours || 24;
      startTime = endTime - hours * 60 * 60 * 1000;
      windowEnd = endTime;
      label = preset?.label || '近24小时';
    }

    const idx = timestamps
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => {
        const ts = new Date(t).getTime();
        return ts >= startTime && ts <= windowEnd;
      })
      .map(({ i }) => i);

    if (idx.length === 0) {
      return {
        timestamps: [],
        timestampsM2: [],
        m1NormHome: [],
        m1NormAway: [],
        m2NormHome: [],
        m2NormAway: [],
        m1History: [],
        m2History: [],
        diffSeries: [],
        maxDiffRegion: null,
        maxDiffRegionM2: null,
        label
      };
    }
    const startIdx = idx[0];
    const endIdx = idx[idx.length - 1];
    const slice = <T,>(arr: T[]): T[] => arr.slice(startIdx, endIdx + 1);

    const origRegion = oddsComparison.maxDiffRegion;
    let adjustedRegion: OddsComparisonResponse['maxDiffRegion'] = null;
    let adjustedRegionM2: OddsComparisonResponse['maxDiffRegion'] = null;
    if (origRegion) {
      const rs = Math.max(0, origRegion.startIndex - startIdx);
      const re = Math.min(endIdx - startIdx, origRegion.endIndex - startIdx);
      if (rs <= re) {
        adjustedRegion = {
          ...origRegion,
          startIndex: rs,
          endIndex: re,
          startTimestamp: timestamps[startIdx + rs],
          endTimestamp: timestamps[startIdx + re]
        };
        adjustedRegionM2 = {
          ...origRegion,
          startIndex: rs,
          endIndex: re,
          startTimestamp: timestampsM2[startIdx + rs],
          endTimestamp: timestampsM2[startIdx + re]
        };
      }
    }

    return {
      timestamps: slice(timestamps),
      timestampsM2: slice(timestampsM2),
      m1NormHome: slice(oddsComparison.match1NormalizedHome),
      m1NormAway: slice(oddsComparison.match1NormalizedAway),
      m2NormHome: slice(oddsComparison.match2NormalizedHome),
      m2NormAway: slice(oddsComparison.match2NormalizedAway),
      m1History: slice(oddsComparison.match1History),
      m2History: slice(oddsComparison.match2History),
      diffSeries: slice(oddsComparison.diffSeries),
      maxDiffRegion: adjustedRegion,
      maxDiffRegionM2: adjustedRegionM2,
      label
    };
  }, [compareMode, oddsComparison, timeRange, customStart, customEnd]);

  const chartData = compareMode && comparisonFiltered && comparisonFiltered.timestamps.length > 0 ? [
    {
      x: comparisonFiltered.timestamps,
      y: comparisonFiltered.m1NormHome,
      name: `${oddsComparison!.match1.team1}（归一化）`,
      color: '#3b82f6'
    },
    {
      x: comparisonFiltered.timestamps,
      y: comparisonFiltered.m1NormAway,
      name: `${oddsComparison!.match1.team2}（归一化）`,
      color: '#10b981'
    },
    {
      x: comparisonFiltered.timestamps,
      y: comparisonFiltered.m2NormHome,
      name: `${oddsComparison!.match2.team1}（归一化）`,
      color: '#a855f7'
    },
    {
      x: comparisonFiltered.timestamps,
      y: comparisonFiltered.m2NormAway,
      name: `${oddsComparison!.match2.team2}（归一化）`,
      color: '#f59e0b'
    }
  ] : filteredHistory.length > 0 ? [
    {
      x: filteredHistory.map(h => h.timestamp),
      y: filteredHistory.map(h => h.homeOdds),
      name: selectedMatchInfo?.team1 || '主队',
      color: '#3b82f6'
    },
    {
      x: filteredHistory.map(h => h.timestamp),
      y: filteredHistory.map(h => h.awayOdds),
      name: selectedMatchInfo?.team2 || '客队',
      color: '#10b981'
    }
  ] : [];

  const anomalies = filteredAnomalies;
  const latestAlert = !compareMode ? filteredLatestAlert : null;
  const anomalyPoints = compareMode ? [] : anomalies.map(a => {
    const point = filteredHistory.find(h => h.timestamp === a.timestamp);
    return {
      x: a.timestamp,
      y: point ? (a.type === 'home' ? point.homeOdds : point.awayOdds) : 0,
      color: a.changePercent < 0 ? '#ef4444' : '#f59e0b'
    };
  });

  const highlightRanges = compareMode && comparisonFiltered?.maxDiffRegion ? [
    {
      startIndex: comparisonFiltered.maxDiffRegion.startIndex,
      endIndex: comparisonFiltered.maxDiffRegion.endIndex,
      color: 'rgba(249, 115, 22, 0.15)',
      label: `差异最大 · 平均${(comparisonFiltered.maxDiffRegion.avgDiff * 100).toFixed(0)}%`
    }
  ] : undefined;

  const getAnomalyIcon = (anomaly: Anomaly) => {
    return anomaly.changePercent < 0 ?
      <TrendingDown className="w-4 h-4 text-red-400" /> :
      <TrendingUp className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="min-h-screen bg-esports-bg">
      <Header
        title="赔率变动追踪系统"
        subtitle="赛前24小时内赔率变动曲线与异常变动检测 · 每30秒自动扫描"
      />

      <main className="p-8 ml-64">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">选择比赛:</span>
          </div>
          <div className="relative">
            <select
              value={selectedMatch || ''}
              onChange={handleMatchChange}
              className="px-4 py-2 pr-10 bg-esports-card border border-blue-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/60 appearance-none min-w-[280px]"
            >
              <option value="">选择比赛</option>
              {oddsTracking?.matchList.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {compareMode && (
            <>
              <span className="text-slate-500 font-medium">VS</span>
              <div className="relative">
                <select
                  value={selectedMatch2 || ''}
                  onChange={handleMatch2Change}
                  className="px-4 py-2 pr-10 bg-esports-card border border-purple-500/40 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/60 appearance-none min-w-[280px]"
                >
                  <option value="">选择对比比赛</option>
                  {oddsTracking?.matchList.filter(m => m.id !== selectedMatch).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </>
          )}

          <button
            onClick={handleToggleCompareMode}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
              compareMode
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-500/50 shadow-sm'
                : 'bg-esports-card text-slate-400 hover:text-white border-esports-border hover:border-slate-600'
            )}
            title={compareMode ? '关闭对比模式' : '开启对比模式'}
          >
            {compareMode ? (
              <>
                <X className="w-4 h-4" />
                关闭对比
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                对比模式
              </>
            )}
          </button>

          <div className="ml-auto flex items-center gap-3">
            {lastCheckedAt && (
              <span className="text-xs text-slate-500">
                上次扫描: {formatDateTime(lastCheckedAt)}
              </span>
            )}
            {notifEnabled === null ? null : notifEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 text-xs">
                <Bell className="w-3.5 h-3.5" />
                系统通知已开启
              </span>
            ) : (
              <button
                onClick={handlePermission}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs transition-colors"
              >
                <BellOff className="w-3.5 h-3.5" />
                开启系统通知
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">时间范围:</span>
          </div>
          <div className="flex items-center gap-1 bg-esports-card/50 p-1 rounded-lg border border-esports-border/50">
            {TIME_RANGE_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => setTimeRange(preset.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                  timeRange === preset.value
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <input
                  type="datetime-local"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 bg-esports-card border border-esports-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <span className="text-slate-500">~</span>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 bg-esports-card border border-esports-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          )}
        </div>

        {latestAlert && (
          <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/15 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-yellow-400">最新异动</span>
                <span className="text-xs text-slate-500">{formatDateTime(latestAlert.timestamp)}</span>
              </div>
              <p className="text-sm text-white">
                <span className="font-medium">{latestAlert.matchName}</span>
                <span className="mx-2 text-slate-600">·</span>
                {latestAlert.description}
              </p>
            </div>
          </div>
        )}

        {(loading.oddsTracking || (compareMode && loading.oddsComparison)) ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : oddsTracking ? (
          <>
            {compareMode && oddsComparison && comparisonFiltered ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="stat-card border-blue-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">比赛 A</span>
                    </div>
                    <span className="text-sm font-medium text-white truncate ml-2">{oddsComparison.match1.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{oddsComparison.match1.team1} 赔率</p>
                      <p className="text-2xl font-display font-bold text-blue-400">
                        {formatOdds(comparisonFiltered.m1History[comparisonFiltered.m1History.length - 1]?.homeOdds || 0)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatOdds(oddsComparison.summary.match1HomeStart)} → {formatOdds(oddsComparison.summary.match1HomeEnd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{oddsComparison.match1.team2} 赔率</p>
                      <p className="text-2xl font-display font-bold text-blue-300">
                        {formatOdds(comparisonFiltered.m1History[comparisonFiltered.m1History.length - 1]?.awayOdds || 0)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatOdds(oddsComparison.summary.match1AwayStart)} → {formatOdds(oddsComparison.summary.match1AwayEnd)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-esports-border/30 text-xs text-slate-500">
                    对齐数据点: {comparisonFiltered.timestamps.length} / 原始 {oddsComparison.summary.match1Points}
                  </div>
                </div>

                <div className="stat-card border-purple-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">比赛 B</span>
                    </div>
                    <span className="text-sm font-medium text-white truncate ml-2">{oddsComparison.match2.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{oddsComparison.match2.team1} 赔率</p>
                      <p className="text-2xl font-display font-bold text-purple-400">
                        {formatOdds(comparisonFiltered.m2History[comparisonFiltered.m2History.length - 1]?.homeOdds || 0)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatOdds(oddsComparison.summary.match2HomeStart)} → {formatOdds(oddsComparison.summary.match2HomeEnd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{oddsComparison.match2.team2} 赔率</p>
                      <p className="text-2xl font-display font-bold text-purple-300">
                        {formatOdds(comparisonFiltered.m2History[comparisonFiltered.m2History.length - 1]?.awayOdds || 0)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatOdds(oddsComparison.summary.match2AwayStart)} → {formatOdds(oddsComparison.summary.match2AwayEnd)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-esports-border/30 flex items-center justify-between text-xs">
                    <span className="text-slate-500">对齐数据点: {comparisonFiltered.timestamps.length} / 原始 {oddsComparison.summary.match2Points}</span>
                    {comparisonFiltered.maxDiffRegion && (
                      <span className="inline-flex items-center gap-1 text-orange-400 font-medium">
                        <GitCompare className="w-3.5 h-3.5" />
                        最大差异 {(comparisonFiltered.maxDiffRegion.avgDiff * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-slate-400">主队赔率</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-white">
                    {formatOdds(filteredHistory[filteredHistory.length - 1]?.homeOdds || 0)}
                  </p>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-slate-400">客队赔率</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-white">
                    {formatOdds(filteredHistory[filteredHistory.length - 1]?.awayOdds || 0)}
                  </p>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-slate-400">异常检测</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-white">
                    {anomalies.length}
                  </p>
                </div>
                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-slate-400">数据点数</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-white">
                    {filteredHistory.length}
                  </p>
                </div>
              </div>
            )}

            <div className="stat-card mb-6">
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2 flex-wrap">
                <Activity className={`w-5 h-5 ${compareMode ? 'text-purple-400' : 'text-blue-400'}`} />
                {compareMode ? '赔率对比曲线（归一化）' : '赔率变动曲线'}
                <span className="text-sm font-normal text-slate-400">
                  ({compareMode ? comparisonFiltered?.label || '对比模式' : timeWindowLabel || '赛前24小时'})
                </span>
                {compareMode && comparisonFiltered?.maxDiffRegion && comparisonFiltered?.maxDiffRegionM2 && (
                  <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 text-xs font-medium" title={`比赛A: ${comparisonFiltered.maxDiffRegion.startTimestamp} ~ ${comparisonFiltered.maxDiffRegion.endTimestamp}\n比赛B: ${comparisonFiltered.maxDiffRegionM2.startTimestamp} ~ ${comparisonFiltered.maxDiffRegionM2.endTimestamp}`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    差异最大时段: A({comparisonFiltered.maxDiffRegion.startTimestamp.split(' ')[1]} ~ {comparisonFiltered.maxDiffRegion.endTimestamp.split(' ')[1]}) / B({comparisonFiltered.maxDiffRegionM2.startTimestamp.split(' ')[1]} ~ {comparisonFiltered.maxDiffRegionM2.endTimestamp.split(' ')[1]})
                  </span>
                )}
              </h3>
              <LineChart
                data={chartData}
                anomalies={anomalyPoints}
                highlightRanges={highlightRanges}
                height={400}
                yAxisTitle={compareMode ? '归一化赔率（0~1）' : '赔率'}
                onPointClick={compareMode ? undefined : handlePointClick}
              />
            </div>

            {compareMode && oddsComparison && comparisonFiltered ? (
              comparisonFiltered.maxDiffRegion && comparisonFiltered.maxDiffRegionM2 && (
                <div className="stat-card">
                  <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-orange-400" />
                    差异最大时段
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
                      <p className="text-sm text-slate-400 mb-1">比赛A时间范围</p>
                      <p className="text-lg font-semibold text-white">
                        {comparisonFiltered.maxDiffRegion.startTimestamp}
                      </p>
                      <p className="text-sm text-slate-500">
                        ~ {comparisonFiltered.maxDiffRegion.endTimestamp}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                      <p className="text-sm text-slate-400 mb-1">比赛B时间范围</p>
                      <p className="text-lg font-semibold text-white">
                        {comparisonFiltered.maxDiffRegionM2.startTimestamp}
                      </p>
                      <p className="text-sm text-slate-500">
                        ~ {comparisonFiltered.maxDiffRegionM2.endTimestamp}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                      <p className="text-sm text-slate-400 mb-1">平均差异</p>
                      <p className="text-3xl font-display font-bold text-orange-400">
                        {(comparisonFiltered.maxDiffRegion.avgDiff * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500 mt-1">归一化赔率差</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                      <p className="text-sm text-slate-400 mb-1">峰值差异</p>
                      <p className="text-3xl font-display font-bold text-purple-400">
                        {(comparisonFiltered.maxDiffRegion.maxDiff * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500 mt-1">窗口大小 {comparisonFiltered.maxDiffRegion.windowSize} 个点</p>
                    </div>
                  </div>
                </div>
              )
            ) : anomalies.length > 0 ? (
              <div className="stat-card">
                <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  异常变动记录 <span className="anomaly-badge ml-2">{anomalies.length} 条</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-esports-border/50">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">时间</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">类型</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">变动幅度</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">描述</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anomalies.map((anomaly, index) => (
                        <tr key={index} className="border-b border-esports-border/30 hover:bg-esports-card/30 transition-colors">
                          <td className="py-3 px-4 text-white text-sm">
                            {formatDateTime(anomaly.timestamp)}
                          </td>
                          <td className="py-3 px-4 text-white text-sm">
                            {anomaly.type === 'home' ? (selectedMatchInfo?.team1 || '主队') : (selectedMatchInfo?.team2 || '客队')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${anomaly.changePercent < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                              {formatPercent(anomaly.changePercent)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 text-sm">
                            {anomaly.description}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${anomaly.changePercent < 0 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {getAnomalyIcon(anomaly)}
                              {Math.abs(anomaly.changePercent) > 0.5 ? '剧烈变动' : '异常变动'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selectedTimestamp ? `${selectedTimestamp.split(' ')[1] || selectedTimestamp} 赔率快照` : ''}
          maxWidth="max-w-4xl"
        >
          {detailLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : detailData ? (
            <div>
              {detailData.anomalies.length > 0 && (
                <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertOctagon className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">检测到异常波动（{detailData.anomalies.length} 条）</span>
                  </div>
                  <div className="space-y-2">
                    {detailData.anomalies.map((a, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <span className="text-slate-400 font-mono">{a.timestamp}</span>
                        <span className={`font-medium ${a.changePercent < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                          {formatPercent(a.changePercent)}
                        </span>
                        <span className="text-white">{a.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h4 className="text-sm font-semibold text-white mb-3">时间点前后 2 分钟快照</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-esports-border/50">
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">时间</th>
                      <th className="px-4 py-3 text-right text-slate-400 font-medium">
                        {selectedMatchInfo?.team1 || '主队'}
                      </th>
                      <th className="px-4 py-3 text-right text-slate-400 font-medium">
                        {selectedMatchInfo?.team2 || '客队'}
                      </th>
                      <th className="px-4 py-3 text-right text-slate-400 font-medium">让分盘</th>
                      <th className="px-4 py-3 text-right text-slate-400 font-medium">大小盘</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const pageSize = 10;
                      const total = detailData.snapshot.length;
                      const totalPages = Math.max(1, Math.ceil(total / pageSize));
                      const start = (currentDetailPage - 1) * pageSize;
                      const end = start + pageSize;
                      const pageData = detailData.snapshot.slice(start, end);
                      return (
                        <>
                          {pageData.map((s: OddsHistoryPoint, idx) => (
                            <tr key={idx} className="border-b border-esports-border/30 hover:bg-esports-card/30 transition-colors">
                              <td className="px-4 py-3 text-white font-mono">{s.timestamp}</td>
                              <td className="px-4 py-3 text-right text-blue-400 font-medium">{formatOdds(s.homeOdds)}</td>
                              <td className="px-4 py-3 text-right text-green-400 font-medium">{formatOdds(s.awayOdds)}</td>
                              <td className="px-4 py-3 text-right text-purple-400 font-medium">{formatOdds(s.handicapOdds)}</td>
                              <td className="px-4 py-3 text-right text-orange-400 font-medium">{formatOdds(s.totalOdds)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={5}>
                              <Pagination
                                currentPage={currentDetailPage}
                                totalPages={totalPages}
                                totalItems={total}
                                pageSize={pageSize}
                                onPageChange={setCurrentDetailPage}
                              />
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              暂无快照数据
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}
