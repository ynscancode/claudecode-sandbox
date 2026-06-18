import { Pencil, Trash2 } from 'lucide-react'
import { ACCOUNT_NAMES } from '../../constants/categories.js'
import { highlightClassFor, highlightLabelFor } from './highlight.js'
import { formatCurrency } from '../../utils/format.js'

export default function TransactionRow({ txn, onEdit, onDelete }) {
  const highlightClass = highlightClassFor(txn)
  // Transfer highlights mark the whole row (it's about the transfer itself);
  // spend-amount highlights (orange/red) only mark the amount cell.
  const isRowHighlight = highlightClass === 'highlight-topup' || highlightClass === 'highlight-transfer-out'
  const rowClass = isRowHighlight ? highlightClass : ''
  const amountClass = !isRowHighlight ? (highlightClass || '') : ''
  const amountText = `$${txn.amount.toFixed(2)}`
  const transferLabel = isRowHighlight ? highlightLabelFor(highlightClass) : null

  return (
    <tr className={`txn-row ${rowClass}`}>
      <td className="col-account">{ACCOUNT_NAMES[txn.account_id]}</td>
      <td className="col-category">{txn.category}</td>
      <td className={`col-amount ${txn.direction === 'in' ? amountClass : ''}`}>{txn.direction === 'in' ? amountText : ''}</td>
      <td className={`col-amount ${txn.direction === 'out' ? amountClass : ''}`}>{txn.direction === 'out' ? amountText : ''}</td>
      <td>
        {txn.comment}
        {transferLabel && <span className="transfer-label">{transferLabel}</span>}
      </td>
      <td className="col-amount">{formatCurrency(txn.running_balance)}</td>
      <td>
        <div className="col-actions">
          <button type="button" className="btn-table" onClick={() => onEdit(txn)} aria-label="Edit transaction">
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button type="button" className="btn-table btn-delete" onClick={() => onDelete(txn)} aria-label="Delete transaction">
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  )
}
