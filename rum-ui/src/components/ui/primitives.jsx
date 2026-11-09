import React from 'react';
import { Icon } from './Icon';

/* ---------- Thresholds (Core Web Vitals, web.dev) ---------- */

export const VITALS = {
  LCP: { label: 'Largest Contentful Paint', unit: 'ms', good: 2500, poor: 4000 },
  INP: { label: 'Interaction to Next Paint', unit: 'ms', good: 200, poor: 500 },
  CLS: { label: 'Cumulative Layout Shift', unit: '', good: 0.1, poor: 0.25 },
  FCP: { label: 'First Contentful Paint', unit: 'ms', good: 1800, poor: 3000 },
  TTFB: { label: 'Time to First Byte', unit: 'ms', good: 800, poor: 1800 },
};

export const rate = (value, good, poor) => {
  if (value == null || Number.isNaN(value)) return 'none';
  if (value <= good) return 'good';
  if (value <= poor) return 'warning';
  return 'critical';
};

export const STATUS_LABEL = {
  good: 'Good',
  warning: 'Needs work',
  critical: 'Poor',
  none: 'No data',
};

/* ---------- Formatting ---------- */

export const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

export const fmtInt = (n) => (n == null ? '–' : Math.round(n).toLocaleString());

export const fmtMs = (ms) => {
  if (ms == null || Number.isNaN(ms)) return { value: '–', unit: '' };
  if (ms >= 1000) return { value: (ms / 1000).toFixed(2), unit: 's' };
  return { value: Math.round(ms).toString(), unit: 'ms' };
};

export const fmtMetric = (name, v) => {
  if (v == null) return { value: '–', unit: '' };
  if (name === 'CLS') return { value: v.toFixed(3), unit: '' };
  return fmtMs(v);
};

export const fmtThreshold = (name) => {
  const t = VITALS[name];
  if (!t) return '';
  if (name === 'CLS') return `≤ ${t.good}`;
  const f = fmtMs(t.good);
  return `≤ ${f.value} ${f.unit}`;
};

/* ---------- Components ---------- */

export const Panel = ({ title, subtitle, actions, children, className = '', bodyClassName = '' }) => (
  <section className={`panel overflow-hidden ${className}`}>
    {(title || actions) && (
      <header className="panel-head">
        <div className="min-w-0">
          {title && <h2 className="panel-title">{title}</h2>}
          {subtitle && <p className="panel-sub">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export const StatusChip = ({ status, children }) => {
  const icon = status === 'good' ? 'check' : status === 'none' ? null : 'alert';
  return (
    <span className={`chip ${status !== 'none' ? `chip-${status}` : ''}`}>
      {icon && <Icon name={icon} size={11} strokeWidth={2.25} />}
      {children ?? STATUS_LABEL[status]}
    </span>
  );
};

/**
 * KPI tile. Value is never colored; status rides on a chip with icon + label.
 */
export const StatTile = ({ label, value, unit, hint, status, meter }) => (
  <div className="panel px-4 py-3.5 flex flex-col gap-2 min-w-0">
    <div className="flex items-center justify-between gap-2">
      <span className="eyebrow truncate">{label}</span>
      {status && <StatusChip status={status} />}
    </div>
    <div className="flex items-baseline gap-1 num">
      <span className="text-[26px] leading-none font-semibold tracking-tight text-[var(--text-primary)]">
        {value}
      </span>
      {unit && <span className="text-[13px] font-medium text-[var(--text-tertiary)]">{unit}</span>}
    </div>
    {meter}
    {hint && <span className="text-[12px] text-[var(--text-tertiary)] truncate">{hint}</span>}
  </div>
);

/**
 * Threshold meter: good | needs work | poor bands, with a marker at the value.
 */
export const ThresholdMeter = ({ value, good, poor }) => {
  if (value == null) return <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)]" />;
  const max = poor * 1.5;
  const pct = (v) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <div className="relative h-1.5" aria-hidden="true">
      <div className="absolute inset-0 flex gap-[2px]">
        <div className="h-full rounded-l-full bg-[var(--good)] opacity-35" style={{ width: pct(good) }} />
        <div className="h-full bg-[var(--warning)] opacity-35" style={{ width: `calc(${pct(poor)} - ${pct(good)})` }} />
        <div className="h-full flex-1 rounded-r-full bg-[var(--critical)] opacity-35" />
      </div>
      <div
        className="absolute -top-[3px] h-3 w-[3px] rounded-full bg-[var(--text-primary)] ring-2 ring-[var(--bg-secondary)]"
        style={{ left: `calc(${pct(value)} - 1.5px)` }}
      />
    </div>
  );
};

export const EmptyState = ({ icon = 'inbox', title, body, compact = false }) => (
  <div className={`flex flex-col items-center justify-center text-center px-6 ${compact ? 'py-10' : 'py-16'}`}>
    <div className="w-9 h-9 rounded-lg border border-[var(--border-color)] flex items-center justify-center text-[var(--text-tertiary)] mb-3">
      <Icon name={icon} size={18} />
    </div>
    <p className="text-[13px] font-medium text-[var(--text-primary)]">{title}</p>
    {body && <p className="text-[12px] text-[var(--text-tertiary)] mt-1 max-w-sm">{body}</p>}
  </div>
);

export const SkeletonGrid = ({ tiles = 4 }) => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading">
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))` }}>
      {Array.from({ length: tiles }).map((_, i) => (
        <div key={i} className="panel px-4 py-3.5 space-y-3">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-6 w-24" />
          <div className="skeleton h-2 w-full" />
        </div>
      ))}
    </div>
    <div className="panel p-4 space-y-3">
      <div className="skeleton h-3 w-40" />
      <div className="skeleton h-56 w-full" />
    </div>
  </div>
);

export const ErrorBanner = ({ message, baseUrl }) => (
  <div className="panel border-[var(--critical)]/40 p-4 flex gap-3 items-start">
    <span className="text-[var(--critical-text)] mt-0.5">
      <Icon name="alert" size={18} />
    </span>
    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-[var(--text-primary)]">Can't reach the RUM API</p>
      <p className="text-[12px] text-[var(--text-secondary)] mt-1">
        The request to <span className="mono text-[var(--text-primary)]">{baseUrl}</span> failed with{' '}
        <span className="mono text-[var(--critical-text)]">{message}</span>. A cold start on the hosting
        provider can take up to a minute, and a 429 means requests are being rate limited. The dashboard
        retries on each refresh while live mode is on.
      </p>
    </div>
  </div>
);
