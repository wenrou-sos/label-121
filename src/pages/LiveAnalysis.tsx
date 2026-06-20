import { useEffect, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { formatPercent, formatOdds } from '../utils/formatters';
import Header from '../components/layout/Header';
import { 
  Radio, 
  Target, 
  TrendingUp, 
  Zap, 
  Coins,
  Swords,
  Timer,
  Flame,
  AlertCircle
} from 'lucide-react';
import type { LiveMatch } from '../types';

export default function LiveAnalysis() {
  const { liveAnalysis, fetchLiveAnalysis, loading } = useDataStore();
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchLiveAnalysis();
    if (autoRefresh) {
      const interval = setInterval(fetchLiveAnalysis, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchLiveAnalysis, autoRefresh]);

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'team1': return 'text-blue-400';
      case 'team2': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case 'team1': return <TrendingUp className="w-4 h-4" />;
      case 'team2': return <TrendingUp className="w-4 h-4 rotate-180" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const MatchCard = ({ match }: { match: LiveMatch }) => (
    <div className={`stat-card relative overflow-hidden ${match.valueBet ? 'ring-2 ring-yellow-500/50' : ''}`}>
      {match.valueBet && (
        <div className="absolute top-3 right-3">
          <span className="value-badge flex items-center gap-1">
            <Target className="w-3 h-3" />
            价值投注
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-red-400 font-medium">直播中</span>
          <span className="text-slate-500 text-sm">·</span>
          <span className="text-slate-400 text-sm">{match.gameTime}</span>
        </div>
        <div className={`flex items-center gap-1 ${getMomentumColor(match.momentum)}`}>
          {getMomentumIcon(match.momentum)}
          <span className="text-xs">
            {match.momentum === 'team1' ? match.team1 : match.momentum === 'team2' ? match.team2 : '均势'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <h4 className="font-bold text-white text-lg mb-1">{match.team1}</h4>
          <p className="text-3xl font-display font-bold text-blue-400">{match.currentScore[0]}</p>
        </div>
        <div className="px-6">
          <Swords className="w-6 h-6 text-slate-500" />
        </div>
        <div className="text-center flex-1">
          <h4 className="font-bold text-white text-lg mb-1">{match.team2}</h4>
          <p className="text-3xl font-display font-bold text-green-400">{match.currentScore[1]}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
        <div className="bg-esports-bg/50 rounded-lg p-2">
          <Coins className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">经济差</p>
          <p className={`font-semibold ${match.goldDiff > 0 ? 'text-blue-400' : match.goldDiff < 0 ? 'text-green-400' : 'text-white'}`}>
            {match.goldDiff > 0 ? '+' : ''}{match.goldDiff}
          </p>
        </div>
        <div className="bg-esports-bg/50 rounded-lg p-2">
          <Flame className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">击杀差</p>
          <p className={`font-semibold ${match.killDiff > 0 ? 'text-blue-400' : match.killDiff < 0 ? 'text-green-400' : 'text-white'}`}>
            {match.killDiff > 0 ? '+' : ''}{match.killDiff}
          </p>
        </div>
        <div className="bg-esports-bg/50 rounded-lg p-2">
          <Zap className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">小龙</p>
          <p className="font-semibold text-white">
            {match.dragonCount[0]} - {match.dragonCount[1]}
          </p>
        </div>
        <div className="bg-esports-bg/50 rounded-lg p-2">
          <Timer className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">防御塔</p>
          <p className="font-semibold text-white">
            {match.towerCount[0]} - {match.towerCount[1]}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">模型胜率</span>
          <span className="text-sm text-slate-400">
            {formatPercent(match.winProbability[0])} / {formatPercent(match.winProbability[1])}
          </span>
        </div>
        <div className="h-3 bg-esports-border/30 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500"
            style={{ width: `${match.winProbability[0] * 100}%` }}
          />
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
            style={{ width: `${match.winProbability[1] * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-esports-bg/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400 mb-1">当前滚球赔率</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-blue-400 font-bold">{formatOdds(match.currentOdds[0])}</span>
            <span className="text-slate-600">-</span>
            <span className="text-green-400 font-bold">{formatOdds(match.currentOdds[1])}</span>
          </div>
        </div>
        <div className="bg-esports-bg/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400 mb-1">隐含胜率</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-blue-400">{formatPercent(match.impliedProbability[0])}</span>
            <span className="text-slate-600">-</span>
            <span className="text-green-400">{formatPercent(match.impliedProbability[1])}</span>
          </div>
        </div>
      </div>

      {match.valueBet && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium text-sm">价值投注机会</p>
              <p className="text-slate-300 text-xs mt-1">{match.valueBet.recommendation}</p>
              <p className="text-yellow-400/80 text-xs mt-1">
                价值边缘: {formatPercent(match.valueBet.edge)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-esports-bg">
      <Header 
        title="实时滚球数据分析" 
        subtitle="基于比赛实时数据动态计算胜率，识别价值投注机会"
      />
      
      <main className="p-8 ml-64">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-sm text-slate-400">
                直播比赛: <span className="text-white font-semibold">{liveAnalysis?.totalLiveMatches || 0}</span> 场
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-slate-400">
                价值机会: <span className="text-yellow-400 font-semibold">{liveAnalysis?.totalValueOpportunities || 0}</span> 个
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded bg-esports-card border-esports-border text-blue-500 focus:ring-blue-500/50"
              />
              <span className="text-sm text-slate-400">自动刷新 (5秒)</span>
            </label>
            <button 
              onClick={() => fetchLiveAnalysis()}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              刷新数据
            </button>
          </div>
        </div>

        {loading.liveAnalysis ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : liveAnalysis ? (
          <>
            {liveAnalysis.valueOpportunities.length > 0 && (
              <div className="mb-6">
                <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-400" />
                  价值投注机会
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {liveAnalysis.valueOpportunities.map(match => (
                    <MatchCard key={match.matchId} match={match} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-400" />
                全部直播比赛
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {liveAnalysis.liveMatches.map(match => (
                  <MatchCard key={match.matchId} match={match} />
                ))}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
