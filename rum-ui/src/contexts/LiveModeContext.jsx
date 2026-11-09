import React, { createContext, useContext, useState } from 'react';

const LiveModeContext = createContext();

export const useLiveMode = () => {
  const context = useContext(LiveModeContext);
  if (!context) {
    throw new Error('useLiveMode must be used within LiveModeProvider');
  }
  return context;
};

export const LiveModeProvider = ({ children }) => {
  const [isLive, setIsLive] = useState(() => {
    const saved = localStorage.getItem('rum-live-mode');
    return saved ? saved === 'true' : true;
  });

  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = Number(localStorage.getItem('rum-refresh-interval'));
    return saved > 0 ? saved : 10000;
  });

  const toggleLiveMode = () => {
    setIsLive(prev => {
      const newValue = !prev;
      localStorage.setItem('rum-live-mode', newValue.toString());
      return newValue;
    });
  };

  const updateRefreshInterval = (interval) => {
    setRefreshInterval(interval);
    localStorage.setItem('rum-refresh-interval', interval.toString());
  };

  return (
    <LiveModeContext.Provider value={{ 
      isLive, 
      toggleLiveMode, 
      refreshInterval, 
      updateRefreshInterval 
    }}>
      {children}
    </LiveModeContext.Provider>
  );
};

