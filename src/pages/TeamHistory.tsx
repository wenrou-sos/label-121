import { useEffect, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { formatPercent, formatDuration, formatDate } from '../utils/formatters';
import Header from '../components/layout/Header';
import LineChart from '../components/charts/LineChart';
import { Swords, Trophy, Clock, Target, ChevronDown, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function TeamHistory() {
  const [team1, setTeam1] = useState('T1');
  const [team2, setTeam2] = useState('GEN');
  const { teamHistory, fetchTeamHistory, loading } = useDataStore();

  useEffect(() => {
    if (team1 && team2 && team1 !== team2) {
      fetchTeamHistory(team1, team2);
    }
  }, [fetchTeamHistory, team1, team2]);

  const winTrendData = teamHistory && teamHistory.hasHistory ? [{
    x: teamHistory.winTrend.map(w => w.date),
    y: teamHistory.winTrend.map(w => w.value),
    name: `${teamHistory.team1Name} 领先`,
    color: '#3b82f6'
  }] : [];

  const handleSwapTeams = () => {
    const temp = team1;
    setTeam1(team2);
    setTeam2(temp);
  };

  return (
    <div className="min-h-screen bg-esports-bg">
      <Header 
        title="战队交锋历史分析" 
        subtitle="两队过往交锋记录统计与胜率趋势分析"
      />
      
      <main className="p-8 ml-64">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">选择战队:</span>
          </div>
          
          <div className="relative">
            <select
              value={team1}
              onChange={(e) => setTeam1(e.target.value)}
              className="px-4 py-2 pr-10 bg-esports-card border border-blue-500/30 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none min-w-[180px]"
            >
              {teamHistory?.allTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          
          <span className="text-slate-500">VS</span>
          
          <div className="relative">
            <select
              value={team2}
              onChange={(e) => setTeam2(e.target.value)}
              className="px-4 py-2 pr-10 bg-esports-card border border-green-500/30 rounded-lg text-sm text-white focus:outline-none focus:border-green-500/50 appearance-none min-w-[180px]"
            >
              {teamHistory?.allTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button 
            onClick={handleSwapTeams}
            className="btn-secondary text-sm"
          >
            交换
          </button>
        </div>

        {loading.teamHistory ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : teamHistory ? (
          teamHistory.hasHistory ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="stat-card text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-slate-400">总交锋</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-white">
                    {teamHistory.totalMatches}
                  </p>
                </div>
                <div className="stat-card text-center border-l-4 border-l-blue-500">
                  <div className="text-sm text-blue-400 mb-2">{teamHistory.team1Name}</div>
                  <p className="text-3xl font-display font-bold text-blue-400">
                    {teamHistory.team1Wins}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">{formatPercent(teamHistory.team1WinRate)}</p>
                </div>
                <div className="stat-card text-center">
                  <div className="text-sm text-slate-400 mb-2">胜率对比</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-blue-400 font-bold">{formatPercent(teamHistory.team1WinRate)}</span>
                    <span className="text-slate-600">-</span>
                    <span className="text-green-400 font-bold">{formatPercent(teamHistory.team2WinRate)}</span>
                  </div>
                  <div className="mt-2 h-2 bg-esports-border/30 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${teamHistory.team1WinRate * 100}%` }}
                    />
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${teamHistory.team2WinRate * 100}%` }}
                    />
                  </div>
                </div>
                <div className="stat-card text-center border-l-4 border-l-green-500">
                  <div className="text-sm text-green-400 mb-2">{teamHistory.team2Name}</div>
                  <p className="text-3xl font-display font-bold text-green-400">
                    {teamHistory.team2Wins}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">{formatPercent(teamHistory.team2WinRate)}</p>
                </div>
                <div className="stat-card text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-slate-400">BO3场均时长</span>
                  </div>
                  <p className="text-3xl font-display font-bold text-white">
                    {formatDuration(teamHistory.avgBo3Duration)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="stat-card col-span-2">
                  <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    历史对战趋势
                  </h3>
                  <LineChart 
                    data={winTrendData}
                    height={300}
                    yAxisTitle="领先场次"
                  />
                  <p className="text-xs text-slate-500 text-center mt-2">
                    正值表示 {teamHistory.team1Name} 领先，负值表示 {teamHistory.team2Name} 领先
                  </p>
                </div>

                <div className="stat-card">
                  <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-yellow-400" />
                    关键指标
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">打满场次比例</span>
                      <span className="text-white font-semibold">{formatPercent(teamHistory.fullSetRate)}</span>
                    </div>
                    <div className="h-2 bg-esports-border/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${teamHistory.fullSetRate * 100}%` }}
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-esports-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400">近5场 {teamHistory.team1Name} 胜率</span>
                        <span className="text-blue-400 font-semibold">
                          {formatPercent(
                            teamHistory.matchHistory.slice(0, 5).filter(m => m.winner === team1).length / Math.min(5, teamHistory.matchHistory.length || 1)
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">近5场 {teamHistory.team2Name} 胜率</span>
                        <span className="text-green-400 font-semibold">
                          {formatPercent(
                            teamHistory.matchHistory.slice(0, 5).filter(m => m.winner === team2).length / Math.min(5, teamHistory.matchHistory.length || 1)
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-esports-border/30">
                      <div className="flex items-center gap-2">
                        {teamHistory.team1WinRate > teamHistory.team2WinRate ? (
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                        ) : teamHistory.team1WinRate < teamHistory.team2WinRate ? (
                          <TrendingDown className="w-5 h-5 text-green-400" />
                        ) : (
                          <Target className="w-5 h-5 text-slate-400" />
                        )}
                        <span className="text-sm text-slate-300">
                          {teamHistory.team1WinRate > teamHistory.team2WinRate 
                            ? `${teamHistory.team1Name} 占据历史优势`
                            : teamHistory.team1WinRate < teamHistory.team2WinRate
                            ? `${teamHistory.team2Name} 占据历史优势`
                            : '两队历史交锋持平'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <Swords className="w-5 h-5 text-purple-400" />
                  历史对战记录
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-esports-border/50">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">日期</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">赛制</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">{teamHistory.team1Name}</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">比分</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">{teamHistory.team2Name}</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">时长</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">获胜方</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamHistory.matchHistory.map((match, index) => (
                        <tr key={index} className="border-b border-esports-border/30 hover:bg-esports-card/30 transition-colors">
                          <td className="py-3 px-4 text-slate-300 text-sm">{formatDate(match.date)}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                              BO{match.boFormat}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-blue-400 font-medium">{match.team1Score}</td>
                          <td className="py-3 px-4 text-white font-bold">{match.score}</td>
                          <td className="py-3 px-4 text-green-400 font-medium">{match.team2Score}</td>
                          <td className="py-3 px-4 text-slate-300">{formatDuration(match.duration)}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${match.winner === team1 ? 'text-blue-400' : 'text-green-400'}`}>
                              {match.winnerName}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="stat-card flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-16 h-16 text-yellow-500/50 mb-4" />
              <h3 className="font-display font-semibold text-xl text-white mb-2">暂无交锋记录</h3>
              <p className="text-slate-400 text-center max-w-md">
                <span className="font-semibold text-blue-400">{teamHistory.team1Name}</span>
                {' 与 '}
                <span className="font-semibold text-green-400">{teamHistory.team2Name}</span>
                {' 在历史上尚无正式比赛记录。请尝试选择其他战队组合。'}
              </p>
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}
