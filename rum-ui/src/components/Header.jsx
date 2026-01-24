import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLiveMode } from '../contexts/LiveModeContext';

export const Header = ({ title, subtitle, timeRange, setTimeRange, onDateRangeChange }) => {
  const { theme } = useTheme();
  const { isLive } = useLiveMode();

  const [showCustom, setShowCustom] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');

  // Preset time ranges
  const presetOptions = [
    { label: '15 min', value: 900000 },
    { label: '1 hour', value: 3600000 },
    { label: '6 hours', value: 21600000 },
    { label: '12 hours', value: 43200000 },
    { label: '24 hours', value: 86400000 },
    { label: '7 days', value: 604800000 },
  ];

  const handlePresetClick = (value) => {
    setTimeRange(value);
    setShowCustom(false);
  };

  const handleApplyCustomRange = () => {
    if (startDate && endDate) {
      const start = new Date(`${startDate}T${startTime}`).getTime();
      const end = new Date(`${endDate}T${endTime}`).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        const range = end - start;
        setTimeRange(range);
        if (onDateRangeChange) {
          onDateRangeChange({ start, end });
        }
        setShowCustom(false);
      }
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] sticky top-0 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-3">
              {title}
              {isLive && (
                <div className="flex items-center gap-2 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-emerald-400 font-medium">LIVE</span>
                </div>
              )}
            </h1>
            {subtitle && (
              <p className="text-sm text-[var(--text-tertiary)] mt-1">{subtitle}</p>
            )}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            {/* Preset Buttons */}
            <div className="flex gap-1 bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--border-color)]">
              {presetOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handlePresetClick(option.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${timeRange === option.value && !showCustom
                      ? 'bg-indigo-500 text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  {option.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustom(!showCustom)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${showCustom
                    ? 'bg-indigo-500 text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                  }`}
              >
                Custom
              </button>
            </div>
          </div>
        </div>

        {/* Custom Date Range Panel */}
        {showCustom && (
          <div className="mt-4 flex items-end gap-3 flex-wrap bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-color)]">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-tertiary)] font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-tertiary)] font-medium">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="px-2.5 py-1.5 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-[var(--text-tertiary)] pb-2 font-medium">→</span>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-tertiary)] font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text-tertiary)] font-medium">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="px-2.5 py-1.5 text-sm rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleApplyCustomRange}
              className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-md transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => setShowCustom(false)}
              className="px-4 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-sm font-medium rounded-md transition-colors border border-[var(--border-color)]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
