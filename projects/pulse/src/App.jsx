import { useCallback, useEffect, useState } from 'react';
import { getMetrics, sendTestTraffic } from './api.js';
import DataTable from './components/DataTable.jsx';
import RoutesTable from './components/RoutesTable.jsx';
import StatTile from './components/StatTile.jsx';
import TimeChart from './components/TimeChart.jsx';
import { formatMs, formatNumber, formatPercent, formatTime } from './lib/chart.js';

const RANGES = [
  { value: '15m', label: '15 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
];
const REFRESH_MS = 5000;
const ERROR_RATE_WARNING = 5; // percent

export default function App() {
  const [range, setRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // useCallback keeps the same function between renders (until `range`
  // changes), so the effects below do not restart on every render.
  const load = useCallback(async () => {
    try {
      const data = await getMetrics(range);
      // Ignore an answer for a range the viewer has already switched away from.
      setMetrics((current) => (data.range === range ? data : current));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [range]);

  // Load now, and again whenever the range changes.
  useEffect(() => { load(); }, [load]);

  // While auto refresh is on, load again every few seconds.
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer); // stop the old timer before starting a new one
  }, [autoRefresh, load]);

  async function handleSendTraffic() {
    setSending(true);
    await sendTestTraffic(40);
    await load();
    setSending(false);
  }

  // Only show numbers that belong to the selected range.
  const current = metrics?.range === range ? metrics : null;

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Pulse</h1>
          <p className="muted">Traffic, errors and response times for the demo API.</p>
        </div>
        <div className="controls">
          <div role="group" aria-label="Time range" className="segmented">
            {RANGES.map((option) => (
              <button
                key={option.value} type="button"
                aria-pressed={range === option.value}
                onClick={() => setRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
            Refresh every 5 seconds
          </label>
          <button type="button" className="button" onClick={handleSendTraffic} disabled={sending}>
            {sending ? 'Sending…' : 'Send test traffic'}
          </button>
        </div>
      </header>

      <main>
        {error && <p className="error" role="alert">{error}</p>}
        {!current && !error && <p className="muted">Loading metrics…</p>}

        {current && (
          <>
            <p className="muted updated">Updated {formatTime(current.to)}</p>

            <section className="tiles" aria-label="Summary">
              <StatTile label="Requests" value={formatNumber(current.totals.requests)} />
              <StatTile
                label="Error rate" value={formatPercent(current.totals.errorRate)}
                status={current.totals.errorRate >= ERROR_RATE_WARNING
                  ? { level: 'warning', text: '▲ Above 5%' }
                  : { level: 'ok', text: '✓ Normal' }}
              />
              <StatTile label="Average response" value={formatMs(current.totals.avgMs)} />
              <StatTile
                label="95th percentile" value={formatMs(current.totals.p95Ms)}
                hint="95% of requests were at least this fast"
              />
            </section>

            <section className="charts" aria-label="Charts">
              <TimeChart
                title="Requests" type="bar" valueKey="requests" formatValue={formatNumber}
                buckets={current.series} bucketMs={current.bucketMs}
              />
              <TimeChart
                title="Error rate" type="line" valueKey="errorRate" formatValue={formatPercent}
                buckets={current.series} bucketMs={current.bucketMs}
              />
              <TimeChart
                title="Average response time" type="line" valueKey="avgMs" formatValue={formatMs}
                buckets={current.series} bucketMs={current.bucketMs}
              />
            </section>

            <DataTable series={current.series} />
            <RoutesTable routes={current.routes} />
          </>
        )}
      </main>
    </>
  );
}
