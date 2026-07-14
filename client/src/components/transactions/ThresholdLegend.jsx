import { useState } from 'react'
import { useThresholds } from '../../contexts/thresholds.js'

// One editable pill for a single threshold (orange or red). Editing is
// independent per pill: each has its own local draft/editing state, but both
// read/write the same shared ThresholdsContext so a committed edit here is
// what TransactionRow's dot-coloring sees immediately (live re-color, no
// reload) — see contexts/ThresholdsContext.jsx + highlight.js.
function ThresholdPill({ field, otherField, thresholds, setThresholds, onErrorChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(thresholds[field]))
  const dotClass = field === 'orange' ? 'highlight-orange' : 'highlight-red'
  const value = thresholds[field]

  function startEdit() {
    setDraft(String(value))
    setEditing(true)
  }

  function commit() {
    const parsed = Number(draft)
    const other = thresholds[otherField]
    const isPositive = Number.isFinite(parsed) && parsed > 0
    const isOrdered = field === 'orange' ? parsed < other : parsed > other

    if (!isPositive || !isOrdered) {
      onErrorChange(
        field === 'orange'
          ? `Orange threshold must be less than red ($${other}).`
          : `Red threshold must be greater than orange ($${other}).`
      )
      setEditing(false)
      return
    }

    setThresholds({ ...thresholds, [field]: parsed })
    onErrorChange(null)
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setDraft(String(value))
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <span className="daily-budget-editor">
        <span className={`spend-warning-dot ${dotClass}`} aria-hidden="true" />
        <label className="visually-hidden" htmlFor={`threshold-input-${field}`}>
          {`${field} spend-signal threshold`}
        </label>
        <input
          id={`threshold-input-${field}`}
          type="number"
          min="1"
          step="1"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      </span>
    )
  }

  return (
    <button
      type="button"
      className="pill-tag pill-tag-editable"
      onClick={startEdit}
      aria-label={`Edit ${field} spend-signal threshold, currently $${value}`}
    >
      <span className={`spend-warning-dot ${dotClass}`} aria-hidden="true" />
      {`Over $${value}`}
    </button>
  )
}

export default function ThresholdLegend() {
  const { thresholds, setThresholds } = useThresholds()
  const [error, setError] = useState(null)

  return (
    <>
      <div className="threshold-legend">
        <span>Spend signals:</span>
        <ThresholdPill
          field="orange"
          otherField="red"
          thresholds={thresholds}
          setThresholds={setThresholds}
          onErrorChange={setError}
        />
        <ThresholdPill
          field="red"
          otherField="orange"
          thresholds={thresholds}
          setThresholds={setThresholds}
          onErrorChange={setError}
        />
      </div>
      {error && <span className="error-text-compact" role="alert">{error}</span>}
    </>
  )
}
