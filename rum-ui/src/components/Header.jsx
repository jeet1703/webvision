import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useLiveMode } from '../contexts/LiveModeContext';
import { Icon } from './ui/Icon';

export const PRESETS = [
  { label: '15m', value: 900000 },
  { label: '1h', value: 3600000 },
  { label: '6h', value: 21600000 },
  { label: '24h', value: 86400000 },
  { label: '7d', value: 604800000 },
];

const ago = (date, now) => {
  if (!date) return null;
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
};

const UpdatedAt = ({ lastUpdate }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!lastUpdate) return null;
  return (
    <span className="text-[12px] text-[var(--text-tertiary)] num" title={format(lastUpdate, 'PPpp')}>
      Updated {ago(lastUpdate, now)}
    </span>
  );
};

const toLocalInput = (ms) => format(new Date(ms), "yyyy-MM-dd'T'HH:mm");

export const Header = ({ title, subtitle, timeRange, setTimeRange, lastUpdate, actions }) => {
  const { isLive, toggleLiveMode } = useLiveMode();
  const isCustom = timeRange && typeof timeRange === 'object';
  const [showCustom, setShowCustom] = useState(false);
  const [start, setStart] = useState(() => toLocalInput(Date.now() - 86400000));
  const [end, setEnd] = useState(() => toLocalInput(Date.now()));
  const [rangeError, setRangeError] = useState('');

  const applyCustom = () => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) return setRangeError('Pick both a start and an end.');
    if (e <= s) return setRangeError('End must come after start.');
    setRangeError('');
    setTimeRange({ start: s, end: e });
    setShowCustom(false);
  };

  return (
    <header className="sticky top-0 z-20 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--border-color)]">
      <div className="px-6 h-14 flex items-center justify-between gap-4">
        <div className="min-w-0 flex items-baseline gap-3">
          <h1 className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)] truncate">{title}</h1>
          {subtitle && (
            <p className="hidden md:block text-[12px] text-[var(--text-tertiary)] truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {lastUpdate !== undefined && (
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={toggleLiveMode}
                className={`chip ${isLive ? 'chip-good' : ''} cursor-pointer`}
                title={isLive ? 'Pause auto-refresh' : 'Resume auto-refresh'}
              >
                <span className={`dot ${isLive ? 'bg-[var(--good)] live-dot' : 'bg-[var(--text-muted)]'}`} />
                {isLive ? 'Live' : 'Paused'}
              </button>
              <UpdatedAt lastUpdate={lastUpdate} />
            </div>
          )}

          {actions}

          {setTimeRange && (
            <div className="segmented" role="group" aria-label="Time range">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  aria-pressed={timeRange === p.value}
                  onClick={() => {
                    setTimeRange(p.value);
                    setShowCustom(false);
                  }}
                >
                  {p.label}
                </button>
              ))}
              <button
                aria-pressed={isCustom || showCustom}
                onClick={() => setShowCustom((v) => !v)}
                className="flex items-center gap-1"
              >
                <Icon name="calendar" size={12} />
                {isCustom ? `${format(timeRange.start, 'MMM d HH:mm')} – ${format(timeRange.end, 'MMM d HH:mm')}` : 'Custom'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showCustom && setTimeRange && (
        <div className="px-6 pb-3 flex items-end gap-3 flex-wrap">
          <div>
            <label className="label" htmlFor="range-start">From</label>
            <input id="range-start" type="datetime-local" className="field w-auto" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="range-end">To</label>
            <input id="range-end" type="datetime-local" className="field w-auto" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={applyCustom}>Apply</button>
          <button className="btn btn-ghost" onClick={() => setShowCustom(false)}>Cancel</button>
          {rangeError && <span className="text-[12px] text-[var(--critical-text)] pb-2">{rangeError}</span>}
        </div>
      )}
    </header>
  );
};
