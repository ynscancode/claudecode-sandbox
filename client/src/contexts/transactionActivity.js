import { createContext, useContext } from 'react'

// Default/loading shape so consumers never see `undefined` before the first
// fetch resolves (mirrors CategoriesContext's defensive defaults).
export const EMPTY_ACTIVITY_SCOPE = { months: [], earliest: null, latest: null }

export const TransactionActivityContext = createContext(null)

export function useTransactionActivity() {
  const ctx = useContext(TransactionActivityContext)
  if (!ctx) throw new Error('useTransactionActivity must be used within a TransactionActivityProvider')
  return ctx
}
