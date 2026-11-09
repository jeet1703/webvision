// Shared aggregations for RUM events.

export const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
};

const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

/** Per-metric p75 (the Core Web Vitals assessment percentile), mean and sample count. */
export const summarizeVitals = (webVitals = []) => {
  const byName = {};
  for (const v of webVitals) {
    if (typeof v.value !== 'number') continue;
    (byName[v.metricName] ||= []).push(v.value);
  }
  const out = {};
  for (const name of ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']) {
    const vals = byName[name] || [];
    out[name] = { p75: percentile(vals, 75), avg: mean(vals), count: vals.length };
  }
  return out;
};

/**
 * The API serialises Java LocalDateTime in UTC without a zone suffix
 * ("2026-11-09T17:01:23.69"). Treat zone-less ISO strings as UTC.
 */
export const parseTime = (v) => {
  if (v == null) return NaN;
  if (typeof v === 'number') return v;
  const s = String(v);
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s);
  return new Date(hasZone || !s.includes('T') ? s : `${s}Z`).getTime();
};

const ts = (e) => parseTime(e.eventTimestamp || e.createdAt || e.timestamp);

/** Choose a bucket size that yields roughly 24–60 buckets for the span. */
export const bucketSize = (spanMs) => {
  const steps = [60e3, 5 * 60e3, 15 * 60e3, 30 * 60e3, 3600e3, 3 * 3600e3, 6 * 3600e3, 86400e3];
  return steps.find((s) => spanMs / s <= 60) || 86400e3;
};

export const resolveRange = (timeRange) => {
  if (timeRange && typeof timeRange === 'object') return timeRange;
  const end = Date.now();
  return { start: end - timeRange, end };
};

/** Time series of p75 per bucket for one metric. */
export const vitalSeries = (webVitals, metric, range) => {
  const size = bucketSize(range.end - range.start);
  const buckets = new Map();
  for (const v of webVitals) {
    if (v.metricName !== metric || typeof v.value !== 'number') continue;
    const t = ts(v);
    if (Number.isNaN(t)) continue;
    const b = Math.floor(t / size) * size;
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b).push(v.value);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, vals]) => ({ t, value: percentile(vals, 75), n: vals.length }));
};

/** Event counts per bucket across the full range (empty buckets included). */
export const countSeries = (events, range) => {
  const size = bucketSize(range.end - range.start);
  const first = Math.floor(range.start / size) * size;
  const counts = new Map();
  for (let t = first; t <= range.end; t += size) counts.set(t, 0);
  for (const e of events) {
    const t = ts(e);
    if (Number.isNaN(t)) continue;
    const b = Math.floor(t / size) * size;
    if (counts.has(b)) counts.set(b, counts.get(b) + 1);
  }
  return [...counts.entries()].map(([t, count]) => ({ t, count }));
};

export const eventTime = ts;
