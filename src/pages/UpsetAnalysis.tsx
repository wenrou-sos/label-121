import { useEffect, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { formatPercent, formatDate } from '../utils/formatters';
import Header from '../components/layout/Header';
import BarChart from '../components/charts/BarChart';
import { Zap, TrendingUp, AlertTriangle, Trophy, Search, Filter } from 'lucide-react';

export default function UpsetAnalysis() {
  const { upsetAnalysis, fetchUpsetAnalysis, loading } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLeague, setFilterLeague] = useState('');

  useEffect(() => {
    fetchUpsetAnalysis();
  }, [fetchUpsetAnalysis]);

  const majorRegions = upsetAnalysis?.regionStats.filter(r => r.regionLevel === 'major') || [];
  const wildcardRegions = upsetAnalysis?.regionStats.filter(r => r.regionLevel === 'wildcard') || [];

  const barData = [
    {
      x: majorRegions.map(r => r.regionName),
      y: majorRegions.map(r => r.upsetRate),
      name: '主流赛区',
      color: '#3b82f6'
    },
    {
      x: wildcardRegions.map(r => r.regionName),
      y: wildcardRegions.map(r => r.upsetRate),
      name: '外卡赛区',
      color: '#f59e0b'
    }
  ];

  const filteredHistory = upsetAnalysis?.upsetHistory.filter(u => {
    const matchesSearch = u.favorite.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.underdog.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.league.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = !filterLeague || u.league === filterLeague;
    return matchesSearch && matchesLeague && u.isUpset;
  }) || [];

  const leagues = [...new Set(upsetAnalysis?.upsetHistory.map(u => u.league) || [])];

  return (
    <div className="min-h-screen bg-esports-bg">
      <Header 
        title="热门vs冷门赛事分析" 
        subtitle="按赛事级别分类统计爆冷概率，对比主流与外卡赛区差异"
      />
      
      <main className="p-8 ml-64">
        {loading.upsetAnalysis ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : upsetAnalysis ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="stat-card">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-slate-400">总爆冷次数</span>
                </div>
                <p className="text-3xl font-display font-bold text-white">
                  {upsetAnalysis.summary.totalUpsets}
                </p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-slate-400">主流赛区爆冷率</span>
                </div>
                <p className="text-3xl font-display font-bold text-white">
                  {formatPercent(upsetAnalysis.summary.majorAvgUpsetRate)}
                </p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-slate-400">外卡赛区爆冷率</span>
                </div>
                <p className="text-3xl font-display font-bold text-white">
                  {formatPercent(upsetAnalysis.summary.wildcardAvgUpsetRate)}
                </p>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-slate-400">爆冷率差异</span>
                </div>
                <p className="text-3xl font-display font-bold text-white">
                  {formatPercent(Math.abs(upsetAnalysis.summary.majorAvgUpsetRate - upsetAnalysis.summary.wildcardAvgUpsetRate))}
                </p>
              </div>
            </div>

            <div className="stat-card mb-6">
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                各赛区爆冷率对比
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm text-blue-400 font-medium mb-3">主流赛区</h4>
                  <BarChart 
                    data={[barData[0]]}
                    height={300}
                    yAxisTitle="爆冷率"
                  />
                </div>
                <div>
                  <h4 className="text-sm text-yellow-400 font-medium mb-3">外卡赛区</h4>
                  <BarChart 
                    data={[barData[1]]}
                    height={300}
                    yAxisTitle="爆冷率"
                  />
                </div>
              </div>
            </div>

            <div className="stat-card mb-6">
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                赛区爆冷详情统计
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-esports-border/50">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">赛区</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">级别</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">总场次</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">爆冷场次</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">爆冷率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upsetAnalysis.regionStats.map((region, index) => (
                      <tr key={index} className="border-b border-esports-border/30 hover:bg-esports-card/30 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{region.regionName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${region.regionLevel === 'major' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {region.regionLevel === 'major' ? '主流赛区' : '外卡赛区'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{region.totalMatches}</td>
                        <td className="py-3 px-4 text-slate-300">{region.upsetCount}</td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${region.upsetRate > 0.4 ? 'text-red-400' : region.upsetRate > 0.3 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {formatPercent(region.upsetRate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="font-display font-semibold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-400" />
                  历史爆冷赛事案例
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="搜索战队..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-esports-card/50 border border-esports-border/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      value={filterLeague}
                      onChange={(e) => setFilterLeague(e.target.value)}
                      className="pl-9 pr-8 py-2 bg-esports-card/50 border border-esports-border/50 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                    >
                      <option value="">全部联赛</option>
                      {leagues.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-esports-border/50">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">日期</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">联赛</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">对阵</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">获胜方</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">赛前赔率</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">爆冷指数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((event, index) => (
                      <tr key={index} className="border-b border-esports-border/30 hover:bg-esports-card/30 transition-colors">
                        <td className="py-3 px-4 text-slate-300 text-sm">{formatDate(event.date)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                            {event.league}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white">
                          <span className="text-slate-400">{event.favorite}</span>
                          <span className="mx-2 text-slate-600">vs</span>
                          <span className="text-green-400">{event.underdog}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${event.isUpset ? 'text-green-400' : 'text-white'}`}>
                            {event.winner}
                          </span>
                          {event.isUpset && <span className="ml-2 text-xs text-yellow-400">(爆冷)</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-sm">
                          {event.preMatchOddsFavorite.toFixed(2)} / {event.preMatchOddsUnderdog.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${event.upsetMagnitude > 4 ? 'bg-red-500/20 text-red-400' : event.upsetMagnitude > 3 ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {event.upsetMagnitude.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
