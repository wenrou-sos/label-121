import { Bell, Search, RefreshCw, Settings } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 bg-esports-surface/50 backdrop-blur-xl border-b border-esports-border/50 flex items-center justify-between px-8 sticky top-0 z-30">
      <div>
        {title && <h2 className="font-display font-semibold text-xl text-white tracking-wide">{title}</h2>}
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="搜索赛事、战队..." 
            className="w-64 pl-10 pr-4 py-2 bg-esports-card/50 border border-esports-border/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-esports-card/50 transition-colors">
          <RefreshCw className="w-5 h-5" />
        </button>
        
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-esports-card/50 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
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
