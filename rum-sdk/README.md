# webvizion

Real user monitoring for the browser. The SDK records Core Web Vitals, JavaScript errors, failed requests, page load timing and page views from real visitors, then posts them in batches to an endpoint you control.

It pairs with the WebVizion backend and dashboard ([source](https://github.com/jeet1703/webvision)), but any server that accepts a JSON array of events will work.

- No runtime dependencies. About 20 KB minified.
- ESM, CommonJS and a `<script>` tag build, with TypeScript types.
- Safe to import during server-side rendering. It does nothing until it runs in a browser.

## Install

```bash
npm install webvizion
```

## Quick start

```ts
import { RUMWrapper } from 'webvizion';

const rum = new RUMWrapper({
  backendUrl: 'https://your-api.example.com/api/rum',
});
```

That's enough. With `autoStart` on (the default), the SDK immediately records a page view and page load timing, starts observing Web Vitals, and listens for errors. It sends a batch every 5 seconds, or sooner when 50 events are waiting.

### Script tag

```html
<script src="https://unpkg.com/webvizion@1/dist/webvizion.min.global.js"></script>
<script>
  new WebVizion.RUMWrapper({ backendUrl: 'https://your-api.example.com/api/rum' });
</script>
```

### React

Create the SDK once, outside your component tree:

```tsx
// src/rum.ts
import { RUMWrapper } from 'webvizion';

export const rum = new RUMWrapper({
  backendUrl: import.meta.env.VITE_RUM_URL,
  debug: import.meta.env.DEV,
});
```

```tsx
// src/main.tsx
import './rum';
```

In Next.js, import it from a client component (`'use client'`). On the server the constructor returns an inert instance, so the import is safe either way.

## What it collects

| Event | Default | What you get |
|---|---|---|
| `webVital` | on | LCP, FCP, CLS, INP and TTFB, each with a `good` / `needs-improvement` / `poor` rating |
| `pageView` | on | Path, title and referrer on load |
| `pageSpeed` | on | Navigation Timing: total load, DOM content loaded, DOM interactive, resource load, first paint |
| `error` | on | Uncaught errors and unhandled promise rejections, with the last 50 breadcrumbs |
| `networkError` | on | `fetch` calls that return 4xx/5xx or fail outright |
| `engagement` | on | Time on page, scroll depth and interaction count when the visitor leaves |
| `userAction` | off | Clicks, form inputs and rage clicks |
| `resourcePerformance` | off | Timing for scripts, styles, images and other resources |
| `longTask` | off | Main-thread tasks over 50 ms |
| `consoleLog` | off | `console.warn` and `console.error` calls |
| `cspViolation` | off | Content Security Policy violations |

Every event carries `type`, `timestamp`, `sessionId`, `userId`, `pageUrl`, `userAgent` and a `data` object.

## Configuration

```ts
new RUMWrapper({
  backendUrl: 'https://your-api.example.com/api/rum', // required
  flushIntervalMs: 5000,  // how often to send queued events
  batchSize: 50,          // send early once this many events are queued
  autoStart: true,        // call start() from the constructor
  debug: false,           // log SDK activity to the console

  metrics: {
    webVitals: true,
    pageSpeed: true,
    pageViews: true,
    engagement: true,
    errors: true,
    networkErrors: true,
    resourcePerformance: false,
    userActions: false,
    consoleLogs: false,
    longTasks: false,
    cspViolations: false,
    enabledVitals: ['LCP', 'FCP', 'CLS', 'INP', 'TTFB'],
  },

  user: {
    enableUserTracking: true,       // keep an anonymous user ID in localStorage
    userIdStorageKey: 'rum_user_id',
  },

  userActions: {
    trackClicks: true,
    trackFormInputs: true,
    trackRageClicks: true,
    rageClickThreshold: 3,     // clicks on one element...
    rageClickTimeWindow: 1000, // ...within this many ms
  },

  consoleLogs: {
    captureLog: false,
    captureInfo: false,
    captureWarn: true,
    captureError: true,
    maxMessageLength: 500,
  },

  sampling: {
    sampleRate: 1.0, // share of Web Vital samples to keep, 0 to 1
  },

  privacy: {
    maskUserData: false, // replace every captured form value with [MASKED]
  },
});
```

## API

```ts
rum.start();                      // begin collecting (only needed with autoStart: false)
rum.stop();                       // stop, restore window.fetch, send what is queued

rum.setUser('user_123', { plan: 'pro' });             // replace the anonymous ID
rum.trackCustomEvent('checkout_completed', { items: 3 }, 129.99);
```

## Delivery

- The SDK posts a JSON array of events to `backendUrl` with `Content-Type: application/json`. Your server must allow CORS from your site's origin.
- When a send fails, the batch goes back into the queue and the next attempt waits twice as long, up to 5 minutes. A failed send never produces a `networkError` event of its own.
- The queue holds at most 500 events. Past that, it drops the oldest.
- When the tab is hidden or closed, the SDK sends the newest batch with `keepalive`, so final CLS, INP and engagement values still arrive.

## Privacy

With `userActions` on, `trackFormInputs` records the first 50 characters of each input's value. Password fields are always masked. Set `privacy.maskUserData: true` to mask every field, or turn `trackFormInputs` off.

The user ID is a random string stored in `localStorage`. Set `user.enableUserTracking: false` to send `anonymous` instead.

## License

ISC
