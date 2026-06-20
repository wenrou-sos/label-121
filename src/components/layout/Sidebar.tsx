import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Activity, 
  Zap, 
  Swords, 
  Radio,
  Trophy
} from 'lucide-react';

const navItems = [
  { path: '/', label: '总览仪表盘', icon: LayoutDashboard },
  { path: '/bet-distribution', label: '投注分布分析', icon: TrendingUp },
  { path: '/odds-tracking', label: '赔率变动追踪', icon: Activity },
  { path: '/upset-analysis', label: '爆冷赛事分析', icon: Zap },
  { path: '/team-history', label: '战队交锋历史', icon: Swords },
  { path: '/live-analysis', label: '实时滚球分析', icon: Radio },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-esports-surface/80 backdrop-blur-xl border-r border-esports-border/50 flex flex-col fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-esports-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-glow">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white tracking-wide">EsportBet</h1>
            <p className="text-xs text-slate-400">数据分析看板</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-esports-border/50">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400">系统状态</span>
          </div>
          <p className="text-sm font-medium text-white">API服务正常运行</p>
          <p className="text-xs text-slate-500 mt-1">数据更新于 {new Date().toLocaleTimeString('zh-CN')}</p>
        </div>
      </div>
    </aside>
  );
}
