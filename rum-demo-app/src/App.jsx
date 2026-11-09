import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RUMWrapper } from './rum-sdk/RumWrapper';
import './App.css';

const API_URL = 'https://rumtest.onrender.com/api/rum';
const DASHBOARD_URL = 'https://webvizion.netlify.app/';
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 5000;

const rateVital = (name, v) => {
  const t = { LCP: [2500, 4000], FCP: [1800, 3000], CLS: [0.1, 0.25] }[name];
  if (!t) return 'good';
  return v <= t[0] ? 'good' : v <= t[1] ? 'needs-improvement' : 'poor';
};

const fmtVital = (name, v) => (name === 'CLS' ? v.toFixed(3) : `${Math.round(v)} ms`);

const KIND_LABEL = {
  pageView: 'Page view',
  pageSpeed: 'Page speed',
  webVital: 'Web Vital',
  error: 'Error',
  userAction: 'Action',
};

let nextId = 1;

function Section({ title, description, children }) {
  return (
    <section className="card">
      <header className="card-head">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="card-body">{children}</div>
    </section>
  );
}

function ActionButton({ onClick, children, tone, hint }) {
  return (
    <button className={`action ${tone ? `action-${tone}` : ''}`} onClick={onClick}>
      <span className="action-label">{children}</span>
      {hint && <span className="action-hint">{hint}</span>}
    </button>
  );
}

function App() {
  const rumRef = useRef(null);
  const logRef = useRef(null);
  const [log, setLog] = useState([]);
  const [path, setPath] = useState(window.location.pathname);
  const [vitals, setVitals] = useState({});
  const [queued, setQueued] = useState(0);
  const [lastFlush, setLastFlush] = useState(null);
  const [sessionId, setSessionId] = useState('');

  const record = useCallback((kind, summary, detail) => {
    setLog((l) => [...l, { id: nextId++, kind, summary, detail, at: new Date(), status: 'queued' }].slice(-200));
  }, []);

  useEffect(() => {
    const rum = new RUMWrapper({
      apiUrl: API_URL,
      appName: 'Demo App',
      appVersion: '1.0.0',
      environment: 'development',
      enabled: true,
      batchSize: BATCH_SIZE,
      batchInterval: BATCH_INTERVAL,
    });
    rumRef.current = rum;
    setSessionId(rum.sessionId);

    // Mark the oldest queued log entries as delivered (or failed) after each batch.
    rum.onFlush = ({ count, ok }) => {
      setLastFlush({ at: new Date(), count, ok });
      setLog((l) => {
        let remaining = count;
        const next = [...l];
        for (let i = 0; i < next.length && remaining > 0; i++) {
          if (next[i].status === 'queued') {
            next[i] = { ...next[i], status: ok ? 'sent' : 'failed' };
            remaining--;
          }
        }
        return next;
      });
    };

    const observers = [];
    const timers = [];

    timers.push(
      setTimeout(() => {
        rum.trackPageView({ pagePath: window.location.pathname, pageTitle: document.title });
        record('pageView', window.location.pathname, 'Initial load');

        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
          const loadTime = nav.loadEventEnd || nav.domComplete || nav.duration;
          rum.trackPageSpeed({
            loadTime,
            domContentLoaded: nav.domContentLoadedEventEnd,
            domInteractive: nav.domInteractive,
            resourceLoadTime: nav.loadEventEnd - nav.responseEnd,
            firstPaint: performance.getEntriesByType('paint').find((e) => e.name === 'first-paint')?.startTime,
          });
          record('pageSpeed', `${Math.round(loadTime)} ms load`, 'Navigation Timing');
        }
      }, 300)
    );

    const vital = (name, value) => {
      rum.trackWebVital({ name, value, rating: rateVital(name, value) });
      setVitals((v) => ({ ...v, [name]: value }));
      record('webVital', `${name} ${fmtVital(name, value)}`, rateVital(name, value).replace('-', ' '));
    };

    if ('PerformanceObserver' in window) {
      const observe = (type, cb) => {
        try {
          const o = new PerformanceObserver(cb);
          o.observe({ type, buffered: true });
          observers.push(o);
        } catch {
          /* entry type unsupported in this browser */
        }
      };

      observe('largest-contentful-paint', (list) => {
        const last = list.getEntries().at(-1);
        if (last) vital('LCP', last.renderTime || last.loadTime || last.startTime);
      });
      observe('paint', (list) => {
        list.getEntries().forEach((e) => e.name === 'first-contentful-paint' && vital('FCP', e.startTime));
      });
      // CLS accumulates for the page's lifetime. Report changes at most every 5 s,
      // and once more when the tab is hidden, instead of once per shift.
      let cls = 0;
      let reported = -1;
      let clsTimer = null;
      const reportCls = () => {
        clsTimer = null;
        if (cls - reported >= 0.001 || reported < 0) {
          reported = cls;
          vital('CLS', cls);
        }
      };
      observe('layout-shift', (list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
        if (!clsTimer) clsTimer = setTimeout(reportCls, 5000);
      });
      const onHidden = () => {
        if (document.visibilityState === 'hidden') {
          reportCls();
          rum.flush();
        }
      };
      document.addEventListener('visibilitychange', onHidden);
      timers.push({ clear: () => {
        clearTimeout(clsTimer);
        document.removeEventListener('visibilitychange', onHidden);
      } });
    }

    const onError = (event) => {
      rum.trackError({
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        errorType: 'javascript',
        severity: 'high',
      });
      record('error', event.message, 'Caught by window.onerror');
    };
    const onRejection = (event) => {
      const message = event.reason?.message || 'Unhandled promise rejection';
      rum.trackError({ message, errorType: 'unhandledRejection', severity: 'high' });
      record('error', message, 'Caught by unhandledrejection');
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    const poll = setInterval(() => setQueued(rum.eventsQueue.length), 500);

    return () => {
      observers.forEach((o) => o.disconnect());
      timers.forEach((t) => (typeof t === 'object' && t.clear ? t.clear() : clearTimeout(t)));
      clearInterval(poll);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      rum.destroy();
    };
  }, [record]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  const rum = () => rumRef.current;

  const trackClick = () => {
    rum()?.trackUserAction({ actionType: 'click', targetElement: 'button', targetText: 'Track a click' });
    record('userAction', 'click on "Track a click"', 'trackUserAction');
  };

  const slowLoad = () => {
    const t = 3000 + Math.random() * 2000;
    rum()?.trackPageSpeed({ loadTime: t, domContentLoaded: t * 0.7, domInteractive: t * 0.5, resourceLoadTime: t * 0.3 });
    record('pageSpeed', `${Math.round(t)} ms load`, 'Simulated slow page');
  };

  const trackError = (message, errorType, severity) => {
    rum()?.trackError({ message, source: 'demo-app', errorType, severity });
    record('error', message, `${severity} · ${errorType}`);
  };

  const throwUncaught = () => {
    setTimeout(() => {
      throw new Error('Uncaught TypeError thrown from the demo app');
    }, 0);
  };

  const rejectPromise = () => {
    Promise.reject(new Error('Promise rejected without a catch handler'));
  };

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setPath(to);
    rum()?.trackPageView({ pagePath: to, pageTitle: `Demo App ${to}` });
    record('pageView', to, 'history.pushState');
  };

  const flushNow = () => rum()?.flush();

  const counts = log.reduce((acc, e) => ({ ...acc, [e.status]: (acc[e.status] || 0) + 1 }), {});

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l3-8 4 16 3-8h4" />
            </svg>
          </span>
          <span className="brand-name">WebVizion</span>
          <span className="tag">Demo site</span>
        </div>
        <a className="btn btn-primary" href={DASHBOARD_URL} target="_blank" rel="noopener noreferrer">
          Open dashboard
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
          </svg>
        </a>
      </header>

      <main className="layout">
        <div className="main-col">
          <div className="intro">
            <h1>Generate monitoring data</h1>
            <p>
              This page runs the WebVizion RUM SDK. Each button sends an event to{' '}
              <code>{new URL(API_URL).host}</code>. The SDK sends events in batches of {BATCH_SIZE} or every{' '}
              {BATCH_INTERVAL / 1000} seconds, and they show up in the dashboard on its next refresh.
            </p>
          </div>

          <dl className="facts">
            <div>
              <dt>Session</dt>
              <dd className="mono" title={sessionId}>{sessionId ? `${sessionId.slice(0, 18)}…` : '–'}</dd>
            </div>
            <div>
              <dt>Current path</dt>
              <dd className="mono">{path}</dd>
            </div>
            {['LCP', 'FCP', 'CLS'].map((n) => (
              <div key={n}>
                <dt>{n}</dt>
                <dd className="mono">
                  {vitals[n] != null ? (
                    <>
                      <span className={`dot dot-${rateVital(n, vitals[n])}`} />
                      {fmtVital(n, vitals[n])}
                    </>
                  ) : (
                    'waiting'
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <Section title="Errors" description="Reported errors land in the dashboard's Errors view with their severity.">
            <div className="actions">
              <ActionButton tone="low" hint="severity: low" onClick={() => trackError('Minor UI warning', 'javascript', 'low')}>
                Report low error
              </ActionButton>
              <ActionButton tone="medium" hint="severity: medium" onClick={() => trackError('Deprecated API usage detected', 'javascript', 'medium')}>
                Report medium error
              </ActionButton>
              <ActionButton tone="high" hint="severity: high" onClick={() => trackError('Unhandled exception in component', 'unhandledRejection', 'high')}>
                Report high error
              </ActionButton>
              <ActionButton tone="high" hint="window.onerror" onClick={throwUncaught}>
                Throw uncaught error
              </ActionButton>
              <ActionButton tone="high" hint="unhandledrejection" onClick={rejectPromise}>
                Reject a promise
              </ActionButton>
            </div>
          </Section>

          <Section title="Navigation" description="Each route change records a page view for that path.">
            <div className="actions">
              {['/home', '/products', '/about', '/contact'].map((p) => (
                <ActionButton key={p} onClick={() => navigate(p)} hint={path === p ? 'current' : undefined}>
                  <span className="mono">{p}</span>
                </ActionButton>
              ))}
            </div>
          </Section>

          <Section title="Performance and interaction" description="Feeds the Page Speed and Sessions views.">
            <div className="actions">
              <ActionButton onClick={slowLoad} hint="3 – 5 s load time">Simulate slow load</ActionButton>
              <ActionButton onClick={trackClick} hint="trackUserAction">Track a click</ActionButton>
            </div>
          </Section>
        </div>

        <aside className="log card" aria-label="Event log">
          <header className="card-head log-head">
            <div>
              <h2>Event log</h2>
              <p>
                {queued} queued · {counts.sent || 0} sent
                {counts.failed ? ` · ${counts.failed} failed` : ''}
              </p>
            </div>
            <div className="log-actions">
              <button className="btn" onClick={flushNow} disabled={queued === 0}>Send now</button>
              <button className="btn btn-ghost" onClick={() => setLog([])} disabled={log.length === 0}>Clear</button>
            </div>
          </header>
          <p className={`flush-note ${lastFlush && !lastFlush.ok ? 'flush-failed' : ''} ${lastFlush ? '' : 'flush-idle'}`}>
            {!lastFlush
              ? 'No batch sent yet'
              : `${lastFlush.ok ? 'Last batch delivered' : 'Last batch failed'}: ${lastFlush.count} event${lastFlush.count === 1 ? '' : 's'} at ${lastFlush.at.toLocaleTimeString()}${lastFlush.ok ? '' : '. The API may be waking up.'}`}
          </p>
          {log.length === 0 ? (
            <p className="log-empty">Events appear here as you click. Newest at the bottom.</p>
          ) : (
            <ol className="log-list" ref={logRef}>
              {log.map((e) => (
                <li key={e.id} className="log-item">
                  <span className={`kind kind-${e.kind}`}>{KIND_LABEL[e.kind]}</span>
                  <div className="log-text">
                    <span className="log-summary">{e.summary}</span>
                    <span className="log-detail">{e.detail}</span>
                  </div>
                  <div className="log-meta">
                    <span className={`status status-${e.status}`}>{e.status}</span>
                    <time className="mono">{e.at.toLocaleTimeString([], { hour12: false })}</time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
