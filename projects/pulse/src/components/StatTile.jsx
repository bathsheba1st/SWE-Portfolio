/** One headline number. `status` adds a short note such as "Normal". */
export default function StatTile({ label, value, hint, status }) {
  return (
    <div className="tile card">
      <p className="tile-label">{label}</p>
      <p className="tile-value">{value}</p>
      {/* The note uses a symbol and a word, never color alone. */}
      {status && <p className={`tile-status tile-status-${status.level}`}>{status.text}</p>}
      {hint && <p className="tile-hint">{hint}</p>}
    </div>
  );
}
