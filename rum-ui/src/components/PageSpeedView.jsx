import React, { useMemo, useState } from 'react';
import { PageShell } from './PageShell';
import { PageSpeedTable } from './PageSpeedTable';
import { StatTile, fmtInt, fmtMs } from './ui/primitives';
import { useRangeData } from './Dashboard';

export const PageSpeedView = () => {
  const [timeRange, setTimeRange] = useState(3600000);
  const data = useRangeData(timeRange);
  const { pageSpeedStats, stats } = data;

  const s = useMemo(() => {
    const views = pageSpeedStats.reduce((sum, p) => sum + (p.viewCount || 0), 0);
    const slowest = [...pageSpeedStats].sort((a, b) => (b.avgLoadTime || 0) - (a.avgLoadTime || 0))[0];
    const slow = pageSpeedStats.filter((p) => (p.avgLoadTime || 0) >= 3000).length;
    return { views, slowest, slow };
  }, [pageSpeedStats]);

  const avg = fmtMs(stats.avgPageLoadTime || null);
  const slowestMs = fmtMs(s.slowest?.avgLoadTime ?? null);
  let slowestPath = s.slowest?.pageUrl;
  try {
    slowestPath = new URL(slowestPath).pathname;
  } catch {
    /* keep raw */
  }

  return (
    <PageShell
      title="Page Speed"
      subtitle="Full page load time per URL"
      timeRange={timeRange}
      setTimeRange={setTimeRange}
      data={data}
    >
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Avg page load"
          value={avg.value}
          unit={avg.unit}
          status={stats.avgPageLoadTime == null ? undefined : stats.avgPageLoadTime < 1000 ? 'good' : stats.avgPageLoadTime < 3000 ? 'warning' : 'critical'}
          hint="Fast < 1 s · Slow ≥ 3 s"
        />
        <StatTile label="Slowest page" value={slowestMs.value} unit={slowestMs.unit} hint={slowestPath || 'No pages'} />
        <StatTile label="Pages tracked" value={fmtInt(pageSpeedStats.length)} hint={`${s.slow} slow`} status={s.slow ? 'warning' : pageSpeedStats.length ? 'good' : undefined} />
        <StatTile label="Page loads" value={fmtInt(s.views)} hint="Across all tracked pages" />
      </div>
      <PageSpeedTable data={pageSpeedStats} />
    </PageShell>
  );
};
