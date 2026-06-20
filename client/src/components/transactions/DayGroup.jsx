import { dayLabel } from '../../utils/dateUtils.js'
import TransactionRow from './TransactionRow.jsx'
import { computeDayTotals } from './dayTotals.js'
import { formatInflow, formatOutflow } from '../../utils/format.js'
import BalanceValue from './BalanceValue.jsx'

function TotalRow({ label, totalIn, totalOut, balance, indent }) {
  return (
    <tr className="day-total-row">
      <td colSpan={2} className={indent ? 'day-total-label' : ''} style={indent ? { paddingLeft: 24 } : undefined}>
        {label}
      </td>
      <td className="col-amount cell-in">{formatInflow(totalIn)}</td>
      <td className="col-amount cell-out">{formatOutflow(totalOut)}</td>
      <td></td>
      <td className="col-amount"><BalanceValue value={balance} /></td>
      <td></td>
    </tr>
  )
}

export default function DayGroup({ date, txns, editingId, onEdit, onSaveEdit, onCancelEdit, onDelete }) {
  const totals = computeDayTotals(txns)
  // Only show the per-account breakdown when the day actually spans more than
  // one account — otherwise it just repeats the combined total.
  const showPerAccount = totals.perAccount.length > 1
  const combinedBalance = showPerAccount
    ? totals.perAccount.reduce((sum, a) => sum + a.endOfDayBalance, 0)
    : totals.perAccount[0]?.endOfDayBalance ?? 0

  return (
    <>
      <tr>
        <td colSpan={7} className="day-header-cell">
          <div className="day-header-row-inner">
            <span className="day-header-label">{dayLabel(date)}</span>
          </div>
        </td>
      </tr>
      {txns.map((txn) => (
        <TransactionRow
          key={txn.id}
          txn={txn}
          isEditing={txn.id === editingId}
          onEdit={onEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onDelete={onDelete}
        />
      ))}
      <TotalRow
        label={showPerAccount ? 'Day total (combined)' : 'Day total'}
        totalIn={totals.combined.in}
        totalOut={totals.combined.out}
        balance={combinedBalance}
      />
      {showPerAccount && totals.perAccount.map((a) => (
        <TotalRow
          key={a.accountId}
          label={a.name}
          totalIn={a.in}
          totalOut={a.out}
          balance={a.endOfDayBalance}
          indent
        />
      ))}
    </>
  )
}
