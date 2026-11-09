import React, { useMemo, useState } from 'react';
import { Panel, EmptyState, StatusChip, fmtMs } from './ui/primitives';

const loadStatus = (ms) => (ms < 1000 ? 'good' : ms < 3000 ? 'warning' : 'critical');
const LOAD_LABEL = { good: 'Fast', warning: 'Moderate', critical: 'Slow' };

const Ms = ({ v }) => {
  if (v == null) return <span className="text-[var(--text-muted)]">–</span>;
  const f = fmtMs(v);
  return (
    <>
      {f.value}
      <span className="text-[var(--text-muted)] ml-0.5">{f.unit}</span>
    </>
  );
};

const COLS = [
  { key: 'pageUrl', label: 'Page' },
  { key: 'viewCount', label: 'Views', r: true },
  { key: 'avgLoadTime', label: 'Avg load', r: true },
  { key: 'minLoadTime', label: 'Min', r: true },
  { key: 'maxLoadTime', label: 'Max', r: true },
];

const pathOf = (url) => {
  try {
    const u = new URL(url);
    return { host: u.host, path: u.pathname + u.search };
  } catch {
    return { host: '', path: url || '–' };
  }
};

export const PageSpeedTable = ({ data, limit }) => {
  const [sort, setSort] = useState({ key: 'avgLoadTime', dir: 'desc' });

  const rows = useMemo(() => {
    const r = [...(data || [])].sort((a, b) => {
      const av = a[sort.key] ?? 0;
      const bv = b[sort.key] ?? 0;
      const c = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sort.dir === 'asc' ? c : -c;
    });
    return limit ? r.slice(0, limit) : r;
  }, [data, sort, limit]);

  const maxAvg = Math.max(1, ...(data || []).map((p) => p.avgLoadTime || 0));

  const onSort = (key) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));

  return (
    <Panel
      title="Page load by URL"
      subtitle={limit && data?.length > limit ? `Slowest ${limit} of ${data.length} pages` : 'Full page load time per URL'}
    >
      {!data || data.length === 0 ? (
        <EmptyState compact icon="speed" title="No page loads in this range" />
      ) : (
        <div className="overflow-x-auto">
          <table className="dtable">
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th key={c.key} className={c.r ? 'r' : ''}>
                    <button onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] uppercase">
                      {c.label}
                      {sort.key === c.key && <span aria-hidden="true">{sort.dir === 'desc' ? '↓' : '↑'}</span>}
                    </button>
                  </th>
                ))}
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((page, i) => {
                const avg = page.avgLoadTime || 0;
                const st = loadStatus(avg);
                const { host, path } = pathOf(page.pageUrl);
                return (
                  <tr key={page.pageUrl || i}>
                    <td className="max-w-[360px]">
                      <div className="truncate text-[var(--text-primary)]" title={page.pageUrl}>{path}</div>
                      {host && <div className="truncate text-[11px] text-[var(--text-muted)]">{host}</div>}
                    </td>
                    <td className="r">{(page.viewCount || 0).toLocaleString()}</td>
                    <td className="r">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden xl:block w-16 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                          <div className="h-full bg-[var(--series-1)]" style={{ width: `${(avg / maxAvg) * 100}%` }} />
                        </div>
                        <span className="strong"><Ms v={avg} /></span>
                      </div>
                    </td>
                    <td className="r"><Ms v={page.minLoadTime} /></td>
                    <td className="r"><Ms v={page.maxLoadTime} /></td>
                    <td><StatusChip status={st}>{LOAD_LABEL[st]}</StatusChip></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
};
