import React from 'react';

export const MetricsCard = ({
  title,
  value,
  unit = '',
  status = 'good',
  iconSrc = null,
  trend = null
}) => {
  const statusConfig = {
    good: {
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    'needs-improvement': {
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    poor: {
      border: 'border-red-500/30',
      text: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  };

  const config = statusConfig[status] || statusConfig.good;

  return (
    <div
      className={`relative bg-[var(--bg-secondary)] border border-[var(--border-color)]
      ${config.border} rounded-xl p-5 hover:border-opacity-70 transition-all duration-200 
      shadow-sm hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-[var(--text-tertiary)] mb-2 uppercase tracking-wider">
            {title}
          </p>

          <div className="flex items-baseline gap-2">
            <p className={`text-3xl font-bold ${config.text}`}>
              {typeof value === 'number'
                ? (value === 0 ? '0' : value < 1 && value > 0 ? value.toFixed(2) : value.toFixed(0))
                : (value ?? '0')}
            </p>

            {unit && (
              <span className="text-sm font-medium text-[var(--text-tertiary)]">
                {unit}
              </span>
            )}
          </div>

          {trend !== null && (
            <p className={`text-xs mt-2 ${config.text} opacity-80 flex items-center gap-1`}>
              <img
                src={trend > 0 ? "/assets/icons/arrow-up.svg" : "/assets/icons/arrow-down.svg"}
                alt={trend > 0 ? "Up" : "Down"}
                className="w-3 h-3 inline"
              />
              {Math.abs(trend)}%
            </p>
          )}
        </div>

        {/* ICON */}
        {iconSrc && (
          <div className={`${config.bg} p-2.5 rounded-lg`}>
            <img
              src={iconSrc}
              alt={title}
              className="w-6 h-6 object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};
