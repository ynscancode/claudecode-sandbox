import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import CategoryPieChart from '../components/breakdown/CategoryPieChart.jsx'
import BreakdownControls from '../components/breakdown/BreakdownControls.jsx'
import { currentMonthStr, monthLabel } from '../utils/dateUtils.js'

export default function BreakdownPage() {
  const [month, setMonth] = useState(currentMonthStr())
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCash, setShowCash] = useState(true)
  const [showPercent, setShowPercent] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.getMonthlySummary(month).then((data) => {
      setSummary(data)
      setLoading(false)
    })
  }, [month])

  function mode() {
    if (showCash && showPercent) return 'both'
    if (showPercent) return 'percent'
    return 'cash'
  }

  function toggleCash() {
    // at least one of cash/percent must stay checked
    if (showCash && !showPercent) return
    setShowCash((v) => !v)
  }

  function togglePercent() {
    if (showPercent && !showCash) return
    setShowPercent((v) => !v)
  }

  return (
    <div>
      <h1 className="page-title">Monthly Breakdown</h1>

      <div className="card filter-bar">
        <label className="field">
          Month
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
      </div>

      <BreakdownControls
        showCash={showCash}
        showPercent={showPercent}
        onToggleCash={toggleCash}
        onTogglePercent={togglePercent}
      />

      {loading || !summary ? <div className="loading-placeholder"><p>Loading...</p></div> : (
        <div className="pies-compare">
          <CategoryPieChart title={`Money out - ${monthLabel(month)}`} data={summary.byCategoryOut} mode={mode()} />
          <CategoryPieChart title={`Money in - ${monthLabel(month)}`} data={summary.byCategoryIn} mode={mode()} />
        </div>
      )}
    </div>
  )
}
