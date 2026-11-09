import { useState, useEffect, useRef } from 'react';
import { rumAPI } from '../services/apiService';
import { useLiveMode } from '../contexts/LiveModeContext';

/**
 * @param timeRange number (rolling window in ms, ending now) or { start, end } (absolute, ms)
 */
export const useRUMData = (timeRange = 3600000) => {
  const { isLive, refreshInterval } = useLiveMode();
  const isFirstLoad = useRef(true);
  const [data, setData] = useState({
    webVitals: [],
    errors: [],
    pageViews: [],
    pageSpeed: [],
    pageSpeedStats: [],
    stats: {},
    loading: true,
    error: null,
    lastUpdate: null,
  });

  const isAbsolute = typeof timeRange === 'object' && timeRange !== null;
  const key = isAbsolute ? `${timeRange.start}-${timeRange.end}` : String(timeRange);

  useEffect(() => {
    let cancelled = false;
    isFirstLoad.current = true;

    const fetchData = async () => {
      try {
        if (isFirstLoad.current) {
          setData((prev) => ({ ...prev, loading: true, error: null }));
        }

        const endTime = isAbsolute ? timeRange.end : Date.now();
        const startTime = isAbsolute ? timeRange.start : endTime - timeRange;

        const [vitalsRes, errorsRes, pageViewsRes, pageSpeedRes, pageSpeedStatsRes, statsRes] = await Promise.all([
          rumAPI.getWebVitals(startTime, endTime),
          rumAPI.getErrors(startTime, endTime),
          rumAPI.getPageViews(startTime, endTime),
          rumAPI.getPageSpeed(startTime, endTime),
          rumAPI.getPageSpeedStats(startTime, endTime),
          rumAPI.getDashboardStats(startTime, endTime),
        ]);

        if (cancelled) return;
        setData({
          webVitals: vitalsRes || [],
          errors: errorsRes || [],
          pageViews: pageViewsRes || [],
          pageSpeed: pageSpeedRes || [],
          pageSpeedStats: pageSpeedStatsRes || [],
          stats: statsRes || {},
          loading: false,
          error: null,
          lastUpdate: new Date(),
        });
        isFirstLoad.current = false;
      } catch (err) {
        if (cancelled) return;
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err.message || 'Request failed',
        }));
      }
    };

    fetchData();

    if (isLive) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isLive, refreshInterval]);

  return data;
};
