import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Panel, EmptyState } from './ui/primitives';
import { Icon } from './ui/Icon';
import { eventTime } from '../lib/metrics';

const SEVERITY = {
  critical: 'chip-critical',
  high: 'chip-critical',
  medium: 'chip-warning',
  low: '',
};

const parseBreadcrumbs = (json) => {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const Detail = ({ error }) => {
  const crumbs = parseBreadcrumbs(error.breadcrumbs);
  const fields = [
    ['Session', error.sessionId],
    ['User', error.userId],
    ['Page', error.pageUrl],
    ['Source', error.source ? `${error.source}${error.lineno ? `:${error.lineno}:${error.colno ?? 0}` : ''}` : null],
    ['User agent', error.userAgent],
  ].filter(([, v]) => v);

  return (
    <div className="px-4 py-4 space-y-4 bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
      <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-1.5 text-[12px]">
        {fields.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-[var(--text-tertiary)]">{k}</dt>
            <dd className="mono text-[var(--text-primary)] break-all">{v}</dd>
          </React.Fragment>
        ))}
      </dl>

      {error.stack && (
        <div>
          <p className="eyebrow mb-1.5">Stack trace</p>
          <pre className="codeblock max-h-64 bg-[var(--bg-secondary)]">{error.stack}</pre>
        </div>
      )}

      {error.componentStack && (
        <div>
          <p className="eyebrow mb-1.5">Component stack</p>
          <pre className="codeblock max-h-48 bg-[var(--bg-secondary)]">{error.componentStack}</pre>
        </div>
      )}

      {crumbs.length > 0 && (
        <div>
          <p className="eyebrow mb-1.5">Breadcrumbs · {crumbs.length}</p>
          <ol className="panel divide-y divide-[var(--border-color)]">
            {crumbs.map((c, i) => (
              <li key={i} className="grid grid-cols-[96px_84px_1fr] gap-3 px-3 py-2 text-[12px]">
                <span className="mono text-[var(--text-muted)] num">
                  {c.timestamp ? format(new Date(c.timestamp), 'HH:mm:ss.SSS') : ''}
                </span>
                <span className="mono text-[var(--text-secondary)]">{c.type}</span>
                <span className="text-[var(--text-primary)] break-words">
                  {c.message}
                  {c.data && Object.keys(c.data).length > 0 && (
                    <span className="block mono text-[11px] text-[var(--text-muted)] mt-0.5">{JSON.stringify(c.data)}</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export const ErrorsTable = ({ errors }) => {
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...(errors || [])]
      .filter((e) => severity === 'all' || (e.severity || '').toLowerCase() === severity)
      .filter((e) => !q || `${e.message} ${e.source} ${e.pageUrl} ${e.errorType}`.toLowerCase().includes(q))
      .sort((a, b) => eventTime(b) - eventTime(a));
  }, [errors, query, severity]);

  return (
    <Panel
      title="Error log"
      subtitle="Newest first. Select a row for stack trace and breadcrumbs."
      actions={
        <>
          <input
            className="field h-[28px] w-48 text-[12px]"
            placeholder="Filter messages"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter errors"
          />
          <select className="field h-[28px] w-auto text-[12px]" value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label="Severity">
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </>
      }
    >
      {!errors || errors.length === 0 ? (
        <EmptyState compact icon="check" title="No errors in this range" />
      ) : rows.length === 0 ? (
        <EmptyState compact icon="inbox" title="No errors match these filters" />
      ) : (
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="dtable">
            <thead>
              <tr>
                <th className="w-6" />
                <th>Message</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Page</th>
                <th className="r">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((error, i) => {
                const id = error.id ?? i;
                const open = expanded === id;
                const t = eventTime(error);
                let path = error.pageUrl;
                try {
                  path = new URL(error.pageUrl).pathname;
                } catch {
                  /* keep raw */
                }
                return (
                  <React.Fragment key={id}>
                    <tr className="cursor-pointer" onClick={() => setExpanded(open ? null : id)} aria-expanded={open}>
                      <td className="pr-0 text-[var(--text-muted)]">
                        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={14} />
                      </td>
                      <td className="max-w-[420px]">
                        <span className="block truncate text-[var(--text-primary)]" title={error.message}>
                          {error.message || <span className="text-[var(--text-muted)]">No message</span>}
                        </span>
                      </td>
                      <td><span className="mono text-[12px]">{error.errorType || 'unknown'}</span></td>
                      <td>
                        <span className={`chip capitalize ${SEVERITY[(error.severity || '').toLowerCase()] ?? ''}`}>
                          {error.severity || 'n/a'}
                        </span>
                      </td>
                      <td className="max-w-[220px]"><span className="block truncate" title={error.pageUrl}>{path || '–'}</span></td>
                      <td className="r whitespace-nowrap">{Number.isNaN(t) ? '–' : format(t, 'MMM d, HH:mm:ss')}</td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <Detail error={error} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
};
