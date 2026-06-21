import { Bell, Search, RefreshCw, Settings, Command } from 'lucide-react';
import { useDataStore } from '../../store/useDataStore';
import { useSearchStore } from '../../store/useSearchStore';
import { useMemo } from 'react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { oddsAlerts, readAlertIds, setAlertsPanelOpen } = useDataStore();
  const { setOpen: setSearchOpen } = useSearchStore();

  const unreadCount = useMemo(
    () => oddsAlerts.filter(a => !readAlertIds.has(a.id)).length,
    [oddsAlerts, readAlertIds]
  );

  return (
    <header className="h-16 bg-esports-surface/50 backdrop-blur-xl border-b border-esports-border/50 flex items-center justify-between px-8 sticky top-0 z-30">
      <div>
        {title && <h2 className="font-display font-semibold text-xl text-white tracking-wide">{title}</h2>}
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setSearchOpen(true)}
          className="relative w-64 flex items-center gap-2 px-3 py-2 bg-esports-card/50 border border-esports-border/50 rounded-lg text-sm text-slate-400 hover:text-white hover:border-blue-500/50 transition-colors group"
        >
          <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
          <span className="flex-1 text-left">搜索赛事、战队...</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-esports-bg/50 rounded text-xs text-slate-500 group-hover:text-slate-400">
            <Command className="w-3 h-3" />
            K
          </kbd>
        </button>

        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-esports-card/50 transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>

        <button
          onClick={() => setAlertsPanelOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-esports-card/50 transition-colors relative"
          aria-label="告警通知"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-esports-card/50 transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:scale-105 transition-transform">
          A
        </div>
      </div>
    </header>
  );
}
