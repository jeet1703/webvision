import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { WebVitalsView } from './components/WebVitalsView';
import { ErrorsView } from './components/ErrorsView';
import { PageSpeedView } from './components/PageSpeedView';
import { SessionsView } from './components/SessionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { ComparisonView } from './components/ComparisonView';
import { SettingsView } from './components/SettingsView';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'webvitals':
        return <WebVitalsView />;
      case 'errors':
        return <ErrorsView />;
      case 'pagespeed':
        return <PageSpeedView />;
      case 'sessions':
        return <SessionsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'comparison':
        return <ComparisonView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {renderView()}
    </Layout>
  );
}

export default App;

