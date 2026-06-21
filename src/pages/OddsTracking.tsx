import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { formatOdds, formatPercent, formatDateTime } from '../utils/formatters';
import { cn } from '../lib/utils';
import Header from '../components/layout/Header';
import LineChart from '../components/charts/LineChart';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { Activity, AlertTriangle, TrendingDown, TrendingUp, Clock, ChevronDown, Bell, BellOff, Loader2, AlertOctagon, Calendar, SlidersHorizontal } from 'lucide-react';
import type { OddsHistoryPoint, Anomaly, OddsAlert, OddsDetail } from '../types';

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
  const [selectedMatchInfo, setSelectedMatchInfo] = useState<{ team1: string; team2: string } | null>(null);
  const [notifEnabled, setNotifEnabled] = useState<boolean | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('24h');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const notifiedRef = useRef<Set<string>>(new Set());
  const { oddsTracking, fetchOddsTracking, fetchOddsAlerts, fetchOddsTrackingDetail, loading } = useDataStore();

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
    fetchOddsTracking(selectedMatch);
  }, [fetchOddsTracking, selectedMatch]);

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

  const handleMatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matchId = e.target.value;
    setSelectedMatch(matchId || undefined);
    const match = oddsTracking?.matchList.find(m => m.id === matchId);
    if (match) {
      setSelectedMatchInfo({ team1: match.team1, team2: match.team2 });
    }
  };

  const { filteredHistory, filteredAnomalies, timeWindowLabel } = useMemo(() => {
    if (!oddsTracking || oddsTracking.oddsHistory.length === 0) {
      return { filteredHistory: [], filteredAnomalies: [], timeWindowLabel: '' };
    }

    const history = oddsTracking.oddsHistory;
    const lastPoint = history[history.length - 1];
    const endTime = new Date(lastPoint.timestamp).getTime();
    let startTime: number;
    let label = '';

    if (timeRange === 'custom') {
      if (!customStart || !customEnd) {
        return {
          filteredHistory: history,
          filteredAnomalies: oddsTracking.anomalies || [],
          timeWindowLabel: '自定义'
        };
      }
      startTime = new Date(customStart).getTime();
      const endCustom = new Date(customEnd).getTime();
      label = `${customStart} ~ ${customEnd}`;
      const filtered = history.filter(h => {
        const t = new Date(h.timestamp).getTime();
        return t >= startTime && t <= endCustom;
      });
      const filteredAnom = (oddsTracking.anomalies || []).filter(a => {
        const t = new Date(a.timestamp).getTime();
        return t >= startTime && t <= endCustom;
      });
      return { filteredHistory: filtered, filteredAnomalies: filteredAnom, timeWindowLabel: label };
    }

    const preset = TIME_RANGE_PRESETS.find(p => p.value === timeRange);
    const hours = preset?.hours || 24;
    startTime = endTime - hours * 60 * 60 * 1000;
    label = preset?.label || '近24小时';

    const filtered = history.filter(h => {
      const t = new Date(h.timestamp).getTime();
      return t >= startTime && t <= endTime;
    });
    const filteredAnom = (oddsTracking.anomalies || []).filter(a => {
      const t = new Date(a.timestamp).getTime();
      return t >= startTime && t <= endTime;
    });
    return { filteredHistory: filtered, filteredAnomalies: filteredAnom, timeWindowLabel: label };
  }, [oddsTracking, timeRange, customStart, customEnd]);

  const chartData = filteredHistory.length > 0 ? [
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
  const latestAlert: OddsAlert | null = oddsTracking?.latestAlert || null;
  const anomalyPoints = anomalies.map(a => {
    const point = filteredHistory.find(h => h.timestamp === a.timestamp);
    return {
      x: a.timestamp,
      y: point ? (a.type === 'home' ? point.homeOdds : point.awayOdds) : 0,
      color: a.changePercent < 0 ? '#ef4444' : '#f59e0b'
    };
  });

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
              className="px-4 py-2 pr-10 bg-esports-card border border-esports-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none min-w-[300px]"
            >
              <option value="">选择比赛</option>
              {oddsTracking?.matchList.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

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

        {loading.oddsTracking ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : oddsTracking ? (
          <>
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

            <div className="stat-card mb-6">
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                赔率变动曲线 <span className="text-sm font-normal text-slate-400">({timeWindowLabel || '赛前24小时'})</span>
              </h3>
              <LineChart
                data={chartData}
                anomalies={anomalyPoints}
                height={400}
                yAxisTitle="赔率"
                onPointClick={handlePointClick}
              />
            </div>

            {anomalies.length > 0 && (
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
            )}
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
