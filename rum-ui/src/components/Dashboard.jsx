import React, { useMemo, useState } from 'react';
import { useRUMData } from '../hooks/useRUMData';
import { summarizeVitals, resolveRange } from '../lib/metrics';
import { PageShell } from './PageShell';
import { StatTile, ThresholdMeter, VITALS, rate, fmtMetric, fmtInt, fmtMs, fmtThreshold } from './ui/primitives';
import { WebVitalsChart } from './WebVitalsChart';
import { ErrorsTimeline, ErrorsChart } from './ErrorsChart';
import { SessionsTable, buildSessions } from './SessionsTable';
import { PageSpeedTable } from './PageSpeedTable';

export const VitalTile = ({ name, summary }) => {
  const t = VITALS[name];
  const s = summary[name];
  const f = fmtMetric(name, s.p75);
  return (
    <StatTile
      label={`${name} · p75`}
      value={f.value}
      unit={f.unit}
      status={rate(s.p75, t.good, t.poor)}
      meter={<ThresholdMeter value={s.p75} good={t.good} poor={t.poor} />}
      hint={s.count ? `Good ${fmtThreshold(name)} · ${s.count} samples` : 'No samples'}
    />
  );
};

export const useRangeData = (timeRange) => {
  const data = useRUMData(timeRange);
  // Recompute the window whenever fresh data lands so rolling ranges move with "now".
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const range = useMemo(() => resolveRange(timeRange), [timeRange, data.lastUpdate]);
  return { ...data, range };
};

export const Dashboard = () => {
  const [timeRange, setTimeRange] = useState(3600000);
  const data = useRangeData(timeRange);
  const { webVitals, errors, pageViews, pageSpeedStats, stats, range } = data;

  const summary = useMemo(() => summarizeVitals(webVitals), [webVitals]);
  const sessionCount = useMemo(
    () => stats.uniqueSessions ?? buildSessions(webVitals, errors).length,
    [stats.uniqueSessions, webVitals, errors]
  );
  const views = stats.totalPageViews ?? pageViews.length;
  const load = fmtMs(stats.avgPageLoadTime || null);
  const errorRate = views > 0 ? (errors.length / views) * 100 : null;

  return (
    <PageShell
      title="Overview"
      subtitle="Traffic, Core Web Vitals and errors from real users"
      timeRange={timeRange}
      setTimeRange={setTimeRange}
      data={data}
      tiles={8}
    >
      <section aria-label="Traffic" className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <StatTile label="Sessions" value={fmtInt(sessionCount)} hint={`${fmtInt(stats.uniqueUsers ?? 0)} unique users`} />
        <StatTile label="Page views" value={fmtInt(views)} hint={sessionCount ? `${(views / sessionCount).toFixed(1)} per session` : ' '} />
        <StatTile label="Avg page load" value={load.value} unit={load.unit} hint="Navigation start to load event" />
        <StatTile
          label="Errors"
          value={fmtInt(errors.length)}
          status={errors.length === 0 ? 'good' : errorRate > 5 ? 'critical' : 'warning'}
          hint={errorRate == null ? 'No page views yet' : `${errorRate.toFixed(1)} per 100 page views`}
        />
      </section>

      <section aria-label="Core Web Vitals" className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        {['LCP', 'INP', 'CLS', 'FCP'].map((m) => (
          <VitalTile key={m} name={m} summary={summary} />
        ))}
      </section>

      <WebVitalsChart data={webVitals} range={range} summary={summary} />

      <div className="grid gap-3 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ErrorsTimeline data={errors} range={range} height={220} />
        </div>
        <ErrorsChart data={errors} />
      </div>

      <div className="grid gap-3 grid-cols-1 2xl:grid-cols-2">
        <PageSpeedTable data={pageSpeedStats} limit={8} />
        <SessionsTable webVitals={webVitals} errors={errors} pageSize={8} />
      </div>
    </PageShell>
  );
};
