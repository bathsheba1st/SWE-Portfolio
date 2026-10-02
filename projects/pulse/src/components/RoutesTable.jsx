import { useState } from 'react';
import { formatMs, formatNumber, formatPercent, sortRows } from '../lib/chart.js';

const COLUMNS = [
  { key: 'route', label: 'Endpoint', format: (value, row) => `${row.method} ${value}` },
  { key: 'requests', label: 'Requests', format: formatNumber, numeric: true },
  { key: 'errorRate', label: 'Error rate', format: formatPercent, numeric: true },
  { key: 'avgMs', label: 'Average', format: formatMs, numeric: true },
  { key: 'p95Ms', label: '95th percentile', format: formatMs, numeric: true },
];

/** The per-endpoint table. Click a column heading to sort by it. */
export default function RoutesTable({ routes }) {
  // Slowest first is the most useful default: it puts problems at the top.
  const [sort, setSort] = useState({ key: 'p95Ms', direction: 'desc' });

  function handleSort(key) {
    setSort((current) => ({
      key,
      // Clicking the same column again flips the direction.
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  }

  const rows = sortRows(routes, sort.key, sort.direction);

  return (
    <div className="card table-wrap">
      <table>
        <caption>Endpoints</caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => {
              const active = sort.key === column.key;
              return (
                <th
                  key={column.key} scope="col" className={column.numeric ? 'numeric' : undefined}
                  // aria-sort tells screen readers which column is sorted and how.
                  aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <button type="button" onClick={() => handleSort(column.key)}>
                    {column.label}
                    <span aria-hidden="true">{active ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}</span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.method} ${row.route}`}>
              {COLUMNS.map((column) => (
                <td key={column.key} className={column.numeric ? 'numeric' : 'route'}>
                  {column.format(row[column.key], row)}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={COLUMNS.length}>No requests in this time range yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
