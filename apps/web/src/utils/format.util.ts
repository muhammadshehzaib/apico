export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return Math.round(ms) + ' ms';
  }
  return (ms / 1000).toFixed(2) + ' s';
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncateUrl = (url: string, maxLength: number = 50): string => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
};

export const formatTimeAgo = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hr ago`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} day ago`;
  }

  const weeks = Math.floor(seconds / 604800);
  return `${weeks} week ago`;
};

export const getStatusCodeColor = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) return '#22c55e';
  if (statusCode >= 300 && statusCode < 400) return '#3b82f6';
  if (statusCode >= 400 && statusCode < 500) return '#f97316';
  return '#ef4444';
};

export const getStatusCodeText = (statusCode: number): string => {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return statusTexts[statusCode] || 'Unknown';
};
