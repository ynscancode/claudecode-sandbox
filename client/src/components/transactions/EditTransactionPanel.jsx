import { useState } from 'react'

export default function EditTransactionPanel({ txn, onSave, onCancel }) {
  const [date, setDate] = useState(txn.date)
  const [amount, setAmount] = useState(txn.amount)
  const [comment, setComment] = useState(txn.comment)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const amountNum = Number(amount)
    if (!amountNum || amountNum <= 0) {
      setError('Amount must be a positive number')
      return
    }
    try {
      await onSave(txn.id, { date, amount: amountNum, comment })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="edit-panel">
      <div className="edit-panel-title">
        Edit transaction{txn.is_transfer ? ' (transfer — both legs will update)' : ''}
      </div>
      <form className="edit-panel-form" onSubmit={handleSubmit}>
        <label className="form-field">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="form-field amount">
          Amount
          <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label className="form-field grow">
          Note
          <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        <button type="submit" className="btn">Save</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </form>
      {error && <span className="error-text" role="alert">{error}</span>}
    </div>
  )
}
