import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { formatInflow, formatOutflow } from '../../utils/format.js'

export default function DailySummaryCard({ summary }) {
  if (!summary) return null
  return (
    <div className="card">
      <div className="stat-label">Today ({summary.date})</div>
      <div className="card-grid" style={{ marginTop: 8, marginBottom: 0 }}>
        <div>
          <div className="stat-label"><ArrowDownToLine size={14} aria-hidden="true" /> In</div>
          <div className="stat-value in">{formatInflow(summary.combined.total_in)}</div>
        </div>
        <div>
          <div className="stat-label"><ArrowUpFromLine size={14} aria-hidden="true" /> Out</div>
          <div className="stat-value out">{formatOutflow(summary.combined.total_out)}</div>
        </div>
      </div>
    </div>
  )
}
