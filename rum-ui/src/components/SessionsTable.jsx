import React, { useMemo, useState } from 'react';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { Panel, EmptyState } from './ui/primitives';
import { eventTime } from '../lib/metrics';

export const buildSessions = (webVitals = [], errors = []) => {
  const map = {};
  const touch = (item, field) => {
    if (!item.sessionId) return;
    const t = eventTime(item);
    const s = (map[item.sessionId] ||= {
      sessionId: item.sessionId,
      pageUrl: item.pageUrl,
      pages: new Set(),
      vitals: 0,
      errors: 0,
      first: t,
      last: t,
    });
    s[field] += 1;
    if (item.pageUrl) s.pages.add(item.pageUrl);
    if (t < s.first) s.first = t;
    if (t > s.last) {
      s.last = t;
      s.pageUrl = item.pageUrl || s.pageUrl;
    }
  };
  webVitals.forEach((v) => touch(v, 'vitals'));
  errors.forEach((e) => touch(e, 'errors'));
  return Object.values(map).sort((a, b) => b.last - a.last);
};

const pathOf = (url) => {
  try {
    return new URL(url).pathname;
  } catch {
    return url || '–';
  }
};

const duration = (ms) => {
  if (!ms || ms < 1000) return '< 1s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

export const SessionsTable = ({ webVitals, errors, pageSize = 10, title = 'Recent sessions' }) => {
  const [page, setPage] = useState(0);
  const sessions = useMemo(() => buildSessions(webVitals, errors), [webVitals, errors]);
  const pages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const current = Math.min(page, pages - 1);
  const rows = sessions.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <Panel
      title={title}
      subtitle="Grouped by session ID, most recent activity first"
      actions={<span className="chip num">{sessions.length} sessions</span>}
    >
      {sessions.length === 0 ? (
        <EmptyState compact icon="sessions" title="No sessions in this range" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Last page</th>
                  <th className="r">Pages</th>
                  <th className="r">Vitals</th>
                  <th className="r">Errors</th>
                  <th className="r">Duration</th>
                  <th className="r">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.sessionId}>
                    <td>
                      <span className="mono text-[12px] text-[var(--text-primary)]" title={s.sessionId}>
                        {s.sessionId.length > 14 ? `${s.sessionId.slice(0, 14)}…` : s.sessionId}
                      </span>
                    </td>
                    <td className="max-w-[280px]">
                      <span className="block truncate" title={s.pageUrl}>{pathOf(s.pageUrl)}</span>
                    </td>
                    <td className="r">{s.pages.size}</td>
                    <td className="r">{s.vitals}</td>
                    <td className="r">
                      {s.errors > 0 ? (
                        <span className="chip chip-critical num">{s.errors}</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">0</span>
                      )}
                    </td>
                    <td className="r">{duration(s.last - s.first)}</td>
                    <td className="r whitespace-nowrap" title={format(s.last, 'PPpp')}>
                      {formatDistanceToNowStrict(s.last, { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <footer className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border-color)] text-[12px] text-[var(--text-tertiary)]">
              <span className="num">
                {current * pageSize + 1}–{Math.min(sessions.length, (current + 1) * pageSize)} of {sessions.length}
              </span>
              <div className="flex gap-1">
                <button className="btn btn-sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
                <button className="btn btn-sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</button>
              </div>
            </footer>
          )}
        </>
      )}
    </Panel>
  );
};
