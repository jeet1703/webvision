import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLiveMode } from '../contexts/LiveModeContext';
import { Icon } from './ui/Icon';

const NAV = [
  {
    group: 'Monitor',
    items: [
      { id: 'dashboard', label: 'Overview', icon: 'overview' },
      { id: 'webvitals', label: 'Web Vitals', icon: 'vitals' },
      { id: 'pagespeed', label: 'Page Speed', icon: 'speed' },
      { id: 'errors', label: 'Errors', icon: 'errors' },
      { id: 'sessions', label: 'Sessions', icon: 'sessions' },
      { id: 'analytics', label: 'Analytics', icon: 'analytics' },
    ],
  },
  {
    group: 'Tools',
    items: [{ id: 'comparison', label: 'API Compare', icon: 'compare' }],
  },
];

const NavButton = ({ item, active, collapsed, onClick }) => (
  <button
    onClick={onClick}
    title={collapsed ? item.label : undefined}
    aria-current={active ? 'page' : undefined}
    className={`group relative w-full flex items-center gap-2.5 h-8 rounded-md text-[13px] transition-colors ${
      collapsed ? 'justify-center px-0' : 'px-2.5'
    } ${
      active
        ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
    }`}
  >
    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-[var(--accent)]" />}
    <Icon name={item.icon} size={16} className={active ? 'text-[var(--accent)]' : ''} />
    {!collapsed && <span className="truncate">{item.label}</span>}
  </button>
);

export const Sidebar = ({ activeView, setActiveView, collapsed, onToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const { isLive, toggleLiveMode } = useLiveMode();

  return (
    <aside
      className={`shrink-0 h-full flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-color)] transition-[width] duration-200 ${
        collapsed ? 'w-[56px]' : 'w-[232px]'
      }`}
    >
      {/* Brand */}
      <div className={`h-14 flex items-center border-b border-[var(--border-color)] ${collapsed ? 'justify-center' : 'px-4 justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-[var(--accent)] text-white flex items-center justify-center">
              <Icon name="vitals" size={14} strokeWidth={2.25} />
            </div>
            <span className="text-[14px] font-semibold tracking-tight text-[var(--text-primary)]">WebVizion</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name="sidebar" size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV.map((section) => (
          <div key={section.group}>
            {!collapsed && <p className="px-2.5 mb-1.5 eyebrow text-[10px]">{section.group}</p>}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={activeView === item.id}
                  collapsed={collapsed}
                  onClick={() => setActiveView(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-[var(--border-color)] space-y-0.5">
        <button
          onClick={toggleLiveMode}
          title={collapsed ? (isLive ? 'Pause live updates' : 'Resume live updates') : undefined}
          className={`w-full flex items-center gap-2.5 h-8 rounded-md text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] ${
            collapsed ? 'justify-center' : 'px-2.5'
          }`}
        >
          <span className="w-4 flex justify-center">
            <span className={`dot ${isLive ? 'bg-[var(--good)] live-dot' : 'bg-[var(--text-muted)]'}`} />
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{isLive ? 'Live' : 'Paused'}</span>
              <Icon name={isLive ? 'pause' : 'play'} size={13} className="text-[var(--text-muted)]" />
            </>
          )}
        </button>

        <button
          onClick={toggleTheme}
          title={collapsed ? 'Toggle theme' : undefined}
          className={`w-full flex items-center gap-2.5 h-8 rounded-md text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] ${
            collapsed ? 'justify-center' : 'px-2.5'
          }`}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
          {!collapsed && <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>}
        </button>

        <NavButton
          item={{ id: 'settings', label: 'Settings', icon: 'settings' }}
          active={activeView === 'settings'}
          collapsed={collapsed}
          onClick={() => setActiveView('settings')}
        />

        <a
          href="https://webvizion-demo.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? 'Open demo app' : undefined}
          className={`w-full flex items-center gap-2.5 h-8 rounded-md text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] ${
            collapsed ? 'justify-center' : 'px-2.5'
          }`}
        >
          <Icon name="external" size={16} />
          {!collapsed && <span>Demo app</span>}
        </a>
      </div>
    </aside>
  );
};
