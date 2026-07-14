import { createContext, useContext } from 'react'

export const ThresholdsContext = createContext(null)

export function useThresholds() {
  const ctx = useContext(ThresholdsContext)
  if (!ctx) throw new Error('useThresholds must be used within a ThresholdsProvider')
  return ctx
}
