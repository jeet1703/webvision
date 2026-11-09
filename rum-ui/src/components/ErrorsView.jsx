import React, { useMemo, useState } from 'react';
import { PageShell } from './PageShell';
import { ErrorsChart, ErrorsTimeline } from './ErrorsChart';
import { ErrorsTable } from './ErrorsTable';
import { StatTile, fmtInt } from './ui/primitives';
import { useRangeData } from './Dashboard';

export const ErrorsView = () => {
  const [timeRange, setTimeRange] = useState(3600000);
  const data = useRangeData(timeRange);
  const { errors, range } = data;

  const s = useMemo(() => {
    const sev = (x) => errors.filter((e) => (e.severity || '').toLowerCase() === x).length;
    return {
      total: errors.length,
      critical: sev('critical'),
      high: sev('high'),
      sessions: new Set(errors.map((e) => e.sessionId).filter(Boolean)).size,
      types: new Set(errors.map((e) => e.errorType || 'unknown')).size,
    };
  }, [errors]);

  return (
    <PageShell
      title="Errors"
      subtitle="JavaScript errors and rejected promises captured by the SDK"
      timeRange={timeRange}
      setTimeRange={setTimeRange}
      data={data}
    >
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total errors" value={fmtInt(s.total)} status={s.total ? 'warning' : 'good'} hint={`${s.types} distinct types`} />
        <StatTile label="Critical" value={fmtInt(s.critical)} status={s.critical ? 'critical' : 'good'} hint="Severity: critical" />
        <StatTile label="High" value={fmtInt(s.high)} status={s.high ? 'warning' : 'good'} hint="Severity: high" />
        <StatTile label="Affected sessions" value={fmtInt(s.sessions)} hint="Sessions with one or more errors" />
      </div>

      <div className="grid gap-3 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ErrorsTimeline data={errors} range={range} height={220} />
        </div>
        <ErrorsChart data={errors} />
      </div>

      <ErrorsTable errors={errors} />
    </PageShell>
  );
};
