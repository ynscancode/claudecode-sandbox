import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { ACCOUNTS } from '../constants/categories.js'
import { TransactionActivityContext, EMPTY_ACTIVITY_SCOPE } from './transactionActivity.js'

const ACCOUNT_IDS = Object.values(ACCOUNTS)

function emptyByAccount() {
  const next = {}
  ACCOUNT_IDS.forEach((id) => { next[id] = EMPTY_ACTIVITY_SCOPE })
  return next
}

// Shared, app-wide "which months have transactions" data, fetched once from
// GET /api/summary/activity (server/src/routes/summary.js) and consumed by
// both the Transactions page and the Overview Breakdown section so their
// MonthSwitcher indicators stay in sync from a single source. Mirrors
// CategoriesContext's provider/hook split.
export function TransactionActivityProvider({ children }) {
  const [all, setAll] = useState(EMPTY_ACTIVITY_SCOPE)
  const [byAccount, setByAccount] = useState(emptyByAccount)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getTransactionActivity()
      setAll(data.all || EMPTY_ACTIVITY_SCOPE)
      setByAccount({ ...emptyByAccount(), ...(data.byAccount || {}) })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({ all, byAccount, loading, error, refetch }),
    [all, byAccount, loading, error, refetch]
  )

  return (
    <TransactionActivityContext.Provider value={value}>
      {children}
    </TransactionActivityContext.Provider>
  )
}
