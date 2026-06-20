import { useEffect, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { formatOdds, formatPercent, formatDateTime } from '../utils/formatters';
import Header from '../components/layout/Header';
import LineChart from '../components/charts/LineChart';
import { Activity, AlertTriangle, TrendingDown, TrendingUp, Clock, ChevronDown } from 'lucide-react';
import type { OddsHistoryPoint, Anomaly } from '../types';

export default function OddsTracking() {
  const [selectedMatch, setSelectedMatch] = useState<string | undefined>();
  const [selectedMatchInfo, setSelectedMatchInfo] = useState<{ team1: string; team2: string } | null>(null);
  const { oddsTracking, fetchOddsTracking, loading } = useDataStore();

  useEffect(() => {
    fetchOddsTracking(selectedMatch);
  }, [fetchOddsTracking, selectedMatch]);

  useEffect(() => {
    if (oddsTracking) {
      setSelectedMatchInfo({ team1: oddsTracking.team1, team2: oddsTracking.team2 });
    }
  }, [oddsTracking]);

  const handleMatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const matchId = e.target.value;
    setSelectedMatch(matchId || undefined);
    const match = oddsTracking?.matchList.find(m => m.id === matchId);
    if (match) {
      setSelectedMatchInfo({ team1: match.team1, team2: match.team2 });
    }
  };

  const chartData = oddsTracking ? [
    {
      x: oddsTracking.oddsHistory.map(h => h.timestamp),
      y: oddsTracking.oddsHistory.map(h => h.homeOdds),
      name: selectedMatchInfo?.team1 || '主队',
      color: '#3b82f6'
    },
    {
      x: oddsTracking.oddsHistory.map(h => h.timestamp),
      y: oddsTracking.oddsHistory.map(h => h.awayOdds),
      name: selectedMatchInfo?.team2 || '客队',
      color: '#10b981'
    }
  ] : [];

  const anomalies = oddsTracking?.anomalies || [];
  const anomalyPoints = anomalies.map(a => {
    const point = oddsTracking?.oddsHistory.find(h => h.timestamp === a.timestamp);
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
        subtitle="赛前24小时内赔率变动曲线与异常变动检测"
      />
      
      <main className="p-8 ml-64">
        <div className="flex items-center gap-4 mb-6">
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
        </div>

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
                  {formatOdds(oddsTracking.oddsHistory[oddsTracking.oddsHistory.length - 1]?.homeOdds || 0)}
                </p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-slate-400">客队赔率</span>
                </div>
                <p className="text-3xl font-display font-bold text-white">
                  {formatOdds(oddsTracking.oddsHistory[oddsTracking.oddsHistory.length - 1]?.awayOdds || 0)}
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
                  {oddsTracking.oddsHistory.length}
                </p>
              </div>
            </div>

            <div className="stat-card mb-6">
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                赔率变动曲线（赛前24小时）
              </h3>
              <LineChart 
                data={chartData}
                anomalies={anomalyPoints}
                height={400}
                yAxisTitle="赔率"
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
      </main>
    </div>
  );
}
