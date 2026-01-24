import React, { useState, useEffect, useRef } from 'react';
import { RUMWrapper } from './rum-sdk/RumWrapper';
import './App.css';

function App() {
  const rumRef = useRef(null);
  const [pageLoadTime, setPageLoadTime] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    // Initialize RUM SDK
    const rumInstance = new RUMWrapper({
      apiUrl: 'https://rumtest.onrender.com/api/rum',
      appName: 'Demo App',
      appVersion: '1.0.0',
      environment: 'development',
      enabled: true,
      batchSize: 10,
      batchInterval: 5000,
    });

    rumRef.current = rumInstance;

    // Track initial page view
    setTimeout(() => {
      rumInstance.trackPageView({
        pagePath: window.location.pathname,
        pageTitle: document.title,
      });
      setEventCount(prev => prev + 1);
    }, 100);

    // Measure page load time
    if (window.performance) {
      const perfData = window.performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;
      setPageLoadTime(loadTime);

      // Track page speed
      setTimeout(() => {
        rumInstance.trackPageSpeed({
          loadTime: loadTime,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
          domInteractive: perfData.domInteractive - perfData.navigationStart,
          resourceLoadTime: perfData.loadEventEnd - perfData.responseEnd,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        });
        setEventCount(prev => prev + 1);
      }, 100);
    }

    // Track web vitals
    if ('PerformanceObserver' in window) {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        rumInstance.trackWebVital({
          name: 'LCP',
          value: lastEntry.renderTime || lastEntry.loadTime,
          rating: lastEntry.renderTime < 2500 ? 'good' : lastEntry.renderTime < 4000 ? 'needs-improvement' : 'poor',
        });
        setEventCount(prev => prev + 1);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            rumInstance.trackWebVital({
              name: 'FCP',
              value: entry.startTime,
              rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor',
            });
            setEventCount(prev => prev + 1);
          }
        });
      }).observe({ entryTypes: ['paint'] });

      // CLS
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        rumInstance.trackWebVital({
          name: 'CLS',
          value: clsValue,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
        });
        setEventCount(prev => prev + 1);
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Track errors
    window.addEventListener('error', (event) => {
      rumInstance.trackError({
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        errorType: 'javascript',
        severity: 'high',
      });
      setEventCount(prev => prev + 1);
    });

    window.addEventListener('unhandledrejection', (event) => {
      rumInstance.trackError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        errorType: 'unhandledRejection',
        severity: 'high',
      });
      setEventCount(prev => prev + 1);
    });

    return () => {
      // Cleanup
      if (rumInstance) {
        rumInstance.destroy();
      }
    };
  }, []);

  const handleButtonClick = () => {
    if (rumRef.current) {
      rumRef.current.trackUserAction({
        actionType: 'click',
        targetElement: 'button',
        targetText: 'Test Button',
      });
      setEventCount(prev => prev + 1);
      alert('Button clicked! Event tracked.');
    }
  };

  const handleGenerateError = () => {
    if (rumRef.current) {
      // Generate a test error
      try {
        throw new Error('Test error from demo app');
      } catch (error) {
        rumRef.current.trackError({
          message: error.message,
          source: 'demo-app',
          errorType: 'javascript',
          severity: 'medium',
        });
        setEventCount(prev => prev + 1);
        alert('Test error generated and tracked!');
      }
    }
  };

  const handleSimulateSlowLoad = () => {
    if (rumRef.current) {
      // Simulate slow page load
      const slowTime = 3000 + Math.random() * 2000;
      rumRef.current.trackPageSpeed({
        loadTime: slowTime,
        domContentLoaded: slowTime * 0.7,
        domInteractive: slowTime * 0.5,
        resourceLoadTime: slowTime * 0.3,
      });
      setEventCount(prev => prev + 1);
      alert(`Simulated slow load: ${slowTime.toFixed(0)}ms`);
    }
  };

  const handleNavigate = (path) => {
    if (rumRef.current) {
      rumRef.current.trackPageView({
        pagePath: path,
        pageTitle: `Demo App - ${path}`,
      });
      setEventCount(prev => prev + 1);
      window.history.pushState({}, '', path);
    }
  };

  const trackDemoError = ({ message, errorType, severity }) => {
    if (rumRef.current) {
      rumRef.current.trackError({
        message,
        source: 'demo-app',
        errorType,
        severity,
      });
      setEventCount(prev => prev + 1);
      alert(`${severity.toUpperCase()} severity error tracked!`);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 WebVizion Demo Application</h1>
        <p>Real User Monitoring SDK Integration Demo</p>

        {/* Demo Notice Banner */}
        <div className="demo-notice">
          <span className="demo-badge">⚠️ DEMO</span>
          <p>
            This is a <strong>demo application</strong> designed to simulate a real website.
            All user interactions are being tracked and sent to the WebVizion dashboard.
          </p>
        </div>

        <div className="stats">
          <div className="stat-card">
            <span className="stat-label">Events Tracked</span>
            <span className="stat-value">{eventCount}</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Dashboard CTA */}
        <section className="dashboard-cta">
          <div className="cta-content">
            <h2>📊 View Live Dashboard</h2>
            <p>See all tracked events, web vitals, errors, and performance metrics in real-time!</p>
            <a
              href="https://webvizion.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="dashboard-link primary"
            >
              🚀 Open WebVizion Dashboard →
            </a>
          </div>
        </section>

        <section className="demo-section">
          <h2>Interactive Demo</h2>
          <p>Click the buttons below to generate RUM events that will appear in the dashboard.</p>

          <div className="button-group">
            <button className="demo-button" onClick={handleButtonClick}>
              📊 Track User Action
            </button>
            <button className="demo-button error" onClick={handleGenerateError}>
              ❌ Generate Error
            </button>
            <button className="demo-button" onClick={handleSimulateSlowLoad}>
              🐌 Simulate Slow Load
            </button>
          </div>
        </section>

        <section className="demo-section">
          <h2>Error Generator (SDK Compatible)</h2>
          <p>Generate errors with different severities and types.</p>

          <div className="button-group">
            <button
              className="demo-button success"
              onClick={() =>
                trackDemoError({
                  message: 'Minor UI warning (low severity)',
                  errorType: 'javascript',
                  severity: 'low',
                })
              }
            >
              🟢 Low Severity Error
            </button>

            <button
              className="demo-button warning"
              onClick={() =>
                trackDemoError({
                  message: 'Deprecated API usage detected',
                  errorType: 'javascript',
                  severity: 'medium',
                })
              }
            >
              🟡 Medium Severity Error
            </button>

            <button
              className="demo-button error"
              onClick={() =>
                trackDemoError({
                  message: 'Unhandled exception in component',
                  errorType: 'unhandledRejection',
                  severity: 'high',
                })
              }
            >
              🔴 High Severity Error
            </button>
          </div>
        </section>

        <section className="demo-section">
          <h2>Navigation Demo</h2>
          <p>Navigate to different pages to track page views.</p>

          <div className="button-group">
            <button className="demo-button" onClick={() => handleNavigate('/home')}>
              🏠 Home
            </button>
            <button className="demo-button" onClick={() => handleNavigate('/about')}>
              ℹ️ About
            </button>
            <button className="demo-button" onClick={() => handleNavigate('/products')}>
              📦 Products
            </button>
            <button className="demo-button" onClick={() => handleNavigate('/contact')}>
              📧 Contact
            </button>
          </div>
        </section>

        <section className="demo-section">
          <h2>Performance Test</h2>
          <p>This section will automatically track web vitals and performance metrics.</p>
          <div className="info-box">
            <p>✅ Web Vitals are being tracked automatically</p>
            <p>✅ Page load metrics are captured</p>
            <p>✅ Errors are monitored</p>
            <p>✅ User interactions are tracked</p>
          </div>
        </section>

        <section className="demo-section highlight">
          <h2>🎯 About This Demo</h2>
          <div className="about-demo">
            <p>
              This demo application simulates a real website to showcase the <strong>WebVizion RUM SDK</strong> capabilities.
              Every button click, page navigation, and error is tracked and visible in the dashboard.
            </p>
            <ul>
              <li>📈 <strong>Web Vitals</strong> - LCP, FCP, CLS metrics</li>
              <li>⚡ <strong>Page Speed</strong> - Load times and performance</li>
              <li>🐛 <strong>Error Tracking</strong> - JavaScript errors and exceptions</li>
              <li>👤 <strong>User Sessions</strong> - Navigation and interaction tracking</li>
            </ul>
            <a
              href="https://webvizion.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="dashboard-link"
            >
              📊 View Dashboard →
            </a>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>WebVizion Demo App - Sending events to rumtest.onrender.com</p>
        <p className="footer-note">This is a demonstration app. Integrate the SDK into your real application to start monitoring!</p>
      </footer>
    </div>
  );
}

export default App;
