import React from 'react';
import { Header } from './Header';
import { ErrorBanner, SkeletonGrid } from './ui/primitives';
import { API_BASE_URL } from '../services/apiService';

/**
 * Header + body wrapper shared by every data view.
 * Shows a skeleton on first load and an inline banner when the API fails,
 * keeping stale data on screen if a refresh fails.
 */
export const PageShell = ({ title, subtitle, timeRange, setTimeRange, data, tiles = 4, children }) => {
  const hasData = data && data.lastUpdate;
  return (
    <div className="min-h-full">
      <Header
        title={title}
        subtitle={subtitle}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        lastUpdate={data ? data.lastUpdate : undefined}
      />
      <div className="px-6 py-5 max-w-[1600px] mx-auto space-y-4">
        {data?.error && <ErrorBanner message={data.error} baseUrl={API_BASE_URL} />}
        {data?.loading && !hasData ? <SkeletonGrid tiles={tiles} /> : (!data?.error || hasData) && children}
      </div>
    </div>
  );
};
