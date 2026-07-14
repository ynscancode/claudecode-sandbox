import { useCallback, useMemo, useState } from 'react'
import { ThresholdsContext } from './thresholds.js'

const STORAGE_KEY = 'ledger.thresholds'
const DEFAULT_THRESHOLDS = { orange: 20, red: 40 }

// Spend-signal thresholds (orange/red dot on the transactions list) are
// shared between the legend editor (TransactionsPage) and the row renderer
// (TransactionRow, via highlightClassFor) so editing one live-recolors the
// other — hence a context rather than two independent useState hooks.
// Persistence mirrors useDailyBudget.js: localStorage only, read lazily on
// first render, write-through on every update. Malformed/missing storage
// falls back to the default { orange: 20, red: 40 }.
function readStored() {
  if (typeof localStorage === 'undefined') return DEFAULT_THRESHOLDS
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return DEFAULT_THRESHOLDS
  try {
    const parsed = JSON.parse(raw)
    const orange = Number(parsed?.orange)
    const red = Number(parsed?.red)
    if (Number.isFinite(orange) && Number.isFinite(red) && orange > 0 && red > 0 && orange < red) {
      return { orange, red }
    }
    return DEFAULT_THRESHOLDS
  } catch {
    return DEFAULT_THRESHOLDS
  }
}

export function ThresholdsProvider({ children }) {
  const [thresholds, setThresholdsState] = useState(readStored)

  const setThresholds = useCallback((next) => {
    setThresholdsState(next)
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const value = useMemo(() => ({ thresholds, setThresholds }), [thresholds, setThresholds])

  return <ThresholdsContext.Provider value={value}>{children}</ThresholdsContext.Provider>
}
