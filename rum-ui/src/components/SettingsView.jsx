import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLiveMode } from '../contexts/LiveModeContext';
import { Header } from './Header';
import { Panel } from './ui/primitives';
import { API_BASE_URL } from '../services/apiService';

const Row = ({ title, body, children }) => (
  <div className="flex items-center justify-between gap-6 px-4 py-3.5 border-b border-[var(--border-color)] last:border-b-0">
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-[var(--text-primary)]">{title}</p>
      {body && <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">{body}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Switch = ({ checked, onChange, label }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[var(--accent)]' : 'bg-[var(--border-strong)]'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
  </button>
);

export const SettingsView = () => {
  const { theme, toggleTheme } = useTheme();
  const { isLive, toggleLiveMode, refreshInterval, updateRefreshInterval } = useLiveMode();

  return (
    <div className="min-h-full">
      <Header title="Settings" subtitle="Saved in this browser" />
      <div className="px-6 py-5 max-w-3xl space-y-4">
        <Panel title="Appearance">
          <Row title="Theme">
            <div className="segmented" role="group" aria-label="Theme">
              <button aria-pressed={theme === 'light'} onClick={() => theme !== 'light' && toggleTheme()}>Light</button>
              <button aria-pressed={theme === 'dark'} onClick={() => theme !== 'dark' && toggleTheme()}>Dark</button>
            </div>
          </Row>
        </Panel>

        <Panel title="Data refresh">
          <Row title="Auto-refresh" body="Poll the API on an interval while a view is open.">
            <Switch checked={isLive} onChange={toggleLiveMode} label="Auto-refresh" />
          </Row>
          <Row title="Interval" body="Shorter intervals cost more requests on the free backend.">
            <select
              className="field w-auto"
              value={refreshInterval}
              disabled={!isLive}
              onChange={(e) => updateRefreshInterval(Number(e.target.value))}
            >
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
            </select>
          </Row>
        </Panel>

        <Panel title="Data source">
          <div className="px-4 py-3.5">
            <label className="label" htmlFor="api-url">RUM API base URL</label>
            <input id="api-url" className="field mono" value={API_BASE_URL} readOnly />
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1.5">
              Set in <span className="mono">src/services/apiService.js</span>.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
};
