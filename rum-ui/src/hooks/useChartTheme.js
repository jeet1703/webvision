import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const KEYS = ['grid', 'axis', 'text-tertiary', 'text-muted', 'bg-secondary', 'series-1', 'series-2', 'series-3', 'series-4', 'good', 'warning', 'critical'];

const read = () => {
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(KEYS.map((k) => [k, cs.getPropertyValue(`--${k}`).trim()]));
};

/** Resolved token values for Recharts, which needs concrete colors. */
export const useChartTheme = () => {
  const { theme } = useTheme();
  const [colors, setColors] = useState(read);
  useEffect(() => {
    // ThemeContext sets data-theme in its own effect; read on the next frame.
    const id = requestAnimationFrame(() => setColors(read()));
    return () => cancelAnimationFrame(id);
  }, [theme]);
  return colors;
};
