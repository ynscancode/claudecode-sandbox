// Review step: renders ONLY flagged drafts (clean rows are summarized in a
// count, not individually rendered). Each flagged card has inline fix/
// exclude controls. Confirm stays disabled (enforced by the parent) until
// every flag is resolved-or-excluded.
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { ACCOUNT_NAMES } from '../../constants/categories.js'

function isTransferDraft(d) {
  return d.type === 'transfer'
}

export default function Step4Review({ drafts, onUpdateDraft, onExcludeDraft }) {
  const flagged = drafts.filter((d) => !d.excluded && d.issues.length > 0)
  const cleanCount = drafts.filter((d) => !d.excluded && d.issues.length === 0).length
  const excludedCount = drafts.filter((d) => d.excluded).length

  return (
    <div>
      <div className={`import-summary-line ${flagged.length === 0 ? 'ok' : ''}`} role="status">
        {flagged.length === 0 ? (
          <CheckCircle2 size={16} color="var(--green)" aria-hidden="true" />
        ) : (
          <AlertTriangle size={16} color="var(--red)" aria-hidden="true" />
        )}
        <span>
          {cleanCount} row{cleanCount === 1 ? '' : 's'} ready.
          {flagged.length > 0 && ` ${flagged.length} row${flagged.length === 1 ? '' : 's'} need attention.`}
          {excludedCount > 0 && ` ${excludedCount} excluded.`}
        </span>
      </div>

      {flagged.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No issues found. Continue to confirm the import.</p>
      ) : (
        flagged.map((draft) => (
          <FlagCard
            key={draft.key}
            draft={draft}
            onUpdate={(patch) => onUpdateDraft(draft.key, patch)}
            onExclude={() => onExcludeDraft(draft.key)}
          />
        ))
      )}
    </div>
  )
}

function FlagCard({ draft, onUpdate, onExclude }) {
  const label = isTransferDraft(draft)
    ? `Transfer · ${draft.date || '—'} · ${ACCOUNT_NAMES[draft.from_account_id] || '?'} → ${ACCOUNT_NAMES[draft.to_account_id] || '?'}`
    : `Row ${draft.rowIndex + 1} · ${draft.date || '—'} · ${draft.accountId ? ACCOUNT_NAMES[draft.accountId] : '—'}`

  return (
    <div className="import-flag-card">
      <div className="import-flag-card-head">
        <span className="import-flag-badge">
          <AlertTriangle size={13} aria-hidden="true" />
          Needs attention
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{label}</span>
      </div>
      <ul className="import-flag-issues">
        {draft.issues.map((issue, i) => (
          <li key={i}>{issue}</li>
        ))}
      </ul>
      <div className="import-flag-actions">
        {!isTransferDraft(draft) && draft.date == null && (
          <label className="visually-hidden" htmlFor={`fix-date-${draft.key}`}>
            Fix date for row {draft.rowIndex + 1}
          </label>
        )}
        {!isTransferDraft(draft) && (
          <input
            id={`fix-date-${draft.key}`}
            type="date"
            value={draft.date || ''}
            onChange={(e) => onUpdate({ date: e.target.value || null })}
            aria-label="Corrected date"
          />
        )}
        {!isTransferDraft(draft) && (
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={draft.amount ?? ''}
            onChange={(e) => onUpdate({ amount: e.target.value === '' ? null : Number(e.target.value) })}
            aria-label="Corrected amount"
            style={{ width: 100 }}
          />
        )}
        {!isTransferDraft(draft) && (
          <select
            value={draft.direction || ''}
            onChange={(e) => onUpdate({ direction: e.target.value || null })}
            aria-label="Corrected direction"
          >
            <option value="">— Direction —</option>
            <option value="out">Money out</option>
            <option value="in">Money in</option>
          </select>
        )}
        <button type="button" className="btn-sm btn-sm-delete" onClick={onExclude}>
          Exclude row
        </button>
      </div>
    </div>
  )
}
