export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `¥${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `¥${(value / 1000).toFixed(1)}K`;
  }
  return `¥${value.toFixed(0)}`;
};

export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const formatOdds = (value: number): string => {
  return value.toFixed(2);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
