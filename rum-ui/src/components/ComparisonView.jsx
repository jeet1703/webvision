import React, { useState } from 'react';
import { Header } from './Header';
import { MetricsCard } from './MetricsCard';

export const ComparisonView = () => {
  const [api1, setApi1] = useState({ 
    url: '', 
    method: 'GET', 
    body: '', 
    headers: [{ key: '', value: '' }],
    bodyType: 'json'
  });
  const [api2, setApi2] = useState({ 
    url: '', 
    method: 'GET', 
    body: '', 
    headers: [{ key: '', value: '' }],
    bodyType: 'json'
  });
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
    if (api1.url.trim()) apisToTest.push({ ...api1, label: 'API 1' });
    if (api2.url.trim()) apisToTest.push({ ...api2, label: 'API 2' });
    
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

  // Determine best/worst performer
  const getBestWorst = (metricKey, lowerIsBetter = true) => {
    if (testResults.length < 2) return { best: null, worst: null };
    
    const sorted = [...testResults].sort((a, b) => {
      const aVal = a.metrics[metricKey] || 0;
      const bVal = b.metrics[metricKey] || 0;
      return lowerIsBetter ? aVal - bVal : bVal - aVal;
    });
    
    return {
      best: sorted[0]?.url,
      worst: sorted[sorted.length - 1]?.url,
    };
  };

  const responseTimeBestWorst = getBestWorst('avgResponseTime', true);
  const successRateBestWorst = getBestWorst('successRate', false);

  const hasAtLeastOneApi = api1.url.trim() || api2.url.trim();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header 
        title="API Performance Comparison" 
        subtitle="Test and compare performance metrics between two APIs"
        timeRange={null}
        setTimeRange={() => {}}
      />

      <div className="max-w-[1920px] mx-auto px-6 py-6">
        {/* API Configuration */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Configure APIs to Compare</h2>
          
          {/* API 1 Configuration */}
          <div className="mb-6 p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg">
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">API 1</label>
            <div className="space-y-4">
              {/* URL and Method */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={api1.url}
                  onChange={(e) => setApi1({ ...api1, url: e.target.value })}
                  placeholder="Enter API URL (e.g., https://api.example.com/endpoint)"
                  className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={api1.method}
                  onChange={(e) => setApi1({ ...api1, method: e.target.value })}
                  className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              {/* Headers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Headers</label>
                  <button
                    onClick={() => setApi1({ 
                      ...api1, 
                      headers: [...api1.headers, { key: '', value: '' }] 
                    })}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <img src="/assets/icons/plus.svg" alt="Add" className="w-4 h-4" />
                    Add Header
                  </button>
                </div>
                <div className="space-y-2">
                  {api1.headers.map((header, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => {
                          const newHeaders = [...api1.headers];
                          newHeaders[idx].key = e.target.value;
                          setApi1({ ...api1, headers: newHeaders });
                        }}
                        placeholder="Header name (e.g., Authorization)"
                        className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => {
                          const newHeaders = [...api1.headers];
                          newHeaders[idx].value = e.target.value;
                          setApi1({ ...api1, headers: newHeaders });
                        }}
                        placeholder="Header value"
                        className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {api1.headers.length > 1 && (
                        <button
                          onClick={() => {
                            const newHeaders = api1.headers.filter((_, i) => i !== idx);
                            setApi1({ ...api1, headers: newHeaders });
                          }}
                          className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove header"
                        >
                          <img src="/assets/icons/trash.svg" alt="Remove" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Body */}
              {(api1.method === 'POST' || api1.method === 'PUT' || api1.method === 'PATCH') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">Request Body</label>
                    <select
                      value={api1.bodyType}
                      onChange={(e) => setApi1({ ...api1, bodyType: e.target.value })}
                      className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="json">JSON</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                  <textarea
                    value={api1.body}
                    onChange={(e) => setApi1({ ...api1, body: e.target.value })}
                    placeholder={api1.bodyType === 'json' ? '{"key": "value"}' : 'Request body text'}
                    rows="6"
                    className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                      api1.bodyType === 'json' && api1.body ? 
                        (() => {
                          try {
                            JSON.parse(api1.body);
                            return 'border-blue-500/30';
                          } catch {
                            return 'border-red-500/30';
                          }
                        })() : ''
                    }`}
                  />
                  {api1.bodyType === 'json' && api1.body && (
                    <div className="mt-1 text-xs">
                      {(() => {
                        try {
                          JSON.parse(api1.body);
                          return (
                            <span className="text-blue-400 flex items-center gap-1">
                              <img src="/assets/icons/checkmark.svg" alt="Valid" className="w-3 h-3" />
                              Valid JSON
                            </span>
                          );
                        } catch (e) {
                          return (
                            <span className="text-red-400 flex items-center gap-1">
                              <img src="/assets/icons/cross.svg" alt="Invalid" className="w-3 h-3" />
                              Invalid JSON: {e.message}
                            </span>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* API 2 Configuration */}
          <div className="mb-6 p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg">
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">API 2 (Optional)</label>
            <div className="space-y-4">
              {/* URL and Method */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={api2.url}
                  onChange={(e) => setApi2({ ...api2, url: e.target.value })}
                  placeholder="Enter API URL (e.g., https://api.example.com/endpoint)"
                  className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={api2.method}
                  onChange={(e) => setApi2({ ...api2, method: e.target.value })}
                  className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              {/* Headers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Headers</label>
                  <button
                    onClick={() => setApi2({ 
                      ...api2, 
                      headers: [...api2.headers, { key: '', value: '' }] 
                    })}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <img src="/assets/icons/plus.svg" alt="Add" className="w-4 h-4" />
                    Add Header
                  </button>
                </div>
                <div className="space-y-2">
                  {api2.headers.map((header, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => {
                          const newHeaders = [...api2.headers];
                          newHeaders[idx].key = e.target.value;
                          setApi2({ ...api2, headers: newHeaders });
                        }}
                        placeholder="Header name (e.g., Authorization)"
                        className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => {
                          const newHeaders = [...api2.headers];
                          newHeaders[idx].value = e.target.value;
                          setApi2({ ...api2, headers: newHeaders });
                        }}
                        placeholder="Header value"
                        className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {api2.headers.length > 1 && (
                        <button
                          onClick={() => {
                            const newHeaders = api2.headers.filter((_, i) => i !== idx);
                            setApi2({ ...api2, headers: newHeaders });
                          }}
                          className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove header"
                        >
                          <img src="/assets/icons/trash.svg" alt="Remove" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Body */}
              {(api2.method === 'POST' || api2.method === 'PUT' || api2.method === 'PATCH') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">Request Body</label>
                    <select
                      value={api2.bodyType}
                      onChange={(e) => setApi2({ ...api2, bodyType: e.target.value })}
                      className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="json">JSON</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                  <textarea
                    value={api2.body}
                    onChange={(e) => setApi2({ ...api2, body: e.target.value })}
                    placeholder={api2.bodyType === 'json' ? '{"key": "value"}' : 'Request body text'}
                    rows="6"
                    className={`w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                      api2.bodyType === 'json' && api2.body ? 
                        (() => {
                          try {
                            JSON.parse(api2.body);
                            return 'border-blue-500/30';
                          } catch {
                            return 'border-red-500/30';
                          }
                        })() : ''
                    }`}
                  />
                  {api2.bodyType === 'json' && api2.body && (
                    <div className="mt-1 text-xs">
                      {(() => {
                        try {
                          JSON.parse(api2.body);
                          return (
                            <span className="text-blue-400 flex items-center gap-1">
                              <img src="/assets/icons/checkmark.svg" alt="Valid" className="w-3 h-3" />
                              Valid JSON
                            </span>
                          );
                        } catch (e) {
                          return (
                            <span className="text-red-400 flex items-center gap-1">
                              <img src="/assets/icons/cross.svg" alt="Invalid" className="w-3 h-3" />
                              Invalid JSON: {e.message}
                            </span>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Test Configuration */}
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm text-gray-400">Test Iterations:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={testIterations}
              onChange={(e) => setTestIterations(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">(Higher iterations = more accurate averages)</span>
          </div>

          {/* Run Tests Button */}
          <button
            onClick={runTests}
            disabled={!hasAtLeastOneApi || isTesting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              !hasAtLeastOneApi || isTesting
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isTesting ? (
              <>
                <img src="/assets/icons/spinner.svg" alt="Loading" className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <img src="/assets/icons/play.svg" alt="Play" className="w-4 h-4" />
                Run Performance Tests
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricsCard
                title="APIs Tested"
                value={testResults.length}
                unit=""
                status="good"
                iconSrc="/assets/icons/link.svg"
              />
              <MetricsCard
                title="Avg Response Time"
                value={(() => {
                  // Calculate weighted average based on success count
                  const totalWeightedSum = testResults.reduce((sum, r) => 
                    sum + (r.metrics.avgResponseTime * r.metrics.successCount), 0
                  );
                  const totalSuccessCount = testResults.reduce((sum, r) => 
                    sum + r.metrics.successCount, 0
                  );
                  return totalSuccessCount > 0 ? totalWeightedSum / totalSuccessCount : 0;
                })()}
                unit="ms"
                status="good"
                iconSrc="/assets/icons/lightning.svg"
              />
              <MetricsCard
                title="Success Rate"
                value={(() => {
                  // Calculate weighted average based on total tests
                  const totalSuccesses = testResults.reduce((sum, r) => sum + r.metrics.successCount, 0);
                  const totalTests = testResults.reduce((sum, r) => sum + r.results.length, 0);
                  return totalTests > 0 ? (totalSuccesses / totalTests) * 100 : 0;
                })()}
                unit="%"
                status="good"
                iconSrc="/assets/icons/checkmark.svg"
              />
              <MetricsCard
                title="Total Tests"
                value={testResults.reduce((sum, r) => sum + r.results.length, 0)}
                unit=""
                status="good"
                iconSrc="/assets/icons/graph.svg"
              />
            </div>

            {/* Comparison Table */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)] sticky left-0 bg-[var(--bg-tertiary)] z-10 min-w-[200px]">
                        API
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">Method</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">Status Code</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">Success Rate (%)</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">Avg Response Time (ms)</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">Min Response Time</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">Max Response Time</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">Avg Request Duration (ms)</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">Avg Response Size</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">Success/Total</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-primary)]">Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {testResults.map((result, index) => (
                      <tr
                        key={result.url}
                        className={`hover:bg-[var(--border-color)]/50 transition-colors ${
                          index % 2 === 0 ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-[var(--text-primary)] sticky left-0 bg-inherit z-10">
                          <div className="font-semibold mb-1">{result.label}</div>
                          <div className="font-mono text-xs text-gray-400 truncate max-w-[300px]" title={result.url}>
                            {result.url.length > 50 ? `${result.url.substring(0, 47)}...` : result.url}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-[var(--text-primary)] font-medium">
                          <span className={`px-2 py-1 rounded ${
                            result.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                            result.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {result.method}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-center text-sm font-medium ${
                          result.metrics.statusCode >= 200 && result.metrics.statusCode < 300
                            ? 'text-blue-400'
                            : result.metrics.statusCode >= 300 && result.metrics.statusCode < 400
                            ? 'text-yellow-400'
                            : result.metrics.statusCode >= 400
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}>
                          {result.metrics.statusCode || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 text-center text-sm font-medium ${
                          successRateBestWorst.best === result.url ? 'text-blue-400' :
                          successRateBestWorst.worst === result.url ? 'text-red-400' :
                          result.metrics.successRate === 100 ? 'text-blue-400' :
                          result.metrics.successRate >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          <div className="flex items-center justify-center gap-1">
                            {result.metrics.successRate.toFixed(1)}%
                            {successRateBestWorst.best === result.url && testResults.length > 1 && (
                              <img src="/assets/icons/trophy.svg" alt="Best" className="w-4 h-4 text-blue-400" />
                            )}
                            {successRateBestWorst.worst === result.url && result.metrics.successRate < 100 && testResults.length > 1 && (
                              <img src="/assets/icons/alert.svg" alt="Worst" className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-center text-sm font-medium ${
                          responseTimeBestWorst.best === result.url ? 'text-blue-400' :
                          responseTimeBestWorst.worst === result.url ? 'text-red-400' :
                          result.metrics.avgResponseTime < 200 ? 'text-blue-400' :
                          result.metrics.avgResponseTime < 1000 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          <div className="flex items-center justify-center gap-1">
                            {result.metrics.avgResponseTime.toFixed(0)} ms
                            {responseTimeBestWorst.best === result.url && testResults.length > 1 && (
                              <img src="/assets/icons/trophy.svg" alt="Best" className="w-4 h-4" />
                            )}
                            {responseTimeBestWorst.worst === result.url && testResults.length > 1 && (
                              <img src="/assets/icons/alert.svg" alt="Worst" className="w-4 h-4" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-400">
                          {result.metrics.minResponseTime.toFixed(0)}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-400">
                          {result.metrics.maxResponseTime.toFixed(0)}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-[var(--text-primary)]">
                          {result.metrics.avgRequestDuration.toFixed(0)}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-[var(--text-primary)]">
                          {result.metrics.avgResponseSize > 0
                            ? (result.metrics.avgResponseSize / 1024).toFixed(2) + ' KB'
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          <span className={`font-medium ${
                            result.metrics.successCount === result.results.length
                              ? 'text-blue-400'
                              : result.metrics.failureCount === result.results.length
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }`}>
                            {result.metrics.successCount}/{result.results.length}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {result.results.length > 0 && result.results[0].success && (
                            <button
                              onClick={() => setSelectedResponse({
                                url: result.url,
                                label: result.label,
                                results: result.results
                              })}
                              className="text-blue-400 hover:text-blue-300 text-xs font-medium px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
                            >
                              View Response
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Response Viewer Modal */}
            {selectedResponse && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedResponse(null)}>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{selectedResponse.label}</h3>
                      <p className="text-xs text-gray-400 mt-1">{selectedResponse.url}</p>
                    </div>
                    <button
                      onClick={() => setSelectedResponse(null)}
                      className="text-gray-400 hover:text-[var(--text-primary)] transition-colors"
                    >
                      <img src="/assets/icons/cross.svg" alt="Close" className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                      {selectedResponse.results.map((res, idx) => (
                        <div key={idx} className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                res.success ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {res.success ? 'Success' : 'Failed'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {res.statusCode} {res.statusText}
                              </span>
                              <span className="text-xs text-gray-500">
                                {res.responseTime.toFixed(0)}ms
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(res.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          {res.responseHeaders && Object.keys(res.responseHeaders).length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Response Headers</h4>
                              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-2 text-xs font-mono">
                                {Object.entries(res.responseHeaders).map(([key, value]) => (
                                  <div key={key} className="text-gray-300">
                                    <span className="text-blue-400">{key}:</span> <span className="text-gray-400">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {res.responseBody && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase">Response Body</h4>
                                <span className="text-xs text-gray-500">
                                  {res.responseContentType} • {(res.responseSize / 1024).toFixed(2)} KB
                                </span>
                              </div>
                              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-3 overflow-x-auto">
                                {res.responseContentType?.includes('application/json') ? (
                                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                    {(() => {
                                      try {
                                        return JSON.stringify(JSON.parse(res.responseBody), null, 2);
                                      } catch {
                                        return res.responseBody;
                                      }
                                    })()}
                                  </pre>
                                ) : (
                                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                                    {res.responseBody.substring(0, 10000)}
                                    {res.responseBody.length > 10000 && '...\n\n(Response truncated)'}
                                  </pre>
                                )}
                              </div>
                            </div>
                          )}

                          {res.error && (
                            <div className="mt-3">
                              <h4 className="text-xs font-semibold text-red-400 mb-2 uppercase">Error</h4>
                              <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-xs text-red-400">
                                {res.error}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            {testResults.length > 1 && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4">
                <p className="text-sm text-gray-400 flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <img src="/assets/icons/trophy.svg" alt="Best" className="w-4 h-4" />
                    <span className="text-blue-400">= Best performer</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <img src="/assets/icons/alert.svg" alt="Worst" className="w-4 h-4" />
                    <span className="text-red-400">= Worst performer</span>
                  </span>
                  <span>Response Time: <span className="text-blue-400">&lt;200ms</span> = excellent, 
                    <span className="text-yellow-400"> 200-1000ms</span> = good, 
                    <span className="text-red-400"> &gt;1000ms</span> = needs improvement</span>
                </p>
              </div>
            )}
          </>
        )}

        {!hasAtLeastOneApi && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg">
              Configure at least one API above and click "Run Performance Tests" to see metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
