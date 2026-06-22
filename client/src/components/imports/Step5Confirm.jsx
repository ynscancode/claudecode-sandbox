import { CheckCircle2, AlertTriangle } from 'lucide-react'

export default function Step5Confirm({ submitting, error, result }) {
  if (result) {
    return (
      <div className="import-confirm-summary" role="status">
        <span className="import-confirm-summary-title">
          <CheckCircle2 size={18} aria-hidden="true" />
          Import complete
        </span>
        <span>{result.created} transaction{result.created === 1 ? '' : 's'} created.</span>
        <span>{result.transfersLinked} transfer pair{result.transfersLinked === 1 ? '' : 's'} linked.</span>
        <span>{result.categoriesCreated} new categor{result.categoriesCreated === 1 ? 'y' : 'ies'} created.</span>
      </div>
    )
  }

  return (
    <div>
      <p>Ready to import. Nothing has been written yet — click Confirm to commit.</p>
      {submitting && <p aria-live="polite">Importing…</p>}
      {error && (
        <p className="error-text" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
