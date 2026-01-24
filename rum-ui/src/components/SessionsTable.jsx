import React, { useMemo } from 'react';
import { format } from 'date-fns';

export const SessionsTable = ({ webVitals, errors }) => {
  const sessions = useMemo(() => {
    const sessionMap = {};

    webVitals.forEach(item => {
      if (!sessionMap[item.sessionId]) {
        sessionMap[item.sessionId] = {
          sessionId: item.sessionId,
          pageUrl: item.pageUrl,
          vitalsCount: 0,
          errorsCount: 0,
          lastSeen: item.createdAt || item.eventTimestamp,
        };
      }
      sessionMap[item.sessionId].vitalsCount += 1;
      const lastSeen = item.createdAt || item.eventTimestamp;
      if (new Date(lastSeen) > new Date(sessionMap[item.sessionId].lastSeen)) {
        sessionMap[item.sessionId].lastSeen = lastSeen;
      }
    });

    errors.forEach(item => {
      if (!sessionMap[item.sessionId]) {
        sessionMap[item.sessionId] = {
          sessionId: item.sessionId,
          pageUrl: item.pageUrl,
          vitalsCount: 0,
          errorsCount: 0,
          lastSeen: item.createdAt || item.eventTimestamp,
        };
      }
      sessionMap[item.sessionId].errorsCount += 1;
      const lastSeen = item.createdAt || item.eventTimestamp;
      if (new Date(lastSeen) > new Date(sessionMap[item.sessionId].lastSeen)) {
        sessionMap[item.sessionId].lastSeen = lastSeen;
      }
    });

    return Object.values(sessionMap).sort(
      (a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)
    );
  }, [webVitals, errors]);

  if (sessions.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-8">
        <div className="text-center py-12">
          <img src="/assets/icons/users.svg" alt="Users" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-[var(--text-secondary)] text-sm">No sessions data</p>
          <p className="text-[var(--text-tertiary)] text-xs mt-2">User sessions will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <img src="/assets/icons/users.svg" alt="Users" className="w-5 h-5" />
              User Sessions
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Active user sessions and activity</p>
          </div>
          <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded text-xs font-semibold border border-blue-500/30">
            {sessions.length} Active
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Session ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Page URL
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Vitals
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Errors
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Last Seen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {sessions.slice(0, 10).map((session, index) => (
              <tr
                key={session.sessionId}
                className="hover:bg-[var(--bg-tertiary)] transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    <span className="font-mono text-sm text-[var(--text-primary)] font-medium">
                      {session.sessionId.slice(0, 16)}...
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-[var(--text-primary)] truncate max-w-md" title={session.pageUrl}>
                    {session.pageUrl}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-[var(--bg-tertiary)] text-blue-400">
                    {session.vitalsCount}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${session.errorsCount > 0
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-blue-500/10 text-blue-400'
                    }`}>
                    {session.errorsCount}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                  {format(new Date(session.lastSeen), 'MMM dd, HH:mm:ss')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sessions.length > 10 && (
        <div className="px-6 py-4 border-t border-[var(--border-color)] text-center text-xs text-[var(--text-tertiary)]">
          Showing 10 of {sessions.length} sessions
        </div>
      )}
    </div>
  );
};
