import { useState } from 'react'
import { Plus, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react'
import { ACCOUNTS } from '../../constants/categories.js'
import { todayStr } from '../../utils/dateUtils.js'

const DIRECTIONS = [
  { value: 'savings-to-spending', label: 'Savings -> Spending (topup)', from: ACCOUNTS.SAVINGS, to: ACCOUNTS.SPENDING, defaultComment: 'topup spending from savings', icon: ArrowUpRight },
  { value: 'spending-to-savings', label: 'Spending -> Savings', from: ACCOUNTS.SPENDING, to: ACCOUNTS.SAVINGS, defaultComment: 'transfer to savings', icon: ArrowDownRight },
]

export default function TransferForm({ onSubmit }) {
  const [date, setDate] = useState(todayStr())
  const [directionKey, setDirectionKey] = useState(DIRECTIONS[0].value)
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState(DIRECTIONS[0].defaultComment)
  const [commentTouched, setCommentTouched] = useState(false)
  const [error, setError] = useState(null)

  const selected = DIRECTIONS.find((d) => d.value === directionKey)

  function handleDirectionChange(value) {
    setDirectionKey(value)
    const next = DIRECTIONS.find((d) => d.value === value)
    // Only overwrite the comment if the user hasn't manually edited it,
    // so switching direction doesn't clobber a custom comment they typed.
    if (!commentTouched) {
      setComment(next.defaultComment)
    }
  }

  function handleCommentChange(value) {
    setCommentTouched(true)
    setComment(value)
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
        from_account_id: selected.from,
        to_account_id: selected.to,
        amount: amountNum,
        comment,
      })
      setAmount('')
      setComment(selected.defaultComment)
      setCommentTouched(false)
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

      <fieldset className="transfer-direction-fieldset">
        <legend><ArrowRightLeft size={14} aria-hidden="true" /> Direction</legend>
        {DIRECTIONS.map((d) => {
          const Icon = d.icon
          return (
            <label key={d.value} className="transfer-direction-option">
              <input
                type="radio"
                name="transfer-direction"
                value={d.value}
                checked={directionKey === d.value}
                onChange={() => handleDirectionChange(d.value)}
              />
              <Icon size={16} aria-hidden="true" /> {d.label}
            </label>
          )
        })}
      </fieldset>

      <label>
        Amount
        <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </label>
      <label>
        Comment
        <input type="text" value={comment} onChange={(e) => handleCommentChange(e.target.value)} />
      </label>
      <button type="submit" className="btn-with-icon"><Plus size={16} aria-hidden="true" /> Add transfer</button>
      {error && <span className="error-text" role="alert">{error}</span>}
    </form>
  )
}
