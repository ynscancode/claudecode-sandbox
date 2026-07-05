import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/auth.js'

// Account-switcher's "Delete account" confirmation. Same
// portal/overlay/panel conventions as TransactionModal.jsx/AddAccountModal.jsx
// and reuses ClearHistoryModal.jsx's `.clear-history-warning` treatment
// (AlertTriangle + red border) for the irreversible-action warning, rather
// than inventing a new destructive-warning style.
//
// Two branches per the Director's contract: a non-guest user must type
// their password (server-verified — DELETE /api/auth/me, contract in
// TEAM-BOARD.md "senior-backend-dev — delete account"); a guest has no
// password to confirm with, so the guest branch skips the input entirely
// and shows an extra ephemeral-data warning instead.
export default function DeleteAccountModal({ onClose }) {
  const { user, deleteAccount } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const isGuest = !!user?.isGuest

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!isGuest && !password) {
      setError('Password is required')
      return
    }
    setSubmitting(true)
    try {
      // Guests have no password to verify — deleteAccount(undefined) sends
      // { password: undefined }, which the server ignores entirely for a
      // guest row (password_hash is NULL there).
      await deleteAccount(isGuest ? undefined : password)
      onClose()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const portalTarget = document.getElementById('modal-root') || document.body

  return createPortal(
    <div className="modal-overlay" onClick={submitting ? undefined : onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Delete account</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close" disabled={submitting}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="clear-history-warning">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>This permanently deletes your account and all its transactions, budgets, and categories.</strong>
              <p style={{ margin: '8px 0 0' }}>This cannot be undone.</p>
              {isGuest && (
                <p style={{ margin: '8px 0 0' }}>
                  Guest data is ephemeral — once deleted, there is no saved login to recover it with.
                </p>
              )}
            </div>
          </div>

          {!isGuest && (
            <label className="form-field">
              Password
              <input
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </label>
          )}

          {error && <span className="error-text" role="alert">{error}</span>}

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-danger" disabled={submitting}>
              {submitting ? 'Deleting…' : isGuest ? 'Delete guest account' : 'Delete account'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    portalTarget
  )
}
