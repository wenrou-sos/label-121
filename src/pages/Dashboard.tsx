import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Activity, 
  Zap, 
  Swords, 
  Radio,
  DollarSign,
  Calendar,
  AlertTriangle,
  Target,
  ChevronRight,
  Star,
  X
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useFavoriteStore } from '../store/useFavoriteStore';
import { formatCurrency, formatPercent } from '../utils/formatters';
import Header from '../components/layout/Header';

const navCards = [
  { path: '/bet-distribution', label: '投注分布分析', icon: TrendingUp, color: 'from-blue-500 to-cyan-500', desc: '查看各联赛各玩法资金分布' },
  { path: '/odds-tracking', label: '赔率变动追踪', icon: Activity, color: 'from-green-500 to-emerald-500', desc: '监控赔率曲线和异常变动' },
  { path: '/upset-analysis', label: '爆冷赛事分析', icon: Zap, color: 'from-yellow-500 to-orange-500', desc: '对比各赛区爆冷概率' },
  { path: '/team-history', label: '战队交锋历史', icon: Swords, color: 'from-purple-500 to-pink-500', desc: '分析战队历史对战数据' },
  { path: '/live-analysis', label: '实时滚球分析', icon: Radio, color: 'from-red-500 to-rose-500', desc: '实时胜率计算与价值识别' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboardSummary, fetchDashboardSummary, loading } = useDataStore();
  const { favoriteTeams, removeFavorite } = useFavoriteStore();

  useEffect(() => {
    fetchDashboardSummary();
    const interval = setInterval(fetchDashboardSummary, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardSummary]);

  const statCards = [
    { 
      label: '今日投注总额', 
      value: dashboardSummary?.totalBetAmount ? formatCurrency(dashboardSummary.totalBetAmount) : '--', 
      icon: DollarSign, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: '今日赛事', 
      value: dashboardSummary?.todayMatches?.toString() || '--', 
      icon: Calendar, 
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    { 
      label: '正在进行', 
      value: dashboardSummary?.liveMatches?.toString() || '--', 
      icon: Radio, 
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    { 
      label: '价值机会', 
      value: dashboardSummary?.valueOpportunities?.toString() || '--', 
      icon: Target, 
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    { 
      label: '异常检测', 
      value: dashboardSummary?.anomaliesDetected?.toString() || '--', 
      icon: AlertTriangle, 
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    },
    { 
      label: '平均爆冷率', 
      value: dashboardSummary?.avgUpsetRate ? formatPercent(dashboardSummary.avgUpsetRate) : '--', 
      icon: Zap, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
  ];

  return (
    <div className="min-h-screen bg-esports-bg">
      <Header 
        title="总览仪表盘" 
        subtitle="电竞赛事投注数据分析概览"
      />
      
      <main className="p-8 ml-64">
        {loading.dashboardSummary ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {statCards.map((card, index) => (
                <div 
                  key={card.label}
                  className="stat-card"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-display font-bold text-white mb-1">{card.value}</p>
                  <p className="text-sm text-slate-400">{card.label}</p>
                </div>
              ))}
            </div>

            {dashboardSummary?.biggestUpset && (
              <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-yellow-400">最大爆冷预警</span>
                </div>
                <p className="text-white">
                  <span className="font-bold">{dashboardSummary.biggestUpset.favorite}</span> 
                  {' vs '}
                  <span className="font-bold">{dashboardSummary.biggestUpset.underdog}</span>
                  {' - '}
                  <span className="text-green-400 font-bold">{dashboardSummary.biggestUpset.winner}</span>
                  {' 获胜，爆冷指数 '}
                  <span className="text-yellow-400 font-bold">{dashboardSummary.biggestUpset.upsetMagnitude.toFixed(1)}</span>
                </p>
              </div>
            )}

            {favoriteTeams.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <h3 className="font-display font-semibold text-lg text-white">我的关注战队</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                    {favoriteTeams.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {favoriteTeams.map((team) => (
                    <div
                      key={team.id}
                      className="group stat-card p-4 cursor-pointer hover:scale-[1.02] transition-all duration-300"
                      onClick={() => navigate(`/team-history?team=${team.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{team.name}</p>
                            <p className="text-xs text-slate-400">{team.league}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(team.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all shrink-0"
                          title="取消关注"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-3 pt-3 border-t border-esports-border/30 flex items-center justify-between">
                        <span className="text-xs text-slate-400">查看交锋</span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-display font-semibold text-lg text-white mb-4">功能模块</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {navCards.map((card, index) => (
                <Link
                  key={card.path}
                  to={card.path}
                  className="group stat-card hover:scale-[1.02] transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg mb-4`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <h4 className="font-display font-semibold text-white mb-2">{card.label}</h4>
                  <p className="text-sm text-slate-400">{card.desc}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
