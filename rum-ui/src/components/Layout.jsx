import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

export const Layout = ({ children, activeView, setActiveView }) => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('rum-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem('rum-sidebar-collapsed', String(!c));
      } catch {
        /* storage unavailable */
      }
      return !c;
    });

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        collapsed={collapsed}
        onToggle={toggle}
      />
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
};
