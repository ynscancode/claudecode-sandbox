export default function BreakdownControls({ showCash, showPercent, onToggleCash, onTogglePercent }) {
  return (
    <div className="breakdown-controls">
      <fieldset>
        <legend>Display as</legend>
        <label>
          <input type="checkbox" checked={showCash} onChange={onToggleCash} /> Cash value
        </label>
        <label>
          <input type="checkbox" checked={showPercent} onChange={onTogglePercent} /> Percentage
        </label>
      </fieldset>
    </div>
  )
}
