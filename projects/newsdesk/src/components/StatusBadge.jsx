import { STATUS_LABELS } from '../labels.js';

/** A small colored label. The text carries the meaning, not just the color. */
export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>;
}
