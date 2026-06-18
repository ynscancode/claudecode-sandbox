import { ArrowDownToLine, ArrowUpFromLine, Scale } from 'lucide-react'
import { monthLabel } from '../../utils/dateUtils.js'
import { formatCurrency, formatInflow, formatOutflow } from '../../utils/format.js'

export default function MonthlySummaryCard({ summary }) {
  if (!summary) return null
  const net = summary.totalIn - summary.totalOut
  return (
    <div className="card">
      <div className="stat-label">{monthLabel(summary.month)}</div>
      <div className="card-grid" style={{ marginTop: 8, marginBottom: 0 }}>
        <div>
          <div className="stat-label"><ArrowDownToLine size={14} aria-hidden="true" /> In</div>
          <div className="stat-value in">{formatInflow(summary.totalIn)}</div>
        </div>
        <div>
          <div className="stat-label"><ArrowUpFromLine size={14} aria-hidden="true" /> Out</div>
          <div className="stat-value out">{formatOutflow(summary.totalOut)}</div>
        </div>
        <div>
          <div className="stat-label"><Scale size={14} aria-hidden="true" /> Net</div>
          <div className={`stat-value ${net >= 0 ? 'in' : 'out'}`}>
            {formatCurrency(net)}
          </div>
        </div>
      </div>
    </div>
  )
}
