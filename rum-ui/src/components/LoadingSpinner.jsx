import React from 'react';

export const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-16">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-[var(--border-color)] rounded-full"></div>
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
    <p className="mt-6 text-base font-medium text-[var(--text-primary)]">Loading data...</p>
    <p className="mt-1 text-sm text-[var(--text-tertiary)]">Fetching real-time metrics</p>
  </div>
);
