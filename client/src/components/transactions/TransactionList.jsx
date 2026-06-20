import { groupByYearMonthDay } from '../../utils/dateUtils.js'
import TransactionGroup from './TransactionGroup.jsx'

export default function TransactionList({ transactions, editingId, onEdit, onSaveEdit, onCancelEdit, onDelete }) {
  if (transactions.length === 0) {
    return <p className="empty-text">No transactions in this range.</p>
  }

  const grouped = groupByYearMonthDay(transactions)
  const years = [...grouped.entries()].sort(([a], [b]) => b.localeCompare(a))

  return (
    <div>
      {years.map(([year, monthsMap]) => (
        <TransactionGroup
          key={year}
          year={year}
          monthsMap={monthsMap}
          editingId={editingId}
          onEdit={onEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
