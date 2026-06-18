import { useState } from 'react'
import { Plus } from 'lucide-react'
import { OUTGOING_CATEGORIES, INCOMING_CATEGORIES, ACCOUNTS, ACCOUNT_NAMES } from '../../constants/categories.js'
import { todayStr } from '../../utils/dateUtils.js'

export default function TransactionForm({ onSubmit }) {
  const [date, setDate] = useState(todayStr())
  const [accountId, setAccountId] = useState(ACCOUNTS.SPENDING)
  const [direction, setDirection] = useState('out')
  const [category, setCategory] = useState(OUTGOING_CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState(null)

  const categories = direction === 'out' ? OUTGOING_CATEGORIES : INCOMING_CATEGORIES

  function handleDirectionChange(newDirection) {
    setDirection(newDirection)
    const allowed = newDirection === 'out' ? OUTGOING_CATEGORIES : INCOMING_CATEGORIES
    setCategory(allowed[0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const amountNum = Number(amount)
    if (!amountNum || amountNum <= 0) {
      setError('Amount must be a positive number')
      return
    }
    try {
      await onSubmit({
        date,
        account_id: Number(accountId),
        direction,
        category,
        amount: amountNum,
        comment,
      })
      setAmount('')
      setComment('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="txn-form" onSubmit={handleSubmit}>
      <label>
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label>
        Account
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {Object.entries(ACCOUNT_NAMES).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </label>
      <label>
        Direction
        <select value={direction} onChange={(e) => handleDirectionChange(e.target.value)}>
          <option value="out">Money out</option>
          <option value="in">Money in</option>
        </select>
      </label>
      <label>
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label>
        Amount
        <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </label>
      <label>
        Comment
        <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="optional" />
      </label>
      <button type="submit" className="btn-with-icon"><Plus size={16} aria-hidden="true" /> Add transaction</button>
      {error && <span className="error-text" role="alert">{error}</span>}
    </form>
  )
}
