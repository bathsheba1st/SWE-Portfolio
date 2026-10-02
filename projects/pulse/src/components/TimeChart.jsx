import { useState } from 'react';
import { useElementWidth } from '../hooks/useElementWidth.js';
import { formatTime, linePath, niceMax } from '../lib/chart.js';

const HEIGHT = 200;
// Space around the plot for the axis labels.
const MARGIN = { top: 10, right: 8, bottom: 24, left: 54 };

/**
 * A chart of one number over time, drawn with plain SVG.
 *
 *   buckets      [{ start, requests, errorRate, avgMs }, ...] oldest first
 *   valueKey     which of those numbers to draw, e.g. 'requests'
 *   type         'bar' or 'line'
 *   formatValue  turns a number into text for labels, e.g. 120 -> "120 ms"
 */
export default function TimeChart({ title, buckets, bucketMs, valueKey, type, formatValue }) {
  const [containerRef, width] = useElementWidth();
  const [hoverIndex, setHoverIndex] = useState(null);

  const values = buckets.map((bucket) => bucket[valueKey]);
  const top = niceMax(Math.max(...values, 0));

  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const bandWidth = buckets.length ? plotWidth / buckets.length : 0; // space per bucket

  // Turn a bucket position and a value into pixel coordinates.
  const xCenter = (index) => MARGIN.left + bandWidth * (index + 0.5);
  const y = (value) => MARGIN.top + plotHeight * (1 - value / top);

  function handlePointerMove(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.floor((event.clientX - box.left - MARGIN.left) / bandWidth);
    setHoverIndex(index >= 0 && index < buckets.length ? index : null);
  }

  const hovered = hoverIndex === null ? null : buckets[hoverIndex];
  const highest = formatValue(Math.max(...values, 0));
  // Label the first, middle and last bucket on the time axis.
  const labelIndexes = [0, Math.floor(buckets.length / 2), buckets.length - 1];

  return (
    <figure className="chart card">
      <figcaption>{title}</figcaption>
      <div className="chart-area" ref={containerRef}>
        {width > 0 && (
          <svg
            width={width} height={HEIGHT} role="img"
            aria-label={`${title} over time. Highest value ${highest}. The same numbers are in the data table below.`}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            {/* Grid lines and value labels at 0, half and full height */}
            {[0, top / 2, top].map((tick) => (
              <g key={tick}>
                <line className="grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} />
                <text className="axis" x={MARGIN.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle">
                  {formatValue(tick)}
                </text>
              </g>
            ))}

            {labelIndexes.map((index, position) => (
              <text
                key={index} className="axis" y={HEIGHT - 6}
                x={position === 0 ? MARGIN.left : position === 1 ? xCenter(index) : width - MARGIN.right}
                textAnchor={['start', 'middle', 'end'][position]}
              >
                {formatTime(buckets[index].start)}
              </text>
            ))}

            {type === 'bar' && buckets.map((bucket, index) => {
              const barWidth = Math.min(Math.max(bandWidth - 2, 1), 28);
              const barHeight = plotHeight * (bucket[valueKey] / top);
              return (
                <rect
                  key={bucket.start}
                  className={index === hoverIndex ? 'bar bar-hover' : 'bar'}
                  x={xCenter(index) - barWidth / 2} y={y(bucket[valueKey])}
                  width={barWidth} height={barHeight} rx={Math.min(3, barHeight)}
                />
              );
            })}

            {type === 'line' && (
              <path
                className="line"
                d={linePath(buckets.map((bucket, index) => ({ x: xCenter(index), y: y(bucket[valueKey]) })))}
              />
            )}

            {hovered && type === 'line' && (
              <>
                <line className="crosshair" x1={xCenter(hoverIndex)} x2={xCenter(hoverIndex)} y1={MARGIN.top} y2={MARGIN.top + plotHeight} />
                <circle className="dot" cx={xCenter(hoverIndex)} cy={y(hovered[valueKey])} r={4.5} />
              </>
            )}
          </svg>
        )}

        {hovered && (
          <div
            className="tooltip"
            // Keep the tooltip inside the chart at both edges.
            style={{ left: Math.min(Math.max(xCenter(hoverIndex), 70), width - 70) }}
          >
            <strong>{formatValue(hovered[valueKey])}</strong>
            <span>{formatTime(hovered.start)} to {formatTime(hovered.start + bucketMs)}</span>
          </div>
        )}
      </div>
    </figure>
  );
}
