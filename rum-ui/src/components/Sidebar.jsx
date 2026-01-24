import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLiveMode } from '../contexts/LiveModeContext';

export const Sidebar = ({ activeView, setActiveView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isLive, toggleLiveMode } = useLiveMode();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard.svg' },
    { id: 'webvitals', label: 'Web Vitals', icon: 'health.svg' },
    { id: 'errors', label: 'Errors', icon: 'error.svg' },
    { id: 'pagespeed', label: 'Page Speed', icon: 'speed.svg' },
    { id: 'sessions', label: 'Sessions', icon: 'users.svg' },
    { id: 'analytics', label: 'Analytics', icon: 'graph.svg' },
    { id: 'comparison', label: 'Comparison', icon: 'search.svg' },
    { id: 'settings', label: 'Settings', icon: 'settings.svg' },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-[var(--bg-secondary)] border-r border-[var(--border-color)] transition-all duration-200 z-50 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo/Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-color)]">
        {!isCollapsed && (
          <div className="flex items-center gap-2 flex-1">
            <p className='text-xl font-semibold text-[var(--text-primary)]'>
              Performance<span className="text-indigo-500 font-bold">Monitor</span>
            </p>
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center flex-1">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg text-left transition-colors ${activeView === item.id
              ? 'bg-indigo-500/15 text-indigo-400 border-l-2 border-indigo-500'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            title={isCollapsed ? item.label : ''}
          >
            <img
              src={`/assets/icons/${item.icon}`}
              alt={item.label}
              className="w-5 h-5 flex-shrink-0 opacity-80"
            />
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-[var(--border-color)]">
        {/* Live Mode Toggle */}
        <button
          onClick={toggleLiveMode}
          className={`w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg transition-colors ${isLive
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          title={isCollapsed ? (isLive ? 'Live Mode On' : 'Live Mode Off') : ''}
        >
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></div>
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {isLive ? 'Live Mode' : 'Paused'}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : ''}
        >
          <img
            src={theme === 'dark' ? '/assets/icons/sun.svg' : '/assets/icons/moon.svg'}
            alt={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            className="w-5 h-5 opacity-80"
          />
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
