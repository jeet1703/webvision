import React, { useMemo, useState } from 'react';
import { summarizeVitals } from '../lib/metrics';
import { PageShell } from './PageShell';
import { WebVitalsChart } from './WebVitalsChart';
import { Panel, VITALS, rate, fmtMetric, fmtThreshold } from './ui/primitives';
import { useRangeData, VitalTile } from './Dashboard';

const METRICS = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];

/** Share of samples in each rating band per metric. */
const Distribution = ({ webVitals }) => {
  const rows = useMemo(
    () =>
      METRICS.map((m) => {
        const t = VITALS[m];
        const vals = webVitals.filter((v) => v.metricName === m && typeof v.value === 'number').map((v) => v.value);
        const n = vals.length;
        const good = vals.filter((v) => v <= t.good).length;
        const poor = vals.filter((v) => v > t.poor).length;
        return { m, n, good, mid: n - good - poor, poor };
      }),
    [webVitals]
  );

  const pct = (x, n) => (n ? (x / n) * 100 : 0);

  return (
    <Panel title="Rating distribution" subtitle="Share of samples rated good, needs work and poor">
      <div className="px-4 pt-3 pb-1 flex gap-4 text-[12px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5"><span className="dot bg-[var(--good)]" />Good</span>
        <span className="flex items-center gap-1.5"><span className="dot bg-[var(--warning)]" />Needs work</span>
        <span className="flex items-center gap-1.5"><span className="dot bg-[var(--critical)]" />Poor</span>
      </div>
      <table className="dtable">
        <thead>
          <tr>
            <th>Metric</th>
            <th className="w-1/2">Distribution</th>
            <th className="r">Good</th>
            <th className="r">Needs work</th>
            <th className="r">Poor</th>
            <th className="r">Samples</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.m}>
              <td className="strong">{r.m}</td>
              <td>
                {r.n === 0 ? (
                  <span className="text-[var(--text-muted)] text-[12px]">No samples</span>
                ) : (
                  <div className="flex h-2 gap-[2px] rounded-full overflow-hidden">
                    {r.good > 0 && <div className="bg-[var(--good)]" style={{ width: `${pct(r.good, r.n)}%` }} />}
                    {r.mid > 0 && <div className="bg-[var(--warning)]" style={{ width: `${pct(r.mid, r.n)}%` }} />}
                    {r.poor > 0 && <div className="bg-[var(--critical)]" style={{ width: `${pct(r.poor, r.n)}%` }} />}
                  </div>
                )}
              </td>
              <td className="r">{r.n ? `${pct(r.good, r.n).toFixed(0)}%` : '–'}</td>
              <td className="r">{r.n ? `${pct(r.mid, r.n).toFixed(0)}%` : '–'}</td>
              <td className="r">{r.n ? `${pct(r.poor, r.n).toFixed(0)}%` : '–'}</td>
              <td className="r">{r.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
};

/** Per-page p75 for each vital. */
const ByPage = ({ webVitals }) => {
  const rows = useMemo(() => {
    const byPage = {};
    webVitals.forEach((v) => {
      let path = v.pageUrl || '–';
      try {
        path = new URL(v.pageUrl).pathname;
      } catch {
        /* keep raw */
      }
      (byPage[path] ||= []).push(v);
    });
    return Object.entries(byPage)
      .map(([path, list]) => ({ path, n: list.length, s: summarizeVitals(list) }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 15);
  }, [webVitals]);

  if (rows.length === 0) return null;

  return (
    <Panel title="Vitals by page" subtitle="p75 per path, top 15 by sample count">
      <div className="overflow-x-auto">
        <table className="dtable">
          <thead>
            <tr>
              <th>Path</th>
              {['LCP', 'INP', 'CLS', 'FCP'].map((m) => (
                <th key={m} className="r">{m}</th>
              ))}
              <th className="r">Samples</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.path}>
                <td className="max-w-[320px]"><span className="block truncate strong" title={r.path}>{r.path}</span></td>
                {['LCP', 'INP', 'CLS', 'FCP'].map((m) => {
                  const v = r.s[m].p75;
                  const f = fmtMetric(m, v);
                  const st = rate(v, VITALS[m].good, VITALS[m].poor);
                  return (
                    <td key={m} className="r">
                      {v == null ? (
                        <span className="text-[var(--text-muted)]">–</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 justify-end">
                          <span
                            className="dot"
                            title={st}
                            style={{ background: `var(--${st})` }}
                          />
                          {f.value}
                          <span className="text-[var(--text-muted)]">{f.unit}</span>
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="r">{r.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};

export const WebVitalsView = () => {
  const [timeRange, setTimeRange] = useState(3600000);
  const data = useRangeData(timeRange);
  const summary = useMemo(() => summarizeVitals(data.webVitals), [data.webVitals]);

  return (
    <PageShell
      title="Web Vitals"
      subtitle="p75 against Google's Core Web Vitals thresholds"
      timeRange={timeRange}
      setTimeRange={setTimeRange}
      data={data}
      tiles={5}
    >
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {METRICS.map((m) => (
          <VitalTile key={m} name={m} summary={summary} />
        ))}
      </div>
      <WebVitalsChart data={data.webVitals} range={data.range} summary={summary} metrics={['LCP', 'INP', 'CLS', 'FCP']} />
      <Distribution webVitals={data.webVitals} />
      <ByPage webVitals={data.webVitals} />
      <p className="text-[12px] text-[var(--text-tertiary)] flex gap-x-4 gap-y-1 flex-wrap">
        <span>Good at p75:</span>
        {METRICS.map((m) => (
          <span key={m} className="num">{m} {fmtThreshold(m)}</span>
        ))}
      </p>
    </PageShell>
  );
};
