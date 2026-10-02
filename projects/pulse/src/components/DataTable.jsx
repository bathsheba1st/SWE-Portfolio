import { formatMs, formatNumber, formatPercent, formatTime } from '../lib/chart.js';

/**
 * The numbers behind the charts as a table, for people who cannot use the
 * charts or simply want exact values. <details> gives us the open/close
 * behavior, keyboard support included, without any JavaScript.
 */
export default function DataTable({ series }) {
  return (
    <details className="card data-table">
      <summary>Show chart data as a table</summary>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">From</th>
              <th scope="col" className="numeric">Requests</th>
              <th scope="col" className="numeric">Error rate</th>
              <th scope="col" className="numeric">Average response</th>
            </tr>
          </thead>
          <tbody>
            {series.map((bucket) => (
              <tr key={bucket.start}>
                <th scope="row">{formatTime(bucket.start)}</th>
                <td className="numeric">{formatNumber(bucket.requests)}</td>
                <td className="numeric">{formatPercent(bucket.errorRate)}</td>
                <td className="numeric">{formatMs(bucket.avgMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
