import React, { useMemo, useState } from 'react';
import { PageShell } from './PageShell';
import { SessionsTable, buildSessions } from './SessionsTable';
import { StatTile, fmtInt } from './ui/primitives';
import { useRangeData } from './Dashboard';

export const SessionsView = () => {
  const [timeRange, setTimeRange] = useState(3600000);
  const data = useRangeData(timeRange);
  const { webVitals, errors, stats } = data;

  const s = useMemo(() => {
    const sessions = buildSessions(webVitals, errors);
    const withErrors = sessions.filter((x) => x.errors > 0).length;
    const pages = sessions.reduce((sum, x) => sum + x.pages.size, 0);
    return { count: sessions.length, withErrors, pagesPer: sessions.length ? pages / sessions.length : 0 };
  }, [webVitals, errors]);

  return (
    <PageShell
      title="Sessions"
      subtitle="Activity grouped by browser session"
      timeRange={timeRange}
      setTimeRange={setTimeRange}
      data={data}
    >
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <StatTile label="Sessions" value={fmtInt(s.count)} hint="With at least one vital or error" />
        <StatTile label="Unique users" value={fmtInt(stats.uniqueUsers ?? 0)} hint="Reported by the API" />
        <StatTile label="Pages per session" value={s.pagesPer.toFixed(1)} hint="Distinct URLs" />
        <StatTile
          label="Sessions with errors"
          value={fmtInt(s.withErrors)}
          status={s.withErrors ? 'warning' : 'good'}
          hint={s.count ? `${((s.withErrors / s.count) * 100).toFixed(0)}% of sessions` : ' '}
        />
      </div>
      <SessionsTable webVitals={webVitals} errors={errors} pageSize={20} title="All sessions" />
    </PageShell>
  );
};
