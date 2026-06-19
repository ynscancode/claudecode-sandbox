const MODES = [['cash', 'Cash'], ['percent', '%'], ['both', 'Both']]

export default function BreakdownControls({ mode, onModeChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="filter-strip-label">Show</span>
      <div className="pill-group">
        {MODES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`pill-btn ${mode === key ? 'active' : ''}`}
            onClick={() => onModeChange(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
