import { useCallback, useState } from 'react'
import { DEFAULT_DAILY_BUDGET } from '../constants/budget.js'

const STORAGE_KEY = 'ledger.dailyBudget'

// Daily budget is either a positive number or "not set" (null) — distinct
// from a budget of $0, mirroring the budgets-table convention in
// CLAUDE.md where a missing row != amount 0. Persistence is localStorage
// only (no backend, no settings model for one scalar). Missing key on
// first load defaults to DEFAULT_DAILY_BUDGET so existing behavior is
// preserved for first-time users; the user can explicitly clear it to null,
// which we persist as the literal string 'null' (a present, explicit
// sentinel) so a future visit doesn't fall back to the default again.
function readStored() {
  if (typeof localStorage === 'undefined') return DEFAULT_DAILY_BUDGET
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return DEFAULT_DAILY_BUDGET
  if (raw === 'null') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_DAILY_BUDGET
}

// Returns [dailyBudget, setDailyBudget] where dailyBudget is number | null.
// State is initialized lazily from localStorage (no mount effect needed),
// and every set call writes through to localStorage immediately.
export function useDailyBudget() {
  const [dailyBudget, setDailyBudgetState] = useState(readStored)

  const setDailyBudget = useCallback((value) => {
    setDailyBudgetState(value)
    if (typeof localStorage === 'undefined') return
    if (value === null) {
      localStorage.setItem(STORAGE_KEY, 'null')
    } else {
      localStorage.setItem(STORAGE_KEY, String(value))
    }
  }, [])

  return [dailyBudget, setDailyBudget]
}
