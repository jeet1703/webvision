import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border-color)] shadow-xl">
        <p className="font-semibold text-[var(--text-primary)] mb-2 text-sm">
          {payload[0].payload.type}
        </p>
        <p className="text-xs text-red-400">
          <span className="font-medium">Count:</span> {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export const ErrorsChart = ({ data }) => {
  const { theme } = useTheme();
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tickColor = theme === 'dark' ? '#cbd5e1' : '#475569';

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = {};

    data.forEach(item => {
      const key = item.errorType || 'Unknown';
      if (!grouped[key]) {
        grouped[key] = { type: key, count: 0 };
      }
      grouped[key].count += 1;
    });

    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-8">
        <div className="text-center py-12">
          <img src="/assets/icons/checkmark.svg" alt="No errors" className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <p className="text-[var(--text-secondary)] text-sm">No errors recorded</p>
          <p className="text-[var(--text-tertiary)] text-xs mt-2">
            Great! Your application is error-free
          </p>
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
              <img src="/assets/icons/error.svg" alt="Errors" className="w-5 h-5" />
              Errors by Type
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Error distribution and frequency
            </p>
          </div>
          <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded text-xs font-semibold border border-red-500/30">
            {data.length} Total
          </div>
        </div>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="type"
              stroke={axisColor}
              style={{ fontSize: '11px' }}
              tick={{ fill: tickColor }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke={axisColor}
              style={{ fontSize: '11px' }}
              tick={{ fill: tickColor }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: tickColor }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
