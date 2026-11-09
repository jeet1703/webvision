import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useChartTheme } from '../hooks/useChartTheme';
import { vitalSeries } from '../lib/metrics';
import { VITALS, fmtMetric, fmtThreshold, rate, StatusChip, EmptyState } from './ui/primitives';

export const tickFormatter = (range) => (t) =>
  format(new Date(t), range.end - range.start > 86400000 ? 'MMM d' : 'HH:mm');

const VitalTooltip = ({ active, payload, metric }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const f = fmtMetric(metric, p.value);
  return (
    <div className="panel px-3 py-2 text-[12px]" style={{ boxShadow: 'var(--shadow-pop)' }}>
      <p className="text-[var(--text-tertiary)] num">{format(new Date(p.t), 'MMM d, HH:mm')}</p>
      <p className="mt-0.5 text-[var(--text-primary)] font-medium num">
        p75 {f.value} {f.unit}
      </p>
      <p className="text-[var(--text-tertiary)] num">{p.n} samples</p>
    </div>
  );
};

const VitalChart = ({ metric, series, range, colors, summary }) => {
  const t = VITALS[metric];
  const status = rate(summary?.p75, t.good, t.poor);
  const f = fmtMetric(metric, summary?.p75);

  return (
    <section className="panel overflow-hidden flex flex-col">
      <header className="flex items-start justify-between gap-2 px-4 pt-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{metric}</h3>
            <span className="text-[12px] text-[var(--text-tertiary)] truncate">{t.label}</span>
          </div>
          <p className="mt-1 num">
            <span className="text-[20px] font-semibold tracking-tight text-[var(--text-primary)]">{f.value}</span>
            <span className="ml-1 text-[12px] text-[var(--text-tertiary)]">{f.unit} p75</span>
          </p>
        </div>
        <StatusChip status={status} />
      </header>

      <div className="h-[150px] px-1 pb-2">
        {series.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-[var(--text-muted)]">No samples in range</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={[range.start, range.end]}
                tickFormatter={tickFormatter(range)}
                tick={{ fill: colors['text-muted'], fontSize: 11 }}
                axisLine={{ stroke: colors.axis }}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                width={44}
                tick={{ fill: colors['text-muted'], fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (metric === 'CLS' ? v.toFixed(2) : v >= 1000 ? `${(v / 1000).toFixed(1)}s` : v)}
                domain={[0, (max) => Math.max(max, t.good) * 1.15]}
              />
              <ReferenceLine
                y={t.good}
                stroke={colors.good}
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{ value: fmtThreshold(metric), position: 'insideTopRight', fill: colors['text-muted'], fontSize: 10 }}
              />
              <Tooltip content={<VitalTooltip metric={metric} />} cursor={{ stroke: colors.axis }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors['series-1']}
                strokeWidth={2}
                dot={series.length < 20 ? { r: 3, fill: colors['series-1'], stroke: colors['bg-secondary'], strokeWidth: 2 } : false}
                activeDot={{ r: 4, stroke: colors['bg-secondary'], strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

/** Small multiples: one chart per vital, each on its own scale. */
export const WebVitalsChart = ({ data, range, summary, metrics = ['LCP', 'INP', 'CLS', 'FCP'] }) => {
  const colors = useChartTheme();
  const seriesByMetric = useMemo(
    () => Object.fromEntries(metrics.map((m) => [m, vitalSeries(data || [], m, range)])),
    [data, range, metrics]
  );

  if (!data || data.length === 0) {
    return (
      <div className="panel">
        <EmptyState
          icon="vitals"
          title="No Web Vitals in this range"
          body="Open the demo app or any page running the SDK, then widen the time range."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
      {metrics.map((m) => (
        <VitalChart key={m} metric={m} series={seriesByMetric[m]} range={range} colors={colors} summary={summary?.[m]} />
      ))}
    </div>
  );
};
