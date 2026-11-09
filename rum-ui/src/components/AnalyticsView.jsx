import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { PageShell } from './PageShell';
import { Panel, StatTile, EmptyState, fmtInt, fmtMs } from './ui/primitives';
import { useRangeData } from './Dashboard';
import { countSeries } from '../lib/metrics';
import { useChartTheme } from '../hooks/useChartTheme';
import { tickFormatter } from './WebVitalsChart';

const TrafficTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="panel px-3 py-2 text-[12px]" style={{ boxShadow: 'var(--shadow-pop)' }}>
      <p className="text-[var(--text-tertiary)] num">{format(new Date(p.t), 'MMM d, HH:mm')}</p>
      <p className="mt-0.5 text-[var(--text-primary)] font-medium num">{p.count} page views</p>
    </div>
  );
};

const TopPages = ({ pageViews }) => {
  const rows = useMemo(() => {
    const m = {};
    pageViews.forEach((v) => {
      let path = v.pagePath || v.pageUrl || '–';
      try {
        path = new URL(path).pathname;
      } catch {
        /* already a path */
      }
      m[path] = (m[path] || 0) + 1;
    });
    return Object.entries(m)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [pageViews]);
  const max = rows[0]?.count || 1;

  return (
    <Panel title="Top pages" subtitle="By page views">
      {rows.length === 0 ? (
        <EmptyState compact title="No page views in this range" />
      ) : (
        <ul className="px-4 py-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.path} className="relative">
              <div className="absolute inset-y-0 left-0 rounded bg-[var(--accent-soft)]" style={{ width: `${(r.count / max) * 100}%` }} />
              <div className="relative flex justify-between gap-3 px-2 py-1 text-[13px]">
                <span className="truncate text-[var(--text-primary)]" title={r.path}>{r.path}</span>
                <span className="num text-[var(--text-secondary)]">{r.count}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

export const AnalyticsView = () => {
  const [timeRange, setTimeRange] = useState(3600000);
  const data = useRangeData(timeRange);
  const { webVitals, errors, pageViews, stats, range } = data;
  const colors = useChartTheme();
  const series = useMemo(() => countSeries(pageViews, range), [pageViews, range]);

  const views = stats.totalPageViews ?? pageViews.length;
  const load = fmtMs(stats.avgPageLoadTime || null);
  const totalEvents = webVitals.length + errors.length + pageViews.length;

  const mix = [
    { label: 'Web Vitals', n: webVitals.length, color: 'var(--series-1)' },
    { label: 'Page views', n: pageViews.length, color: 'var(--series-3)' },
    { label: 'Errors', n: errors.length, color: 'var(--series-2)' },
  ];

  return (
    <PageShell
      title="Analytics"
      subtitle="Traffic and event volume"
      timeRange={timeRange}
      setTimeRange={setTimeRange}
      data={data}
    >
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <StatTile label="Page views" value={fmtInt(views)} />
        <StatTile label="Unique users" value={fmtInt(stats.uniqueUsers ?? 0)} />
        <StatTile label="Sessions" value={fmtInt(stats.uniqueSessions ?? 0)} />
        <StatTile label="Avg page load" value={load.value} unit={load.unit} />
      </div>

      <Panel title="Page views over time">
        {pageViews.length === 0 ? (
          <EmptyState compact title="No page views in this range" />
        ) : (
          <div className="h-[240px] px-1 py-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pvFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors['series-1']} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={colors['series-1']} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={colors.grid} />
                <XAxis dataKey="t" tickFormatter={tickFormatter(range)} tick={{ fill: colors['text-muted'], fontSize: 11 }} axisLine={{ stroke: colors.axis }} tickLine={false} minTickGap={40} />
                <YAxis width={36} allowDecimals={false} tick={{ fill: colors['text-muted'], fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TrafficTooltip />} cursor={{ stroke: colors.axis }} />
                <Area type="monotone" dataKey="count" stroke={colors['series-1']} strokeWidth={2} fill="url(#pvFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
        <TopPages pageViews={pageViews} />
        <Panel title="Event mix" subtitle={`${fmtInt(totalEvents)} events received in range`}>
          <div className="px-4 py-4 space-y-4">
            <div className="flex h-2.5 gap-[2px] rounded-full overflow-hidden bg-[var(--bg-tertiary)]">
              {totalEvents > 0 &&
                mix.filter((m) => m.n > 0).map((m) => (
                  <div key={m.label} style={{ width: `${(m.n / totalEvents) * 100}%`, background: m.color }} title={`${m.label}: ${m.n}`} />
                ))}
            </div>
            <table className="dtable">
              <tbody>
                {mix.map((m) => (
                  <tr key={m.label}>
                    <td className="pl-0">
                      <span className="inline-flex items-center gap-2 text-[var(--text-primary)]">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: m.color }} />
                        {m.label}
                      </span>
                    </td>
                    <td className="r">{fmtInt(m.n)}</td>
                    <td className="r pr-0 text-[var(--text-muted)]">{totalEvents ? `${((m.n / totalEvents) * 100).toFixed(0)}%` : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
};
