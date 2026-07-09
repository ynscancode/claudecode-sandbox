import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { currentMonthStr, monthLabel } from '../utils/dateUtils.js'
import { formatCurrency } from '../utils/format.js'
import { ACCOUNTS } from '../constants/categories.js'
import { useCategories } from '../contexts/categories.js'
import MonthSwitcher from '../components/layout/MonthSwitcher.jsx'
import CategoryManagerModal from '../components/transactions/CategoryManagerModal.jsx'
import { fillColorFor, suffixFor, classifyBudgetHealth } from '../utils/budgetHealth.js'

export default function BudgetPage() {
  const { outgoingFor, colorFor } = useCategories()
  const outgoing = outgoingFor(ACCOUNTS.SPENDING)
  const [month, setMonth] = useState(currentMonthStr())
  const [summary, setSummary] = useState(null)
  const [budgetsByCategory, setBudgetsByCategory] = useState({})
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState({})
  const [savingCategory, setSavingCategory] = useState(null)
  const [rowErrors, setRowErrors] = useState({})
  const [catManagerOpen, setCatManagerOpen] = useState(false)
  const [recentMonth, setRecentMonth] = useState(null)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  async function loadAll(forMonth) {
    setLoading(true)
    const [monthly, budgetsRes, recentRes] = await Promise.all([
      api.getMonthlySummary(forMonth),
      api.getBudgets(forMonth),
      api.getRecentBudgetMonth(forMonth),
    ])
    setSummary(monthly)
    const map = {}
    budgetsRes.budgets.forEach((b) => { map[b.category] = b.amount })
    setBudgetsByCategory(map)
    setRecentMonth(recentRes.month)
    setDrafts({})
    setRowErrors({})
    setLoading(false)
  }

  async function handleCopyFromRecent() {
    if (!recentMonth || busy) return
    setBusy(true)
    setActionError(null)
    try {
      await api.copyBudgetsFromRecent(month)
      await loadAll(month)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmClear() {
    if (busy) return
    setBusy(true)
    setActionError(null)
    try {
      await api.clearBudgets(month)
      await loadAll(month)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
      setConfirmClearOpen(false)
    }
  }

  useEffect(() => {
    loadAll(month)
  }, [month])

  if (loading || !summary) {
    return <div className="loading-placeholder"><p>Loading...</p></div>
  }

  const actualsMap = {}
  summary.byCategoryOut.forEach((r) => { actualsMap[r.category] = r.total })

  const rows = outgoing.map(({ name: category }) => {
    const actual = actualsMap[category] || 0
    const budget = budgetsByCategory[category] ?? 0
    return { category, actual, budget, health: classifyBudgetHealth(actual, budget), color: colorFor(ACCOUNTS.SPENDING, category) }
  })

  const totalBudgeted = rows.reduce((sum, r) => sum + r.budget, 0)

  async function commitBudget(category, rawValue) {
    const value = rawValue.trim()
    const amount = value === '' ? 0 : Number(value)
    if (Number.isNaN(amount) || amount < 0) {
      setRowErrors((prev) => ({ ...prev, [category]: 'Enter an amount of 0 or more.' }))
      return
    }
    setSavingCategory(category)
    setRowErrors((prev) => ({ ...prev, [category]: null }))
    try {
      await api.setBudget({ month, category, amount })
      setBudgetsByCategory((prev) => ({ ...prev, [category]: amount }))
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[category]
        return next
      })
    } catch (err) {
      setRowErrors((prev) => ({ ...prev, [category]: err.message }))
    } finally {
      setSavingCategory(null)
    }
  }

  return (
    <div className="page-animate">
      <div className="page-header-row">
        <div>
          <div className="page-eyebrow">{monthLabel(month)}</div>
          <h1 className="page-title">Budget</h1>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setCatManagerOpen(true)}>Manage categories</button>
          <MonthSwitcher month={month} onChange={setMonth} />
        </div>
      </div>

      {catManagerOpen && (
        <CategoryManagerModal
          initialAccountId={ACCOUNTS.SPENDING}
          onClose={() => setCatManagerOpen(false)}
        />
      )}

      <div className="card">
        <div className="card-row">
          <h2>Category budgets</h2>
          <span style={{ color: 'var(--muted)' }}>Total budgeted {formatCurrency(totalBudgeted)}</span>
        </div>

        <div className="budget-actions-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!recentMonth || busy}
            onClick={handleCopyFromRecent}
          >
            {recentMonth ? `Copy from ${monthLabel(recentMonth)}` : 'No prior budgets'}
          </button>

          {!confirmClearOpen && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={() => setConfirmClearOpen(true)}
            >
              Clear
            </button>
          )}

          {confirmClearOpen && (
            <>
              <span style={{ color: 'var(--muted)' }}>Clear all budgets for {monthLabel(month)}?</span>
              <button
                type="button"
                className="btn btn-danger"
                disabled={busy}
                onClick={handleConfirmClear}
              >
                Confirm clear
              </button>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => setConfirmClearOpen(false)}
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {actionError && <span className="error-text" role="alert">{actionError}</span>}

        {rows.map((row) => {
          const draftValue = drafts[row.category]
          const inputValue = draftValue !== undefined ? draftValue : String(row.budget)
          const suffix = suffixFor(row.health)
          const isSaving = savingCategory === row.category
          const rowError = rowErrors[row.category]
          const inputId = `budget-input-${row.category}`

          const headValueText = `${formatCurrency(row.actual)} of ${formatCurrency(row.budget)}`

          return (
            <div className="budget-row" key={row.category}>
              <div className="budget-row-head">
                <span className="cat-bar-row-label">
                  <span className="cat-bar-row-swatch" style={{ background: row.color }} />
                  {row.category}
                </span>
                <span
                  className="cat-bar-row-value"
                  style={{ color: row.health === 'over' ? 'var(--red)' : 'var(--muted)' }}
                >
                  {headValueText}
                  {suffix && <span style={{ color: suffix.color }}>{suffix.text}</span>}
                </span>
              </div>

              <div className="budget-row-bars">
                <div className="cat-bar-track">
                  <div
                    className="cat-bar-fill"
                    style={{
                      width: `${row.budget > 0 ? Math.min(100, Math.round((row.actual / row.budget) * 100)) : (row.actual > 0 ? 100 : 0)}%`,
                      background: fillColorFor(row.health),
                    }}
                  />
                </div>
              </div>

              <div className="budget-row-input">
                <label className="visually-hidden" htmlFor={inputId}>Budget for {row.category}</label>
                <input
                  id={inputId}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={inputValue}
                  disabled={isSaving}
                  style={{ opacity: isSaving ? 0.6 : 1 }}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [row.category]: e.target.value }))}
                  onBlur={(e) => commitBudget(row.category, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitBudget(row.category, e.target.value)
                    }
                  }}
                />
              </div>
              {rowError && <span className="error-text" role="alert">{rowError}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
