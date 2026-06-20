import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { ACCOUNTS } from '../constants/categories.js'
import { CategoriesContext, FALLBACK_COLOR } from './categories.js'

const ACCOUNT_IDS = Object.values(ACCOUNTS)

export function CategoriesProvider({ children }) {
  const [byAccount, setByAccount] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(ACCOUNT_IDS.map((id) => api.getCategories(id)))
      const next = {}
      ACCOUNT_IDS.forEach((id, i) => {
        next[id] = { outgoing: results[i].outgoing || [], incoming: results[i].incoming || [] }
      })
      setByAccount(next)
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

  const outgoingFor = useCallback((accountId) => byAccount[accountId]?.outgoing || [], [byAccount])
  const incomingFor = useCallback((accountId) => byAccount[accountId]?.incoming || [], [byAccount])

  const colorFor = useCallback((accountId, name) => {
    const account = byAccount[accountId]
    const match = account?.outgoing.find((c) => c.name === name) || account?.incoming.find((c) => c.name === name)
    return match?.color || FALLBACK_COLOR
  }, [byAccount])

  const value = useMemo(
    () => ({ outgoingFor, incomingFor, colorFor, loading, error, refetch }),
    [outgoingFor, incomingFor, colorFor, loading, error, refetch]
  )

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>
}
