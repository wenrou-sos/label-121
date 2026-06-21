import { useDataStore } from '../../store/useDataStore';
import { X, AlertTriangle, TrendingUp, TrendingDown, CheckCheck } from 'lucide-react';
import { formatDateTime, formatPercent } from '../../utils/formatters';
import type { OddsAlert } from '../../types';

function AlertRow({ alert, isRead }: { alert: OddsAlert; isRead: boolean }) {
  const isDown = alert.changePercent < 0;
  return (
    <div className={`flex items-start gap-3 p-3 border-b border-esports-border/30 hover:bg-esports-card/30 transition-colors ${isRead ? 'opacity-60' : ''}`}>
      <div className={`p-2 rounded-lg flex-shrink-0 ${isDown ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
        {isDown ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-medium text-white truncate">{alert.matchName}</span>
          <span className="text-xs text-slate-500 flex-shrink-0">{formatDateTime(alert.timestamp)}</span>
        </div>
        <p className={`text-sm font-semibold ${isDown ? 'text-red-400' : 'text-yellow-400'}`}>
          {alert.team} {isDown ? '赔率下跌' : '赔率上涨'} {formatPercent(Math.abs(alert.changePercent))}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {alert.startOdds.toFixed(2)} → {alert.endOdds.toFixed(2)}
        </p>
      </div>
      {!isRead && (
        <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
}

export default function AlertsPanel() {
  const {
    oddsAlerts,
    readAlertIds,
    alertsPanelOpen,
    setAlertsPanelOpen,
    markAllAlertsRead
  } = useDataStore();

  if (!alertsPanelOpen) return null;

  const unreadCount = oddsAlerts.filter(a => !readAlertIds.has(a.id)).length;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => setAlertsPanelOpen(false)}
      />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-esports-surface/95 backdrop-blur-xl border-l border-esports-border/50 z-50 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-esports-border/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-lg">赔率异动提醒</h3>
              <p className="text-xs text-slate-500">共 {oddsAlerts.length} 条告警</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {oddsAlerts.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAlertsRead}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                全部已读
              </button>
            )}
            <button
              onClick={() => setAlertsPanelOpen(false)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-esports-card/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {oddsAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <AlertTriangle className="w-14 h-14 text-slate-700 mb-4" />
              <h4 className="font-medium text-white mb-1">暂无赔率异动</h4>
              <p className="text-sm text-slate-500">
                系统会每 30 秒自动扫描，检测到超过 30% 的赔率波动会立即通知您。
              </p>
            </div>
          ) : (
            oddsAlerts.map(alert => (
              <AlertRow
                key={alert.id}
                alert={alert}
                isRead={readAlertIds.has(alert.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
