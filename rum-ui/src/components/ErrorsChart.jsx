import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useChartTheme } from '../hooks/useChartTheme';
import { countSeries } from '../lib/metrics';
import { Panel, EmptyState } from './ui/primitives';
import { tickFormatter } from './WebVitalsChart';

const CountTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="panel px-3 py-2 text-[12px]" style={{ boxShadow: 'var(--shadow-pop)' }}>
      <p className="text-[var(--text-tertiary)] num">{format(new Date(p.t), 'MMM d, HH:mm')}</p>
      <p className="mt-0.5 text-[var(--text-primary)] font-medium num">
        {p.count} {p.count === 1 ? 'error' : 'errors'}
      </p>
    </div>
  );
};

/** Error volume over time. */
export const ErrorsTimeline = ({ data, range, height = 180 }) => {
  const colors = useChartTheme();
  const series = useMemo(() => countSeries(data || [], range), [data, range]);

  return (
    <Panel
      title="Error volume"
      subtitle="Errors captured per interval"
      actions={<span className="chip num">{(data || []).length} total</span>}
    >
      {!data || data.length === 0 ? (
        <EmptyState compact icon="check" title="No errors in this range" />
      ) : (
        <div style={{ height }} className="px-1 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis
                dataKey="t"
                tickFormatter={tickFormatter(range)}
                tick={{ fill: colors['text-muted'], fontSize: 11 }}
                axisLine={{ stroke: colors.axis }}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis width={36} allowDecimals={false} tick={{ fill: colors['text-muted'], fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CountTooltip />} cursor={{ fill: colors.grid }} />
              <Bar dataKey="count" fill={colors['series-2']} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
};

/** Errors grouped by type as a ranked list with inline bars. */
export const ErrorsChart = ({ data }) => {
  const rows = useMemo(() => {
    const grouped = {};
    (data || []).forEach((e) => {
      const k = e.errorType || 'unknown';
      grouped[k] = (grouped[k] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const max = rows[0]?.count || 1;
  const total = (data || []).length;

  return (
    <Panel title="Errors by type" subtitle="Share of all captured errors">
      {rows.length === 0 ? (
        <EmptyState compact icon="check" title="No errors in this range" />
      ) : (
        <ul className="px-4 py-3 space-y-3">
          {rows.map((r) => (
            <li key={r.type}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="mono text-[12px] text-[var(--text-primary)] truncate">{r.type}</span>
                <span className="num text-[var(--text-secondary)]">
                  {r.count}
                  <span className="ml-2 text-[var(--text-muted)]">{Math.round((r.count / total) * 100)}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--series-2)]" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
