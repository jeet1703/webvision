import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border-color)] shadow-xl">
        <p className="font-semibold text-[var(--text-primary)] mb-2 text-sm">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {entry.value?.toFixed(2)}
            {entry.name === 'LCP' || entry.name === 'FCP' || entry.name === 'INP' ? ' ms' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const WebVitalsChart = ({ data }) => {
  const { theme } = useTheme();
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tickColor = theme === 'dark' ? '#cbd5e1' : '#475569';

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = {};

    data.forEach(item => {
      const timestamp = new Date(item.eventTimestamp).getTime();
      if (!grouped[timestamp]) {
        grouped[timestamp] = {
          time: format(new Date(item.eventTimestamp), 'HH:mm:ss'),
          timestamp,
        };
      }
      grouped[timestamp][item.metricName] = item.value;
    });

    return Object.values(grouped)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-30); // Last 30 data points
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-8">
        <div className="text-center py-12">
          <img src="/assets/icons/graph.svg" alt="Chart" className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-[var(--text-secondary)] text-sm">No web vitals data available</p>
          <p className="text-[var(--text-tertiary)] text-xs mt-2">Data will appear here once events are received</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <img src="/assets/icons/chart-line.svg" alt="Chart" className="w-5 h-5" />
          Web Vitals Over Time
        </h2>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Core Web Vitals performance metrics</p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="time"
              stroke={axisColor}
              style={{ fontSize: '11px' }}
              tick={{ fill: tickColor }}
            />
            <YAxis
              stroke={axisColor}
              style={{ fontSize: '11px' }}
              tick={{ fill: tickColor }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px', color: tickColor }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="LCP"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#6366f1', r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="FCP"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="INP"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="CLS"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
