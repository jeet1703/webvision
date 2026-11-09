import React, { useState } from 'react';
import { Header } from './Header';
import { Panel, EmptyState, fmtMs } from './ui/primitives';
import { Icon } from './ui/Icon';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const hasBody = (m) => m === 'POST' || m === 'PUT' || m === 'PATCH';
const emptyApi = () => ({ url: '', method: 'GET', body: '', headers: [{ key: '', value: '' }], bodyType: 'json' });

const jsonError = (body) => {
  try {
    JSON.parse(body);
    return null;
  } catch (e) {
    return e.message;
  }
};

const ApiConfig = ({ label, optional, api, setApi }) => {
  const setHeader = (idx, field, value) =>
    setApi({ ...api, headers: api.headers.map((h, i) => (i === idx ? { ...h, [field]: value } : h)) });
  const bodyErr = api.bodyType === 'json' && api.body ? jsonError(api.body) : null;

  return (
    <Panel
      title={label}
      subtitle={optional ? 'Optional. Leave blank to test one endpoint.' : 'Required'}
      bodyClassName="p-4 space-y-4"
    >
      <div>
        <label className="label" htmlFor={`${label}-url`}>Endpoint</label>
        <div className="flex gap-2">
          <select
            className="field w-[96px] mono font-medium"
            value={api.method}
            onChange={(e) => setApi({ ...api, method: e.target.value })}
            aria-label="HTTP method"
          >
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <input
            id={`${label}-url`}
            className="field mono flex-1"
            value={api.url}
            onChange={(e) => setApi({ ...api, url: e.target.value })}
            placeholder="https://api.example.com/v1/items"
            spellCheck={false}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="label mb-0">Headers</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setApi({ ...api, headers: [...api.headers, { key: '', value: '' }] })}
          >
            <Icon name="plus" size={12} /> Add header
          </button>
        </div>
        <div className="space-y-2">
          {api.headers.map((h, idx) => (
            <div key={idx} className="flex gap-2">
              <input className="field mono flex-1" value={h.key} onChange={(e) => setHeader(idx, 'key', e.target.value)} placeholder="Authorization" spellCheck={false} />
              <input className="field mono flex-1" value={h.value} onChange={(e) => setHeader(idx, 'value', e.target.value)} placeholder="Bearer …" spellCheck={false} />
              <button
                className="btn btn-ghost w-8 px-0"
                disabled={api.headers.length === 1}
                onClick={() => setApi({ ...api, headers: api.headers.filter((_, i) => i !== idx) })}
                aria-label="Remove header"
                title="Remove header"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {hasBody(api.method) && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="label mb-0">Body</span>
            <div className="segmented">
              <button aria-pressed={api.bodyType === 'json'} onClick={() => setApi({ ...api, bodyType: 'json' })}>JSON</button>
              <button aria-pressed={api.bodyType === 'text'} onClick={() => setApi({ ...api, bodyType: 'text' })}>Text</button>
            </div>
          </div>
          <textarea
            className="field mono text-[12px]"
            rows={6}
            value={api.body}
            onChange={(e) => setApi({ ...api, body: e.target.value })}
            placeholder={api.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Plain text body'}
            spellCheck={false}
            style={bodyErr ? { borderColor: 'var(--critical)' } : undefined}
          />
          {api.bodyType === 'json' && api.body && (
            <p className={`mt-1 text-[12px] flex items-center gap-1 ${bodyErr ? 'text-[var(--critical-text)]' : 'text-[var(--good-text)]'}`}>
              <Icon name={bodyErr ? 'alert' : 'check'} size={12} />
              {bodyErr ? `Invalid JSON: ${bodyErr}` : 'Valid JSON'}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
};

const statusTone = (code) =>
  !code ? 'critical' : code < 300 ? 'good' : code < 400 ? 'warning' : 'critical';

const ResponseDrawer = ({ response, onClose }) => (
  <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
    <div
      className="h-full w-full max-w-2xl bg-[var(--bg-secondary)] border-l border-[var(--border-color)] flex flex-col"
      style={{ boxShadow: 'var(--shadow-pop)' }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={`${response.label} responses`}
    >
      <header className="panel-head">
        <div className="min-w-0">
          <h3 className="panel-title">{response.label} · {response.results.length} runs</h3>
          <p className="panel-sub mono truncate">{response.url}</p>
        </div>
        <button className="btn btn-ghost w-8 px-0" onClick={onClose} aria-label="Close">
          <Icon name="x" size={16} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {response.results.map((res, idx) => (
          <details key={idx} className="panel" open={idx === 0}>
            <summary className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-[12px]">
              <span className="text-[var(--text-muted)] num w-12">Run {idx + 1}</span>
              <span className={`chip chip-${statusTone(res.statusCode)} num`}>{res.statusCode || '—'} {res.statusText}</span>
              <span className="num text-[var(--text-primary)]">{res.responseTime.toFixed(0)} ms</span>
              <span className="num text-[var(--text-muted)]">{(res.responseSize / 1024).toFixed(2)} KB</span>
              <span className="ml-auto text-[var(--text-muted)] num">{new Date(res.timestamp).toLocaleTimeString()}</span>
            </summary>
            <div className="px-3 pb-3 space-y-3">
              {res.error && (
                <div className="text-[12px] text-[var(--critical-text)] bg-[var(--critical-soft)] rounded-md px-3 py-2">{res.error}</div>
              )}
              {res.responseHeaders && Object.keys(res.responseHeaders).length > 0 && (
                <div>
                  <p className="eyebrow mb-1.5">Headers</p>
                  <div className="codeblock mono">
                    {Object.entries(res.responseHeaders).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[var(--accent-text)]">{k}</span>: {String(v)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {res.responseBody && (
                <div>
                  <p className="eyebrow mb-1.5">Body · {res.responseContentType}</p>
                  <pre className="codeblock max-h-96 whitespace-pre-wrap break-all">
                    {(() => {
                      if (res.responseContentType?.includes('application/json')) {
                        try {
                          return JSON.stringify(JSON.parse(res.responseBody), null, 2);
                        } catch {
                          /* fall through */
                        }
                      }
                      return res.responseBody.length > 10000
                        ? `${res.responseBody.slice(0, 10000)}\n\n… truncated at 10,000 characters`
                        : res.responseBody;
                    })()}
                  </pre>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  </div>
);

const Ms = ({ v }) => {
  const f = fmtMs(v);
  return (
    <>
      {f.value}
      <span className="text-[var(--text-muted)] ml-0.5">{f.unit}</span>
    </>
  );
};

export const ComparisonView = () => {
  const [api1, setApi1] = useState(emptyApi);
  const [api2, setApi2] = useState(emptyApi);
  const [testResults, setTestResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testIterations, setTestIterations] = useState(3);
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Test a single API endpoint
  const testApi = async (apiConfig, iterations = 1) => {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const startRequestTime = Date.now();
      
      try {
        // Ensure URL has protocol
        const testUrl = apiConfig.url.startsWith('http://') || apiConfig.url.startsWith('https://') 
          ? apiConfig.url 
          : `https://${apiConfig.url}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        // Prepare headers from key-value pairs
        const headers = new Headers();
        
        // Add custom headers (filter out empty keys)
        if (apiConfig.headers && apiConfig.headers.length > 0) {
          apiConfig.headers.forEach(header => {
            if (header.key.trim()) {
              headers.append(header.key.trim(), header.value);
            }
          });
        }

        // Prepare request options
        const requestOptions = {
          method: apiConfig.method,
          mode: 'cors',
          signal: controller.signal,
          cache: 'no-cache',
        };

        // Add body for POST/PUT/PATCH requests
        if ((apiConfig.method === 'POST' || apiConfig.method === 'PUT' || apiConfig.method === 'PATCH') && apiConfig.body) {
          if (apiConfig.bodyType === 'json') {
            // Try to parse as JSON
            try {
              JSON.parse(apiConfig.body);
              // If Content-Type header not already set, add it
              if (!headers.has('Content-Type')) {
                headers.append('Content-Type', 'application/json');
              }
              requestOptions.body = apiConfig.body;
            } catch (e) {
              // Invalid JSON, but user wants JSON type - still send with JSON content type
              if (!headers.has('Content-Type')) {
                headers.append('Content-Type', 'application/json');
              }
              requestOptions.body = apiConfig.body;
            }
          } else {
            // Text/plain body type
            if (!headers.has('Content-Type')) {
              headers.append('Content-Type', 'text/plain');
            }
            requestOptions.body = apiConfig.body;
          }
        }

        // Add headers to request options
        if (headers.keys().next().value) {
          requestOptions.headers = headers;
        }
        
        const response = await fetch(testUrl, requestOptions);
        
        clearTimeout(timeoutId);
        
        const endTime = performance.now();
        const endRequestTime = Date.now();
        
        // Read response body (for size calculation and display)
        let responseSize = 0;
        let responseBody = '';
        let responseContentType = response.headers.get('content-type') || 'text/plain';
        try {
          const text = await response.text();
          responseSize = new Blob([text]).size;
          responseBody = text;
        } catch (e) {
          // Ignore body reading errors
        }
        
        const responseTime = endTime - startTime;
        const requestDuration = endRequestTime - startRequestTime;
        
        results.push({
          success: true,
          statusCode: response.status,
          statusText: response.statusText,
          responseTime,
          requestDuration,
          responseSize,
          responseBody,
          responseContentType,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString(),
          error: null,
        });
      } catch (error) {
        const endTime = performance.now();
        const endRequestTime = Date.now();
        const responseTime = endTime - startTime;
        const requestDuration = endRequestTime - startRequestTime;
        
        results.push({
          success: false,
          statusCode: error.name === 'AbortError' ? 0 : null,
          statusText: error.name === 'AbortError' ? 'Timeout' : 'Failed',
          responseTime,
          requestDuration,
          responseSize: 0,
          responseBody: '',
          responseContentType: '',
          responseHeaders: {},
          timestamp: new Date().toISOString(),
          error: error.message || 'Unknown error',
        });
      }
      
      // Small delay between iterations
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  };

  // Run tests on APIs
  const runTests = async () => {
    const apisToTest = [];
    if (api1.url.trim()) apisToTest.push({ ...api1, label: 'API A' });
    if (api2.url.trim()) apisToTest.push({ ...api2, label: 'API B' });
    
    if (apisToTest.length === 0) return;
    
    setIsTesting(true);
    setTestResults([]);
    
    const allResults = [];
    
    for (const apiConfig of apisToTest) {
      const results = await testApi(apiConfig, testIterations);
      
      // Calculate aggregated metrics
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);
      
      const avgResponseTime = successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length
        : 0;
      
      const minResponseTime = successfulResults.length > 0
        ? Math.min(...successfulResults.map(r => r.responseTime))
        : 0;
      
      const maxResponseTime = successfulResults.length > 0
        ? Math.max(...successfulResults.map(r => r.responseTime))
        : 0;
      
      const avgRequestDuration = successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + r.requestDuration, 0) / successfulResults.length
        : 0;
      
      const totalResponseSize = successfulResults.reduce((sum, r) => sum + r.responseSize, 0);
      const avgResponseSize = successfulResults.length > 0 ? totalResponseSize / successfulResults.length : 0;
      
      const successRate = (successfulResults.length / results.length) * 100;
      
      allResults.push({
        url: apiConfig.url,
        label: apiConfig.label,
        method: apiConfig.method,
        headers: apiConfig.headers,
        bodyType: apiConfig.bodyType,
        results,
        metrics: {
          successRate,
          successCount: successfulResults.length,
          failureCount: failedResults.length,
          avgResponseTime,
          minResponseTime,
          maxResponseTime,
          avgRequestDuration,
          avgResponseSize,
          statusCode: successfulResults.length > 0 ? successfulResults[0].statusCode : null,
        },
      });
    }
    
    setTestResults(allResults);
    setIsTesting(false);
  };

  const hasAtLeastOneApi = api1.url.trim() || api2.url.trim();
  const ok = testResults.filter((r) => r.metrics.successCount > 0);
  const winner = ok.length === 2 ? [...ok].sort((a, b) => a.metrics.avgResponseTime - b.metrics.avgResponseTime)[0] : null;
  const loser = winner ? ok.find((r) => r !== winner) : null;
  const diffPct = winner && loser.metrics.avgResponseTime > 0
    ? ((loser.metrics.avgResponseTime - winner.metrics.avgResponseTime) / loser.metrics.avgResponseTime) * 100
    : null;

  const ROWS = [
    { label: 'Status', render: (r) => <span className={`chip chip-${statusTone(r.metrics.statusCode)} num`}>{r.metrics.statusCode || 'Failed'}</span> },
    { label: 'Successful runs', render: (r) => <span className="num">{r.metrics.successCount} / {r.results.length}</span> },
    { label: 'Avg response', render: (r) => <span className="strong num"><Ms v={r.metrics.avgResponseTime} /></span>, best: 'min', key: 'avgResponseTime' },
    { label: 'Fastest run', render: (r) => <Ms v={r.metrics.minResponseTime} />, best: 'min', key: 'minResponseTime' },
    { label: 'Slowest run', render: (r) => <Ms v={r.metrics.maxResponseTime} />, best: 'min', key: 'maxResponseTime' },
    { label: 'Avg wall clock', render: (r) => <Ms v={r.metrics.avgRequestDuration} /> },
    { label: 'Avg payload', render: (r) => (r.metrics.avgResponseSize > 0 ? `${(r.metrics.avgResponseSize / 1024).toFixed(2)} KB` : '–') },
  ];

  const isBest = (row, r) => {
    if (!row.best || ok.length < 2 || !ok.includes(r)) return false;
    const vals = ok.map((x) => x.metrics[row.key]);
    return r.metrics[row.key] === Math.min(...vals);
  };

  return (
    <div className="min-h-full">
      <Header
        title="API Compare"
        subtitle="Time two endpoints from this browser"
        actions={
          <button className="btn btn-primary" onClick={runTests} disabled={!hasAtLeastOneApi || isTesting}>
            {isTesting ? <Icon name="refresh" size={14} className="animate-spin" /> : <Icon name="play" size={12} />}
            {isTesting ? 'Running…' : 'Run test'}
          </button>
        }
      />

      <div className="px-6 py-5 max-w-[1600px] mx-auto space-y-4">
        <div className="grid gap-3 grid-cols-1 xl:grid-cols-2">
          <ApiConfig label="API A" api={api1} setApi={setApi1} />
          <ApiConfig label="API B" optional api={api2} setApi={setApi2} />
        </div>

        <div className="flex items-center gap-3 text-[13px] text-[var(--text-secondary)]">
          <label htmlFor="iterations">Runs per endpoint</label>
          <input
            id="iterations"
            type="number"
            min="1"
            max="10"
            className="field w-16 num"
            value={testIterations}
            onChange={(e) => setTestIterations(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          />
          <span className="text-[12px] text-[var(--text-tertiary)]">Requests run in sequence, 500 ms apart. Cross-origin APIs must allow CORS.</span>
        </div>

        {testResults.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon="compare"
              title={isTesting ? 'Running requests…' : 'No results yet'}
              body={isTesting ? 'Each endpoint runs in turn.' : 'Enter at least one endpoint and press Run test.'}
            />
          </div>
        ) : (
          <Panel
            title="Results"
            subtitle={
              winner && diffPct != null
                ? `${winner.label} averaged ${diffPct.toFixed(0)}% faster than ${loser.label}`
                : `${testResults.reduce((s, r) => s + r.results.length, 0)} requests`
            }
          >
            <div className="overflow-x-auto">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {testResults.map((r) => (
                      <th key={r.label} className="r">
                        <span className="normal-case tracking-normal text-[12px] text-[var(--text-primary)] font-semibold">{r.label}</span>
                        <span className="block normal-case tracking-normal mono text-[11px] text-[var(--text-muted)] font-normal truncate max-w-[320px] ml-auto" title={r.url}>
                          {r.method} {r.url}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.label}>
                      <td className="text-[var(--text-tertiary)]">{row.label}</td>
                      {testResults.map((r) => (
                        <td key={r.label} className="r">
                          <span className="inline-flex items-center gap-1.5 justify-end">
                            {isBest(row, r) && <span className="chip chip-good">Best</span>}
                            {row.render(r)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td />
                    {testResults.map((r) => (
                      <td key={r.label} className="r">
                        <button
                          className="btn btn-sm"
                          onClick={() => setSelectedResponse({ url: r.url, label: r.label, results: r.results })}
                        >
                          View responses
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>

      {selectedResponse && <ResponseDrawer response={selectedResponse} onClose={() => setSelectedResponse(null)} />}
    </div>
  );
};
