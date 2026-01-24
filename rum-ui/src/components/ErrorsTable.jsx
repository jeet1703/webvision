import React, { useState } from 'react';
import { format } from 'date-fns';

export const ErrorsTable = ({ errors }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  if (!errors || errors.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-8">
        <div className="text-center py-12">
          <img src="/assets/icons/checkmark.svg" alt="No errors" className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-[var(--text-secondary)] text-sm">No errors recorded</p>
          <p className="text-[var(--text-tertiary)] text-xs mt-2">
            Great! Your application is error-free
          </p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getErrorTypeColor = (errorType) => {
    switch (errorType?.toLowerCase()) {
      case 'javascript':
        return 'bg-purple-500/20 text-purple-400';
      case 'unhandledrejection':
        return 'bg-pink-500/20 text-pink-400';
      case 'network':
        return 'bg-blue-500/20 text-blue-400';
      case 'resource':
        return 'bg-cyan-500/20 text-cyan-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const parseBreadcrumbs = (breadcrumbsJson) => {
    if (!breadcrumbsJson) return [];
    try {
      return JSON.parse(breadcrumbsJson);
    } catch {
      return [];
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <img src="/assets/icons/error.svg" alt="Errors" className="w-5 h-5" />
              Error Details
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Detailed error information captured by SDK
            </p>
          </div>
          <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded text-xs font-semibold border border-red-500/30">
            {errors.length} Total
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Page URL
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {errors.map((error, index) => {
              const isExpanded = expandedRow === index;
              const breadcrumbs = parseBreadcrumbs(error.breadcrumbs);

              return (
                <React.Fragment key={error.id || index}>
                  <tr
                    className={`hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-tertiary)]'
                      }`}
                    onClick={() => setExpandedRow(isExpanded ? null : index)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[var(--text-primary)] max-w-md truncate" title={error.message}>
                        {error.message || 'No message'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${getErrorTypeColor(error.errorType)}`}>
                        {error.errorType || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${getSeverityColor(error.severity)}`}>
                        {error.severity || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-[var(--text-secondary)] font-mono max-w-xs truncate" title={error.source}>
                        {error.source ? (
                          <>
                            {error.source}
                            {(error.lineno || error.colno) && (
                              <span className="text-[var(--text-tertiary)] ml-1">
                                :{error.lineno}:{error.colno}
                              </span>
                            )}
                          </>
                        ) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-[var(--text-secondary)] max-w-xs truncate" title={error.pageUrl}>
                        {error.pageUrl || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-[var(--text-secondary)]">
                      {error.eventTimestamp || error.createdAt
                        ? format(new Date(error.eventTimestamp || error.createdAt), 'MMM dd, HH:mm:ss')
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-400 hover:text-blue-300 text-xs font-medium">
                        {isExpanded ? 'Hide' : 'Show'}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-[var(--bg-tertiary)]">
                      <td colSpan="7" className="px-6 py-4">
                        <div className="space-y-4">
                          {/* Stack Trace */}
                          {error.stack && (
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase">Stack Trace</h4>
                              <pre className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-3 text-xs text-[var(--text-secondary)] overflow-x-auto font-mono">
                                {error.stack}
                              </pre>
                            </div>
                          )}

                          {/* Component Stack */}
                          {error.componentStack && (
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase">Component Stack</h4>
                              <pre className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-3 text-xs text-[var(--text-secondary)] overflow-x-auto font-mono">
                                {error.componentStack}
                              </pre>
                            </div>
                          )}

                          {/* Breadcrumbs */}
                          {breadcrumbs.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase">
                                Breadcrumbs ({breadcrumbs.length})
                              </h4>
                              <div className="space-y-2">
                                {breadcrumbs.map((crumb, crumbIdx) => (
                                  <div key={crumbIdx} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-2 text-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${crumb.type === 'navigation' ? 'bg-blue-500/20 text-blue-400' :
                                          crumb.type === 'click' ? 'bg-green-500/20 text-green-400' :
                                            crumb.type === 'console' ? 'bg-yellow-500/20 text-yellow-400' :
                                              crumb.type === 'xhr' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {crumb.type}
                                      </span>
                                      <span className="text-[var(--text-tertiary)]">
                                        {crumb.timestamp ? format(new Date(crumb.timestamp), 'HH:mm:ss.SSS') : ''}
                                      </span>
                                    </div>
                                    <div className="text-[var(--text-secondary)]">{crumb.message}</div>
                                    {crumb.data && Object.keys(crumb.data).length > 0 && (
                                      <div className="mt-1 text-[var(--text-tertiary)] font-mono text-xs">
                                        {JSON.stringify(crumb.data, null, 2)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Additional Info */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-[var(--text-secondary)]">Session ID:</span>
                              <span className="text-[var(--text-primary)] ml-2 font-mono">{error.sessionId || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[var(--text-secondary)]">User ID:</span>
                              <span className="text-[var(--text-primary)] ml-2 font-mono">{error.userId || 'N/A'}</span>
                            </div>
                            {error.userAgent && (
                              <div className="col-span-2">
                                <span className="text-[var(--text-secondary)]">User Agent:</span>
                                <span className="text-[var(--text-primary)] ml-2 text-xs">{error.userAgent}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
