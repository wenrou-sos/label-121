import { useEffect, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { formatCurrency, formatPercent } from '../utils/formatters';
import Header from '../components/layout/Header';
import PieChart from '../components/charts/PieChart';
import HeatmapChart from '../components/charts/HeatmapChart';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { TrendingUp, Filter, DollarSign, PieChart as PieChartIcon, BarChart3, Loader2 } from 'lucide-react';
import type { BetDetailResponse, BetDetailRecord } from '../types';

const BET_TYPE_KEYS = ['home_win', 'away_win', 'handicap', 'total', 'first_kill', 'first_turret'];

export default function BetDistribution() {
  const [selectedLeague, setSelectedLeague] = useState<string | undefined>();
  const { betDistribution, fetchBetDistribution, loading, fetchBetDetails } = useDataStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ leagueId: string; leagueName: string; betType: string; betTypeName: string } | null>(null);
  const [detailData, setDetailData] = useState<BetDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBetDistribution(selectedLeague);
  }, [fetchBetDistribution, selectedLeague]);

  useEffect(() => {
    if (!selectedCell || !modalOpen) return;
    const load = async () => {
      setDetailLoading(true);
      try {
        const data = await fetchBetDetails(selectedCell.leagueId, selectedCell.betType, currentPage, 10);
        setDetailData(data);
      } finally {
          setDetailLoading(false);
        }
      };
    load();
  }, [selectedCell, modalOpen, currentPage, fetchBetDetails]);

  const pieData = betDistribution ? {
    labels: betDistribution.betTypes.map(b => b.typeName),
    values: betDistribution.betTypes.map(b => b.amount),
  } : { labels: [], values: [] };

  const handleCellClick = (point: { xIndex: number; yIndex: number; x: string; y: string; value: number }) => {
    if (!betDistribution) return;
    const league = betDistribution.leagues.find(l => l.name === point.y);
    if (!league) return;
    const betType = BET_TYPE_KEYS[point.xIndex];
    setSelectedCell({
      leagueId: league.id, leagueName: league.name, betType, betTypeName: point.x
    });
    setCurrentPage(1);
    setDetailData(null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-esports-bg">
      <Header 
        title="赛事投注分布分析" 
        subtitle="按联赛/赛事维度展示各类投注玩法的资金分布热度 · 点击格子查看明细"
      />
      
      <main className="p-8 ml-64">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">选择联赛:</span>
          </div>
          <select
            value={selectedLeague || ''}
            onChange={(e) => setSelectedLeague(e.target.value || undefined)}
            className="px-4 py-2 bg-esports-card border border-esports-border rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="">全部联赛</option>
            {betDistribution?.leagues.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {loading.betDistribution ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : betDistribution ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="stat-card col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-slate-400">投注总额</span>
                </div>
                <p className="text-3xl font-display font-bold text-white">
                  {formatCurrency(betDistribution.totalAmount)}
                </p>
              </div>
              <div className="stat-card col-span-1">
                <div className="flex items-center gap-3 mb-2">
                  <PieChartIcon className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-slate-400">玩法类型</span>
                </div>
                <p className="text-3xl font-display font-bold text-white">
                  {betDistribution.betTypes.length}
                </p>
              </div>
              <div className="stat-card col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-slate-400">最热门玩法</span>
                </div>
                <p className="text-3xl font-display font-bold text-white">
                  {betDistribution.betTypes[0]?.typeName || '--'}
                  <span className="text-lg text-slate-400 ml-2">
                    ({formatPercent(betDistribution.betTypes[0]?.percentage || 0)})
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="stat-card">
                <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-blue-400" />
                  投注类型分布
                </h3>
                <PieChart 
                  data={pieData} 
                  height={350}
                />
              </div>

              <div className="stat-card">
                <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  各玩法投注详情
                </h3>
                <div className="space-y-3">
                  {betDistribution.betTypes.map((bet, index) => (
                    <div key={bet.type} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index] }}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium">{bet.typeName}</span>
                          <span className="text-slate-400 text-sm">{formatCurrency(bet.amount)}</span>
                        </div>
                        <div className="h-2 bg-esports-border/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${bet.percentage * 100}%`,
                              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index]
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-slate-400 text-sm w-16 text-right">
                        {formatPercent(bet.percentage)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {betDistribution.heatMapData.length > 0 && betDistribution.leagueLabels.length > 0 && (
              <div className="stat-card mt-6">
                <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 text-purple-400">🔥</span>
                  各联赛玩法资金热度分布
                  <span className="text-xs text-slate-500 ml-2 font-normal">（点击格子查看明细</span>
                </h3>
                <HeatmapChart 
                  z={betDistribution.heatMapData}
                  x={betDistribution.betTypeLabels}
                  y={betDistribution.leagueLabels}
                  height={300}
                  onCellClick={handleCellClick}
                />
              </div>
            )}
          </>
        ) : null}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={selectedCell ? `${selectedCell.leagueName} - ${selectedCell.betTypeName} 投注明细` : ''}
          maxWidth="max-w-4xl"
        >
          {detailLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : detailData && detailData.total > 0 ? (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-esports-border/50">
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">投注ID</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">用户ID</th>
                      <th className="px-4 py-3 text-right text-slate-400 font-medium">投注金额</th>
                      <th className="px-4 py-3 text-right text-slate-400 font-medium">赔率</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">投注时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailData.records.map((rec: BetDetailRecord) => (
                      <tr key={rec.betId} className="border-b border-esports-border/30 hover:bg-esports-card/30 transition-colors">
                      <td className="px-4 py-3 text-white font-mono">{rec.betId}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono">{rec.userId}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(rec.amount)}</td>
                      <td className="px-4 py-3 text-right text-yellow-400 font-medium">@{rec.odds.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-400">{rec.betTime}</td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={detailData.totalPages}
                totalItems={detailData.total}
                pageSize={10}
                onPageChange={setCurrentPage}
              />
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              暂无投注记录</div>
          )}
        </Modal>
      </main>
    </div>
  );
}
