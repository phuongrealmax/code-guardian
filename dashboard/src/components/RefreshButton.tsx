'use client';

import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onClick: () => void;
  isRefreshing: boolean;
  lastRefresh: Date;
}

export function RefreshButton({ onClick, isRefreshing, lastRefresh }: RefreshButtonProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <button
      onClick={onClick}
      disabled={isRefreshing}
      className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg
                 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600
                 text-gray-600 dark:text-gray-300 transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Refresh data"
    >
      <RefreshCw
        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">
        {isRefreshing ? 'Refreshing...' : `Updated ${formatTime(lastRefresh)}`}
      </span>
    </button>
  );
}
