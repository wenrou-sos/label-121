import { useEffect, useRef, useMemo } from 'react';
import { Search, X, Users, Trophy, Swords, Command } from 'lucide-react';
import { useSearchStore, type SearchResult, type SearchResultType } from '../../store/useSearchStore';
import { cn } from '../../lib/utils';

const TYPE_ICONS: Record<SearchResultType, React.ReactNode> = {
  team: <Users className="w-4 h-4" />,
  league: <Trophy className="w-4 h-4" />,
  match: <Swords className="w-4 h-4" />
};

const TYPE_LABELS: Record<SearchResultType, string> = {
  team: '战队',
  league: '联赛',
  match: '比赛'
};

const TYPE_COLORS: Record<SearchResultType, string> = {
  team: 'text-blue-400',
  league: 'text-purple-400',
  match: 'text-green-400'
};

export default function SearchModal() {
  const {
    open,
    query,
    selectedIndex,
    setOpen,
    setQuery,
    setSelectedIndex,
    search,
    navigateToResult
  } = useSearchStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => search(query), [query, search]);

  const groupedResults = useMemo(() => {
    const groups: Record<SearchResultType, SearchResult[]> = {
      team: [],
      league: [],
      match: []
    };
    results.forEach(r => groups[r.type].push(r));
    return groups;
  }, [results]);

  const flatResults = useMemo(() => {
    const flat: SearchResult[] = [];
    (['team', 'league', 'match'] as SearchResultType[]).forEach(type => {
      flat.push(...groupedResults[type]);
    });
    return flat;
  }, [groupedResults]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, flatResults.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
        return;
      }

      if (e.key === 'Enter' && flatResults.length > 0) {
        e.preventDefault();
        const selected = flatResults[selectedIndex];
        if (selected) navigateToResult(selected);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedIndex, flatResults, setOpen, setSelectedIndex, navigateToResult]);

  useEffect(() => {
    if (!resultsRef.current || selectedIndex < 0) return;
    const selectedEl = resultsRef.current.querySelector<HTMLElement>(`[data-result-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!open) return null;

  const handleResultClick = (result: SearchResult) => {
    navigateToResult(result);
  };

  const getGroupOffset = (type: SearchResultType): number => {
    let offset = 0;
    const types: SearchResultType[] = ['team', 'league', 'match'];
    for (const t of types) {
      if (t === type) break;
      offset += groupedResults[t].length > 0 ? groupedResults[t].length + 1 : 0;
    }
    return offset;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-2xl mx-4 bg-esports-card border border-esports-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-esports-border/50">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索战队、联赛、比赛..."
            className="flex-1 bg-transparent text-white text-lg placeholder-slate-500 focus:outline-none"
          />
          <div className="flex items-center gap-1 px-2 py-1 bg-esports-bg/50 rounded text-xs text-slate-400">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-esports-bg/50 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={resultsRef}
          className="max-h-[50vh] overflow-y-auto"
        >
          {flatResults.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">
                {query ? '没有找到匹配的结果' : '输入关键词开始搜索'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                支持战队名、联赛名、比赛名模糊匹配
              </p>
            </div>
          ) : (
            <div className="py-2">
              {(['team', 'league', 'match'] as SearchResultType[]).map(type => {
                const group = groupedResults[type];
                if (group.length === 0) return null;
                const groupOffset = getGroupOffset(type);

                return (
                  <div key={type} className="px-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <span className={cn(TYPE_COLORS[type])}>{TYPE_ICONS[type]}</span>
                      {TYPE_LABELS[type]}
                      <span className="ml-auto text-slate-600">{group.length}</span>
                    </div>
                    {group.map((result, idx) => {
                      const globalIdx = groupOffset + idx;
                      const isSelected = globalIdx === selectedIndex;
                      return (
                        <button
                          key={result.id}
                          data-result-index={globalIdx}
                          onClick={() => handleResultClick(result)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                            isSelected
                              ? 'bg-blue-500/20 text-white'
                              : 'text-slate-300 hover:bg-esports-bg/50'
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            isSelected ? 'bg-blue-500/30' : 'bg-esports-bg/50',
                            TYPE_COLORS[type]
                          )}>
                            {TYPE_ICONS[type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'font-medium truncate',
                              isSelected ? 'text-white' : 'text-slate-200'
                            )}>
                              {result.name}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-slate-500 truncate">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <span className="px-1.5 py-0.5 bg-esports-bg/50 rounded text-slate-500">Enter</span>
                              前往
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-esports-border/50 bg-esports-bg/30 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-esports-card rounded text-slate-400">↑↓</span>
              导航
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-esports-card rounded text-slate-400">ESC</span>
              关闭
            </span>
          </div>
          <span>共 {flatResults.length} 条结果</span>
        </div>
      </div>
    </div>
  );
}
