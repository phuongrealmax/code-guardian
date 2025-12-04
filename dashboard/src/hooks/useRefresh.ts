'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseRefreshOptions {
  interval?: number; // Refresh interval in milliseconds
  enabled?: boolean;
}

export function useRefresh(options: UseRefreshOptions = {}) {
  const { interval = 30000, enabled = true } = options;
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setLastRefresh(new Date());
    // Simulate refresh delay for visual feedback
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, refresh]);

  return {
    refreshKey,
    lastRefresh,
    isRefreshing,
    refresh,
  };
}
