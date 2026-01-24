import React, { useState } from 'react';
import { useRUMData } from '../hooks/useRUMData';
import { Header } from './Header';
import { MetricsCard } from './MetricsCard';
import { LoadingSpinner } from './LoadingSpinner';
import { format } from 'date-fns';

export const AnalyticsView = () => {
  const [timeRange, setTimeRange] = useState(3600000);
  const { webVitals, errors, pageViews, stats, loading } = useRUMData(timeRange);

  const analytics = {
    totalPageViews: stats.totalPageViews || pageViews.length,
    uniqueUsers: stats.uniqueUsers || 0,
    uniqueSessions: stats.uniqueSessions || 0,
    avgPageLoadTime: stats.avgPageLoadTime || 0,
    errorRate: stats.totalPageViews > 0 ? (errors.length / stats.totalPageViews * 100) : 0,
    avgLCP: webVitals.filter(v => v.metricName === 'LCP').length > 0
      ? webVitals.filter(v => v.metricName === 'LCP')
        .reduce((sum, v) => sum + v.value, 0) / webVitals.filter(v => v.metricName === 'LCP').length
      : 0,
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Analytics"
        subtitle="Comprehensive RUM analytics and insights"
        timeRange={timeRange}
        setTimeRange={setTimeRange}
      />
      <div className="p-6">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <MetricsCard
                title="Page Views"
                value={analytics.totalPageViews}
                unit=""
                status="good"
                iconSrc="/assets/icons/document.svg"
              />
              <MetricsCard
                title="Unique Users"
                value={analytics.uniqueUsers}
                unit=""
                status="good"
                iconSrc="/assets/icons/user.svg"
              />
              <MetricsCard
                title="Sessions"
                value={analytics.uniqueSessions}
                unit=""
                status="good"
                iconSrc="/assets/icons/users.svg"
              />
              <MetricsCard
                title="Avg Load Time"
                value={analytics.avgPageLoadTime}
                unit="ms"
                status={analytics.avgPageLoadTime < 1000 ? 'good' : 'needs-improvement'}
                iconSrc="/assets/icons/speed.svg"
              />
              {/* <MetricsCard
                title="Error Rate"
                value={analytics.errorRate}
                unit="%"
                status={analytics.errorRate < 1 ? 'good' : analytics.errorRate < 5 ? 'needs-improvement' : 'poor'}
                iconSrc="/assets/icons/error.svg"
              /> */}
              <MetricsCard
                title="Avg LCP"
                value={analytics.avgLCP}
                unit="ms"
                status={analytics.avgLCP <= 2500 ? 'good' : analytics.avgLCP <= 4000 ? 'needs-improvement' : 'poor'}
                iconSrc="/assets/icons/graph.svg"
              />
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Performance Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Total Events Collected</span>
                  <span className="text-[var(--text-primary)] font-medium">{webVitals.length + errors.length + pageViews.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Web Vitals Events</span>
                  <span className="text-[var(--text-primary)] font-medium">{webVitals.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Error Events</span>
                  <span className="text-[var(--text-primary)] font-medium">{errors.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Page View Events</span>
                  <span className="text-[var(--text-primary)] font-medium">{pageViews.length}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
