// Simplified RUM SDK wrapper for demo app
// This is a JavaScript version of the TypeScript SDK

export class RUMWrapper {
  constructor(config) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:8080/api/rum',
      appName: config.appName || 'Demo App',
      appVersion: config.appVersion || '1.0.0',
      environment: config.environment || 'development',
      enabled: config.enabled !== false,
      batchSize: config.batchSize || 10,
      batchInterval: config.batchInterval || 5000,
    };

    this.eventsQueue = [];
    this.sessionId = this.getOrCreateSessionId();
    this.userId = this.getOrCreateUserId();
    this.flushTimer = null;

    if (this.config.enabled) {
      this.start();
    }
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('rum_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('rum_session_id', sessionId);
    }
    return sessionId;
  }

  getOrCreateUserId() {
    let userId = localStorage.getItem('rum_user_id');
    if (!userId) {
      userId = this.generateId();
      localStorage.setItem('rum_user_id', userId);
    }
    return userId;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  start() {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => this.flush(), this.config.batchInterval);
  }

  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // Flush remaining events
  }

  destroy() {
    this.stop();
  }

  addEvent(event) {
    if (!this.config.enabled) return;

    const enrichedEvent = {
      ...event,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.eventsQueue.push(enrichedEvent);

    if (this.eventsQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /** Sends queued events. Resolves to { count, ok } so callers can report delivery. */
  async flush() {
    if (this.eventsQueue.length === 0) return { count: 0, ok: true };

    const events = [...this.eventsQueue];
    this.eventsQueue = [];

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
      });

      if (!response.ok) {
        console.error('RUM: Failed to send events', response.statusText);
      }
      this.onFlush?.({ count: events.length, ok: response.ok });
      return { count: events.length, ok: response.ok };
    } catch (error) {
      console.error('RUM: Error sending events', error);
      this.onFlush?.({ count: events.length, ok: false });
      return { count: events.length, ok: false };
    }
  }

  trackPageView(data) {
    this.addEvent({
      type: 'pageView',
      data: {
        pagePath: data.pagePath || window.location.pathname,
        pageTitle: data.pageTitle || document.title,
        referrer: data.referrer || document.referrer,
        previousPage: data.previousPage || '',
      },
    });
  }

  trackWebVital(data) {
    this.addEvent({
      type: 'webVital',
      data: {
        name: data.name,
        value: data.value,
        rating: data.rating || 'good',
        navigationType: data.navigationType || 'navigate',
      },
    });
  }

  trackError(data) {
    this.addEvent({
      type: 'error',
      data: {
        message: data.message || 'Unknown error',
        source: data.source || '',
        lineno: data.lineno || null,
        colno: data.colno || null,
        stack: data.stack || '',
        errorType: data.errorType || 'javascript',
        severity: data.severity || 'medium',
      },
    });
  }

  trackPageSpeed(data) {
    this.addEvent({
      type: 'pageSpeed',
      data: {
        loadTime: data.loadTime || 0,
        domContentLoaded: data.domContentLoaded || 0,
        domInteractive: data.domInteractive || 0,
        resourceLoadTime: data.resourceLoadTime || 0,
        firstPaint: data.firstPaint || null,
      },
    });
  }

  trackUserAction(data) {
    this.addEvent({
      type: 'userAction',
      data: {
        actionType: data.actionType || 'click',
        targetElement: data.targetElement || '',
        targetText: data.targetText || '',
        targetId: data.targetId || '',
        targetClass: data.targetClass || '',
        xPath: data.xPath || '',
        value: data.value || '',
      },
    });
  }

  trackEngagement(data) {
    this.addEvent({
      type: 'engagement',
      data: {
        timeOnPage: data.timeOnPage || 0,
        scrollDepth: data.scrollDepth || 0,
        interactionCount: data.interactionCount || 0,
        exitType: data.exitType || 'navigation',
      },
    });
  }
}

