import { 
  SDKConfig, 
  AllRUMEvents, 
  WebVitalEvent, 
  ErrorEvent,
  NetworkErrorEvent,
  PageViewEvent,
  PageSpeedEvent,
  EngagementEvent,
  ResourcePerformanceEvent,
  UserActionEvent,
  ConsoleLogEvent,
  LongTaskEvent,
  CSPViolationEvent,
  CustomEventType,
  WebVitalName,
  Breadcrumb,
  ErrorSeverity
} from './types.js';

export class RUMWrapper {
  private eventsQueue: AllRUMEvents[] = [];
  private config: Required<SDKConfig>;
  private flushTimerId: number | null = null;
  private sessionId: string;
  private userId: string;
  private observers: PerformanceObserver[] = [];
  private isRunning: boolean = false;
  
  // Tracking state
  private pageLoadTime: number = Date.now();
  private pageStartTime: number = 0;
  private interactionCount: number = 0;
  private maxScrollDepth: number = 0;
  private breadcrumbs: Breadcrumb[] = [];
  private previousPagePath: string = '';
  private clickHistory: Array<{element: string, timestamp: number}> = [];

  // Delivery state
  private readonly isBrowser: boolean = typeof window !== 'undefined' && typeof document !== 'undefined';
  private originalFetch: typeof fetch | null = null;
  private consecutiveFailures: number = 0;
  private nextFlushAllowedAt: number = 0;
  private static readonly MAX_QUEUE = 500;
  private readonly onPageHide = (): void => {
    if (document.visibilityState === 'hidden' || !document.visibilityState) {
      this.flushEvents(true);
    }
  };

  constructor(config: SDKConfig) {
    // Set defaults for optional config
    this.config = {
      backendUrl: config.backendUrl,
      flushIntervalMs: config.flushIntervalMs || 5000,
      batchSize: config.batchSize || 50,
      debug: config.debug || false,
      autoStart: config.autoStart ?? true,
      
      metrics: {
        webVitals: config.metrics?.webVitals ?? true,
        pageSpeed: config.metrics?.pageSpeed ?? true,
        pageViews: config.metrics?.pageViews ?? true,
        engagement: config.metrics?.engagement ?? true,
        errors: config.metrics?.errors ?? true,
        networkErrors: config.metrics?.networkErrors ?? true,
        resourcePerformance: config.metrics?.resourcePerformance ?? false,
        userActions: config.metrics?.userActions ?? false,
        consoleLogs: config.metrics?.consoleLogs ?? false,
        longTasks: config.metrics?.longTasks ?? false,
        cspViolations: config.metrics?.cspViolations ?? false,
        enabledVitals: config.metrics?.enabledVitals ?? ['LCP', 'FCP', 'CLS', 'INP', 'TTFB'],
      },
      
      user: {
        enableUserTracking: config.user?.enableUserTracking ?? true,
        userIdStorageKey: config.user?.userIdStorageKey ?? 'rum_user_id',
        sessionIdStorageKey: config.user?.sessionIdStorageKey ?? 'rum_session_id',
      },
      
      userActions: {
        trackClicks: config.userActions?.trackClicks ?? true,
        trackFormInputs: config.userActions?.trackFormInputs ?? true,
        trackRageClicks: config.userActions?.trackRageClicks ?? true,
        rageClickThreshold: config.userActions?.rageClickThreshold ?? 3,
        rageClickTimeWindow: config.userActions?.rageClickTimeWindow ?? 1000,
      },
      
      consoleLogs: {
        captureLog: config.consoleLogs?.captureLog ?? false,
        captureInfo: config.consoleLogs?.captureInfo ?? false,
        captureWarn: config.consoleLogs?.captureWarn ?? true,
        captureError: config.consoleLogs?.captureError ?? true,
        maxMessageLength: config.consoleLogs?.maxMessageLength ?? 500,
      },
      
      sampling: {
        sampleRate: config.sampling?.sampleRate ?? 1.0,
        throttleMs: config.sampling?.throttleMs ?? 0,
      },
      
      privacy: {
        maskUserData: config.privacy?.maskUserData ?? false,
        allowedDomains: config.privacy?.allowedDomains ?? [],
      },
    };

    if (!this.isBrowser) {
      // Server-side render or non-browser runtime: stay inert.
      this.userId = 'anonymous';
      this.sessionId = 'ssr';
      return;
    }

    // Initialize IDs
    this.userId = this.getOrCreateUserId();
    this.sessionId = this.generateSessionId();
    this.pageLoadTime = Date.now();
    this.pageStartTime = performance.now();
    
    this.log('RUM Wrapper initialized with config:', this.config);
    
    // Auto-start if configured
    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * Public API: Start monitoring
   */
  public start(): void {
    if (!this.isBrowser) {
      return;
    }
    if (this.isRunning) {
      this.log('Wrapper already running');
      return;
    }

    this.log('Starting RUM monitoring...');
    this.isRunning = true;

    // Track page view on start
    if (this.config.metrics.pageViews) {
      this.trackPageView();
    }

    // Track page speed
    if (this.config.metrics.pageSpeed) {
      this.trackPageSpeed();
    }

    // Initialize web vitals
    if (this.config.metrics.webVitals) {
      this.initWebVitals();
    }

    // Initialize error tracking
    if (this.config.metrics.errors) {
      this.initErrorListeners();
    }

    // Initialize network error tracking
    if (this.config.metrics.networkErrors) {
      this.initNetworkErrorTracking();
    }

    // Initialize engagement tracking
    if (this.config.metrics.engagement) {
      this.initEngagementTracking();
    }

    // Initialize resource performance tracking
    if (this.config.metrics.resourcePerformance) {
      this.initResourcePerformanceTracking();
    }

    // Initialize user action tracking
    if (this.config.metrics.userActions) {
      this.initUserActionTracking();
    }

    // Initialize console log capture
    if (this.config.metrics.consoleLogs) {
      this.initConsoleLogCapture();
    }

    // Initialize long task tracking
    if (this.config.metrics.longTasks) {
      this.initLongTaskTracking();
    }

    // Initialize CSP violation tracking
    if (this.config.metrics.cspViolations) {
      this.initCSPViolationTracking();
    }

    // Start periodic flush, and send what is left when the page is hidden or unloaded
    this.startPeriodicFlush();
    document.addEventListener('visibilitychange', this.onPageHide);
    window.addEventListener('pagehide', this.onPageHide);
  }

  /**
   * Public API: Stop monitoring
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.log('Stopping RUM monitoring...');
    this.isRunning = false;

    // Track final engagement
    if (this.config.metrics.engagement) {
      this.trackEngagement('close');
    }

    // Clear flush timer
    if (this.flushTimerId) {
      clearInterval(this.flushTimerId);
      this.flushTimerId = null;
    }

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Restore the page's fetch and remove lifecycle listeners
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
    document.removeEventListener('visibilitychange', this.onPageHide);
    window.removeEventListener('pagehide', this.onPageHide);

    // Flush remaining events
    this.flushEvents(true);
  }

  /**
   * Public API: Track custom event
   */
  public trackCustomEvent(eventName: string, properties?: Record<string, any>, value?: number): void {
    const event: CustomEventType = {
      type: 'customEvent',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      data: {
        eventName,
        properties,
        value,
      },
    };

    this.enqueueEvent(event);
    this.addBreadcrumb('custom', `Custom event: ${eventName}`);
    this.log('Custom event tracked:', eventName, properties);
  }

  /**
   * Public API: Set user ID
   */
  public setUser(userId: string, properties?: Record<string, any>): void {
    this.userId = userId;
    
    if (this.config.user.enableUserTracking) {
      try {
        const storageKey = this.config.user.userIdStorageKey || 'rum_user_id';
        localStorage.setItem(storageKey, userId);
        if (properties) {
          localStorage.setItem(`${storageKey}_props`, JSON.stringify(properties));
        }
      } catch (e) {
        this.log('Error setting user:', e);
      }
    }
    
    this.log('User set:', userId);
  }

  // ========== BREADCRUMBS ==========
  
  private addBreadcrumb(type: Breadcrumb['type'], message: string, data?: any): void {
    this.breadcrumbs.push({
      timestamp: Date.now(),
      type,
      message,
      data,
    });

    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs.shift();
    }
  }

  // ========== USER ID & SESSION ==========
  
  private getOrCreateUserId(): string {
    if (!this.config.user.enableUserTracking) {
      return 'anonymous';
    }

    try {
      const storageKey = this.config.user.userIdStorageKey || 'rum_user_id';
      let userId = localStorage.getItem(storageKey);
      
      if (!userId) {
        userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        localStorage.setItem(storageKey, userId);
      }
      
      return userId;
    } catch (e) {
      this.log('Error accessing localStorage for user ID', e);
      return `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }
  }

  // ========== PAGE VIEW TRACKING ==========
  
  private trackPageView(): void {
    const event: PageViewEvent = {
      type: 'pageView',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      data: {
        pagePath: window.location.pathname,
        pageTitle: document.title,
        referrer: document.referrer || undefined,
        previousPage: this.previousPagePath || undefined,
      },
    };

    this.enqueueEvent(event);
    this.addBreadcrumb('navigation', `Viewed page: ${window.location.pathname}`);
    this.previousPagePath = window.location.pathname;
    this.log('Page view tracked:', event.data.pagePath);
  }

  // ========== PAGE SPEED TRACKING ==========
  
  private trackPageSpeed(): void {
    if (document.readyState === 'complete') {
      this.capturePageSpeed();
    } else {
      window.addEventListener('load', () => this.capturePageSpeed());
    }
  }

  private capturePageSpeed(): void {
    try {
      // Wait a bit to ensure all metrics are available
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as any;

        if (perfData && perfData.loadEventEnd > 0) {
          // Calculate metrics and ensure they're not negative
          const loadTime = Math.max(0, perfData.loadEventEnd - perfData.fetchStart);
          const domContentLoaded = Math.max(0, perfData.domContentLoadedEventEnd - perfData.fetchStart);
          const domInteractive = Math.max(0, perfData.domInteractive - perfData.fetchStart);
          const resourceLoadTime = Math.max(0, perfData.loadEventEnd - perfData.responseEnd);
          const firstPaint = Math.max(0, perfData.domContentLoadedEventStart - perfData.fetchStart);

          const event: PageSpeedEvent = {
            type: 'pageSpeed',
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            pageUrl: window.location.href,
            userAgent: navigator.userAgent,
            data: {
              loadTime,
              domContentLoaded,
              domInteractive,
              resourceLoadTime,
              firstPaint,
            },
          };

          this.enqueueEvent(event);
          this.addBreadcrumb('custom', `Page speed: ${event.data.loadTime.toFixed(0)}ms`);
          this.log('Page speed captured:', event.data);
        } else {
          this.log('Page speed metrics not ready yet, skipping');
        }
      }, 500); // Wait 500ms for metrics to stabilize
    } catch (e) {
      this.log('Error capturing page speed:', e);
    }
  }

  // ========== ENGAGEMENT TRACKING ==========
  
  private initEngagementTracking(): void {
    // Track interactions
    ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
      window.addEventListener(eventType, () => {
        this.interactionCount++;
      }, { passive: true });
    });

    // Track scroll depth
    window.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      this.maxScrollDepth = Math.max(this.maxScrollDepth, Math.min(scrollPercent * 100, 100));
    }, { passive: true });

    // Track on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEngagement('navigation');
      }
    });

    // Track on beforeunload
    window.addEventListener('beforeunload', () => {
      this.trackEngagement('close');
    });
  }

  private trackEngagement(exitType: 'navigation' | 'close' | 'refresh' | 'timeout'): void {
    const timeOnPage = Date.now() - this.pageLoadTime;

    const event: EngagementEvent = {
      type: 'engagement',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      data: {
        timeOnPage,
        scrollDepth: Math.round(this.maxScrollDepth),
        interactionCount: this.interactionCount,
        exitType,
      },
    };

    this.enqueueEvent(event);
    this.addBreadcrumb('custom', `Page exit: ${exitType}, Time: ${timeOnPage}ms`);
    this.log('Engagement tracked:', event.data);
  }

  // ========== RESOURCE PERFORMANCE TRACKING ==========
  
  private initResourcePerformanceTracking(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          this.trackResourcePerformance(entry);
        });
      });

      observer.observe({ type: 'resource', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      this.log('Error initializing resource performance tracking:', e);
    }
  }

  private trackResourcePerformance(entry: any): void {
    const resourceType = this.getResourceType(entry.initiatorType);
    
    const event: ResourcePerformanceEvent = {
      type: 'resourcePerformance',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      data: {
        url: entry.name,
        resourceType,
        duration: entry.duration,
        transferSize: entry.transferSize || 0,
        encodedBodySize: entry.encodedBodySize || 0,
        decodedBodySize: entry.decodedBodySize || 0,
        startTime: entry.startTime,
        dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
        tcpTime: entry.connectEnd - entry.connectStart,
        requestTime: entry.responseStart - entry.requestStart,
        responseTime: entry.responseEnd - entry.responseStart,
        cacheHit: entry.transferSize === 0 && entry.decodedBodySize > 0,
      },
    };

    this.enqueueEvent(event);
  }

  private getResourceType(initiatorType: string): ResourcePerformanceEvent['data']['resourceType'] {
    const mapping: Record<string, ResourcePerformanceEvent['data']['resourceType']> = {
      'script': 'script',
      'link': 'stylesheet',
      'img': 'image',
      'css': 'stylesheet',
      'fetch': 'fetch',
      'xmlhttprequest': 'xmlhttprequest',
    };
    
    return mapping[initiatorType] || 'other';
  }

  // ========== USER ACTION TRACKING ==========
  
  private initUserActionTracking(): void {
    if (this.config.userActions.trackClicks) {
      this.initClickTracking();
    }

    if (this.config.userActions.trackFormInputs) {
      this.initFormInputTracking();
    }
  }

  private initClickTracking(): void {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const actionData = this.getElementInfo(target);
      this.trackUserAction('click', actionData);
      
      // Check for rage clicks
      if (this.config.userActions.trackRageClicks && actionData.targetElement) {
        this.checkRageClick(actionData.targetElement);
      }

      this.addBreadcrumb('click', `Clicked: ${actionData.targetElement || 'unknown'}`);
    }, true);
  }

  private initFormInputTracking(): void {
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (!target || !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      const actionData = this.getElementInfo(target);
      
      if (target.type === 'password' || this.config.privacy.maskUserData) {
        actionData.value = '[MASKED]';
      } else {
        actionData.value = target.value.substring(0, 50);
      }

      this.trackUserAction('input', actionData);
    }, true);

    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement;
      if (!target || target.tagName !== 'FORM') return;

      const actionData = this.getElementInfo(target);
      this.trackUserAction('submit', actionData);
      this.addBreadcrumb('custom', `Form submitted: ${actionData.targetElement}`);
    }, true);
  }

  private getElementInfo(element: HTMLElement): Partial<UserActionEvent['data']> {
    return {
      targetElement: element.tagName.toLowerCase(),
      targetText: element.textContent?.substring(0, 50),
      targetId: element.id || undefined,
      targetClass: element.className || undefined,
      xPath: this.getXPath(element),
    };
  }

  private getXPath(element: HTMLElement): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    if (element === document.body) {
      return '/html/body';
    }

    const parent = element.parentNode as HTMLElement;
    if (!parent) {
      return '';
    }

    const siblings = parent.children;
    let ix = 0;
    
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i] as HTMLElement;
      if (sibling === element) {
        const parentPath = this.getXPath(parent);
        return parentPath ? `${parentPath}/${element.tagName.toLowerCase()}[${ix + 1}]` : `/${element.tagName.toLowerCase()}[${ix + 1}]`;
      }
      if (sibling.tagName === element.tagName) {
        ix++;
      }
    }
    
    return '';
  }

  private checkRageClick(elementIdentifier: string): void {
    const now = Date.now();
    const threshold = this.config.userActions.rageClickThreshold || 3;
    const timeWindow = this.config.userActions.rageClickTimeWindow || 1000;

    this.clickHistory.push({ element: elementIdentifier, timestamp: now });
    
    // Remove old clicks
    this.clickHistory = this.clickHistory.filter(
      click => now - click.timestamp < timeWindow
    );

    const sameElementClicks = this.clickHistory.filter(
      click => click.element === elementIdentifier
    );

    if (sameElementClicks.length >= threshold) {
      this.trackUserAction('rageClick', {
        targetElement: elementIdentifier,
        value: String(sameElementClicks.length),
      });
      
      this.addBreadcrumb('custom', `Rage click detected on: ${elementIdentifier}`);
      this.clickHistory = [];
    }
  }

  private trackUserAction(actionType: UserActionEvent['data']['actionType'], data: Partial<UserActionEvent['data']>): void {
    const event: UserActionEvent = {
      type: 'userAction',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      data: {
        actionType,
        targetElement: data.targetElement || '',
        targetText: data.targetText,
        targetId: data.targetId,
        targetClass: data.targetClass,
        xPath: data.xPath,
        value: data.value,
      },
    };

    this.enqueueEvent(event);
  }

  // ========== CONSOLE LOG CAPTURE ==========
  
  private initConsoleLogCapture(): void {
    const levels: Array<'log' | 'info' | 'warn' | 'error' | 'debug'> = ['log', 'info', 'warn', 'error', 'debug'];
    
    levels.forEach(level => {
      const configKey = `capture${level.charAt(0).toUpperCase() + level.slice(1)}` as keyof typeof this.config.consoleLogs;
      
      if (!this.config.consoleLogs[configKey]) return;

      const originalMethod = console[level];
      
      console[level] = (...args: any[]) => {
        originalMethod.apply(console, args);
        this.trackConsoleLog(level, args);
      };
    });
  }

  private trackConsoleLog(level: ConsoleLogEvent['data']['level'], args: any[]): void {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    const truncatedMessage = message.substring(0, this.config.consoleLogs.maxMessageLength);

    const event: ConsoleLogEvent = {
      type: 'consoleLog',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      data: {
        level,
        message: truncatedMessage,
        args: args.slice(0, 5),
      },
    };

    this.enqueueEvent(event);
    this.addBreadcrumb('console', `Console ${level}: ${truncatedMessage.substring(0, 100)}`);
  }

  // ========== LONG TASK TRACKING ==========
  
  private initLongTaskTracking(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.duration > 50) {
            this.trackLongTask(entry);
          }
        });
      });

      observer.observe({ type: 'longtask', buffered: true });
      this.observers.push(observer);
    } catch (e) {
      this.log('Error initializing long task tracking:', e);
    }
  }

  private trackLongTask(entry: any): void {
    const event: LongTaskEvent = {
      type: 'longTask',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      data: {
        duration: entry.duration,
        startTime: entry.startTime,
        attribution: entry.attribution?.[0]?.name || 'unknown',
      },
    };

    this.enqueueEvent(event);
    this.addBreadcrumb('custom', `Long task: ${entry.duration.toFixed(0)}ms`);
  }

  // ========== CSP VIOLATION TRACKING ==========
  
  private initCSPViolationTracking(): void {
    document.addEventListener('securitypolicyviolation', (e) => {
      this.trackCSPViolation(e as SecurityPolicyViolationEvent);
    });
  }

  private trackCSPViolation(violation: SecurityPolicyViolationEvent): void {
    const event: CSPViolationEvent = {
      type: 'cspViolation',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      data: {
        blockedURI: violation.blockedURI,
        violatedDirective: violation.violatedDirective,
        effectiveDirective: violation.effectiveDirective,
        originalPolicy: violation.originalPolicy,
        disposition: violation.disposition,
        statusCode: violation.statusCode,
      },
    };

    this.enqueueEvent(event);
    this.addBreadcrumb('custom', `CSP violation: ${violation.violatedDirective}`);
    this.log('CSP violation detected:', violation.violatedDirective);
  }

  // ========== WEB VITALS ==========
  
  private initWebVitals(): void {
    const enabledVitals = this.config.metrics.enabledVitals || [];
    
    if (enabledVitals.includes('LCP')) this.initLCP();
    if (enabledVitals.includes('FCP')) this.initFCP();
    if (enabledVitals.includes('CLS')) this.initCLS();
    if (enabledVitals.includes('INP')) this.initINP();
    if (enabledVitals.includes('TTFB')) this.initTTFB();
  }

  private initLCP(): void {
    if (!('PerformanceObserver' in window)) {
      this.log('PerformanceObserver not supported');
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          const value = lastEntry.renderTime || lastEntry.loadTime;
          this.enqueueWebVital('LCP', value);
          this.log('LCP captured:', value);
        }
      });

      observer.observe({ 
        type: 'largest-contentful-paint', 
        buffered: true 
      });

      this.observers.push(observer);
    } catch (e) {
      this.log('Error initializing LCP:', e);
    }
  }

  private initFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.enqueueWebVital('FCP', entry.startTime);
            this.log('FCP captured:', entry.startTime);
          }
        });
      });

      observer.observe({ 
        type: 'paint', 
        buffered: true 
      });

      this.observers.push(observer);
    } catch (e) {
      this.log('Error initializing FCP:', e);
    }
  }

  private initCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.log('CLS update:', clsValue);
          }
        });
      });

      observer.observe({ 
        type: 'layout-shift', 
        buffered: true 
      });

      this.observers.push(observer);

      const reportCLS = () => {
        if (clsValue > 0) {
          this.enqueueWebVital('CLS', clsValue);
          this.log('Final CLS captured:', clsValue);
        }
      };

      window.addEventListener('visibilitychange', reportCLS);
      window.addEventListener('pagehide', reportCLS);
    } catch (e) {
      this.log('Error initializing CLS:', e);
    }
  }

  private initINP(): void {
    if (!('PerformanceObserver' in window)) return;

    let longestInteraction = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.duration > longestInteraction) {
            longestInteraction = entry.duration;
            this.log('INP update:', longestInteraction);
          }
        });
      });

      observer.observe({ 
        type: 'event', 
        buffered: true,
      });

      this.observers.push(observer);

      const reportINP = () => {
        if (longestInteraction > 0) {
          this.enqueueWebVital('INP', longestInteraction);
          this.log('Final INP captured:', longestInteraction);
        }
      };

      window.addEventListener('visibilitychange', reportINP);
      window.addEventListener('pagehide', reportINP);
    } catch (e) {
      this.log('Error initializing INP:', e);
    }
  }

  private initTTFB(): void {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
      
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        this.enqueueWebVital('TTFB', ttfb);
        this.log('TTFB captured:', ttfb);
      }
    } catch (e) {
      this.log('Error initializing TTFB:', e);
    }
  }

  // ========== ERROR TRACKING ==========
  
  private initErrorListeners(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.enqueueError({
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        errorType: 'javascript',
        severity: this.classifyErrorSeverity(event.message),
        breadcrumbs: [...this.breadcrumbs],
      });
      
      this.addBreadcrumb('custom', `Error: ${event.message}`);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.enqueueError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        errorType: 'unhandledRejection',
        severity: 'high',
        breadcrumbs: [...this.breadcrumbs],
      });
      
      this.addBreadcrumb('custom', `Unhandled rejection: ${event.reason}`);
    });
  }

  private classifyErrorSeverity(message: string): ErrorSeverity {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('critical') || lowerMessage.includes('fatal')) {
      return 'critical';
    } else if (lowerMessage.includes('error') || lowerMessage.includes('failed')) {
      return 'high';
    } else if (lowerMessage.includes('warning') || lowerMessage.includes('deprecated')) {
      return 'medium';
    }
    
    return 'low';
  }

  // ========== NETWORK ERROR TRACKING ==========
  
  private initNetworkErrorTracking(): void {
    const originalFetch = this.getNativeFetch();
    this.originalFetch = originalFetch;
    
    window.fetch = async (resource: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const startTime = performance.now();
      const url = typeof resource === 'string' ? resource : resource instanceof URL ? resource.href : (resource as Request).url;

      // Never report on the SDK's own delivery requests
      if (url.startsWith(this.config.backendUrl)) {
        return originalFetch(resource, init);
      }
      
      try {
        const response = await originalFetch(resource, init);
        
        if (!response.ok && response.status >= 400) {
          const duration = performance.now() - startTime;
          this.enqueueNetworkError({
            url,
            method: init?.method || 'GET',
            statusCode: response.status,
            message: `HTTP ${response.status}: ${response.statusText}`,
            duration,
            errorType: 'failed',
          });
        }
        
        return response;
      } catch (error: any) {
        const duration = performance.now() - startTime;
        
        let errorType: 'timeout' | 'failed' | 'aborted' = 'failed';
        if (error.name === 'AbortError') {
          errorType = 'aborted';
        } else if (error.message?.includes('timeout')) {
          errorType = 'timeout';
        }
        
        this.enqueueNetworkError({
          url,
          method: init?.method || 'GET',
          message: error.message || 'Network error',
          duration,
          errorType,
        });
        
        throw error;
      }
    };
  }

  private enqueueNetworkError(errorData: NetworkErrorEvent['data']): void {
    const event: NetworkErrorEvent = {
      type: 'networkError',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      data: errorData,
    };

    this.enqueueEvent(event);
    this.log('Network error captured:', errorData.message);
  }

  // ========== EVENT MANAGEMENT ==========
  
  private enqueueWebVital(name: WebVitalName, value: number): void {
    const sampleRate = this.config.sampling?.sampleRate ?? 1.0;
    if (Math.random() > sampleRate) {
      return;
    }

    const rating = this.getRating(name, value);
    
    const event: WebVitalEvent = {
      type: 'webVital',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      data: {
        name,
        value,
        rating,
        navigationType: this.getNavigationType(),
      },
    };

    this.enqueueEvent(event);
    this.log(`Web vital captured: ${name} = ${value}`);
  }

  private enqueueError(errorData: ErrorEvent['data']): void {
    const event: ErrorEvent = {
      type: 'error',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      data: errorData,
    };

    this.enqueueEvent(event);
    this.log('Error captured:', errorData.message);
  }

  private enqueueEvent(event: AllRUMEvents): void {
    this.eventsQueue.push(event);
    if (this.eventsQueue.length > RUMWrapper.MAX_QUEUE) {
      // Drop the oldest events rather than grow without bound while the backend is unreachable
      this.eventsQueue.splice(0, this.eventsQueue.length - RUMWrapper.MAX_QUEUE);
    }
    this.checkBatchSize();
  }

  private checkBatchSize(): void {
    if (this.eventsQueue.length >= this.config.batchSize) {
      this.log('Batch size reached, flushing events');
      this.flushEvents();
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimerId = window.setInterval(() => {
      this.flushEvents();
    }, this.config.flushIntervalMs);
  }

  private getNativeFetch(): typeof fetch {
    return this.originalFetch ?? window.fetch.bind(window);
  }

  /**
   * Sends queued events.
   * @param final true when the page is being hidden or unloaded: uses keepalive and ignores backoff.
   */
  private async flushEvents(final: boolean = false): Promise<void> {
    if (this.eventsQueue.length === 0) {
      return;
    }
    if (!final && Date.now() < this.nextFlushAllowedAt) {
      return;
    }

    // keepalive requests are capped at 64 KB by browsers, so send the newest slice on unload
    const batch = final ? this.eventsQueue.slice(-this.config.batchSize) : [...this.eventsQueue];
    this.eventsQueue = [];

    this.log(`Flushing ${batch.length} events to backend`);

    try {
      const response = await this.getNativeFetch()(this.config.backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
        keepalive: final,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.consecutiveFailures = 0;
      this.nextFlushAllowedAt = 0;
      this.log('Events sent successfully');
    } catch (error) {
      this.log('Error sending events:', error);
      if (final) {
        return;
      }
      // Re-queue and back off exponentially: 1x, 2x, 4x ... the flush interval, capped at 5 minutes
      this.eventsQueue = batch.concat(this.eventsQueue).slice(-RUMWrapper.MAX_QUEUE);
      this.consecutiveFailures += 1;
      const delay = Math.min(300000, this.config.flushIntervalMs * 2 ** (this.consecutiveFailures - 1));
      this.nextFlushAllowedAt = Date.now() + delay;
    }
  }

  private getRating(
    name: WebVitalName, 
    value: number
  ): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<WebVitalName, {good: number, poor: number}> = {
      LCP: { good: 2500, poor: 4000 },
      FCP: { good: 1800, poor: 3000 },
      CLS: { good: 0.1, poor: 0.25 },
      INP: { good: 200, poor: 500 },
      TTFB: { good: 800, poor: 1800 },
      FID: { good: 100, poor: 300 },
      TTI: { good: 3800, poor: 7300 },
      TBT: { good: 150, poor: 300 },
    };

    const threshold = thresholds[name];
    
    if (!threshold) return 'good';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private getNavigationType(): string {
    const nav = performance.getEntriesByType('navigation')[0] as any;
    return nav?.type || 'unknown';
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[RUM Wrapper]', ...args);
    }
  }
}
