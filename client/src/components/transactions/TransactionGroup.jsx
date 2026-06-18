import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { monthLabel } from '../../utils/dateUtils.js'
import DayGroup from './DayGroup.jsx'

export default function TransactionGroup({ year, monthsMap, onEdit, onDelete }) {
  const months = [...monthsMap.entries()].sort(([a], [b]) => b.localeCompare(a))

  return (
    <div className="year-group">
      <h2 className="year-header">{year}</h2>
      {months.map(([month, daysMap]) => {
        const days = [...daysMap.entries()].sort(([a], [b]) => b.localeCompare(a))
        return (
          <div key={month} className="month-group">
            <h3 className="month-header">{monthLabel(month)}</h3>
            <table>
              <thead>
                <tr>
                  <th className="col-account">Account</th>
                  <th className="col-category">Category</th>
                  <th className="col-amount"><span className="th-with-icon"><ArrowDownToLine size={14} aria-hidden="true" /> Money In</span></th>
                  <th className="col-amount"><span className="th-with-icon"><ArrowUpFromLine size={14} aria-hidden="true" /> Money Out</span></th>
                  <th>Comment</th>
                  <th className="col-amount">Balance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {days.map(([day, txns]) => (
                  <DayGroup key={day} date={day} txns={txns} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
