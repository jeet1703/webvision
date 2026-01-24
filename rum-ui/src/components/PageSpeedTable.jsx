import React from 'react';
import { format } from 'date-fns';

export const PageSpeedTable = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <div className="text-center py-12">
          <img src="/assets/icons/document.svg" alt="Document" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-[var(--text-secondary)] text-sm">No page speed data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Page Load Speed</h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Performance metrics by page URL</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Page URL
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Avg Load (ms)
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Min (ms)
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Max (ms)
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {data.map((page, index) => {
              const avgLoad = page.avgLoadTime || 0;
              const status = avgLoad < 1000 ? 'good' : avgLoad < 3000 ? 'warning' : 'poor';
              const statusColor = {
                good: 'text-blue-400 bg-blue-400/10',
                warning: 'text-yellow-400 bg-yellow-400/10',
                poor: 'text-red-400 bg-red-400/10',
              };

              return (
                <tr key={index} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm text-[var(--text-primary)] truncate max-w-md" title={page.pageUrl}>
                      {page.pageUrl}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)]">
                      {page.viewCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-semibold ${status === 'good' ? 'text-blue-400' :
                        status === 'warning' ? 'text-yellow-400' :
                          'text-red-400'
                      }`}>
                      {avgLoad.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-[var(--text-secondary)]">
                    {page.minLoadTime ? page.minLoadTime.toFixed(0) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-[var(--text-secondary)]">
                    {page.maxLoadTime ? page.maxLoadTime.toFixed(0) : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${statusColor[status]}`}>
                      {status === 'good' ? 'Fast' : status === 'warning' ? 'Moderate' : 'Slow'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
