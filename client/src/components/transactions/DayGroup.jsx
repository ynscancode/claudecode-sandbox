import { dayLabel } from '../../utils/dateUtils.js'
import TransactionRow from './TransactionRow.jsx'
import { computeDayTotals } from './dayTotals.js'
import { formatCurrency, formatInflow, formatOutflow } from '../../utils/format.js'

function TotalRow({ label, totalIn, totalOut, balance, indent }) {
  return (
    <tr className={`daily-total-row ${indent ? 'indent' : ''}`}>
      <td colSpan={2}>{label}</td>
      <td className="col-amount in">{formatInflow(totalIn)}</td>
      <td className="col-amount out">{formatOutflow(totalOut)}</td>
      <td></td>
      <td className="col-amount"><strong>{formatCurrency(balance)}</strong></td>
      <td></td>
    </tr>
  )
}

export default function DayGroup({ date, txns, onEdit, onDelete }) {
  const totals = computeDayTotals(txns)
  // Only show the per-account breakdown when the day actually spans more than
  // one account — otherwise it just repeats the combined total.
  const showPerAccount = totals.perAccount.length > 1
  const combinedBalance = showPerAccount
    ? totals.perAccount.reduce((sum, a) => sum + a.endOfDayBalance, 0)
    : totals.perAccount[0]?.endOfDayBalance ?? 0

  return (
    <>
      <tr className="day-header">
        <td colSpan={7}>{dayLabel(date)}</td>
      </tr>
      {txns.map((txn) => (
        <TransactionRow key={txn.id} txn={txn} onEdit={onEdit} onDelete={onDelete} />
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
