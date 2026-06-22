// Pulled out of Step3Values.jsx (a component file) so react-refresh's
// "only export components" rule is satisfied — these are plain helpers, not
// components, and Step3Values.jsx imports them.
import { bestMatch } from '../../utils/fuzzyMatch.js'
import { ACCOUNTS } from '../../constants/categories.js'

// Builds the initial categoryMapping (Map<rawString, {name, list, isNew}>)
// using fuzzy-match prefill against the account's existing categories.
export function buildInitialCategoryMapping(rawCategories, candidateNames) {
  const map = new Map()
  for (const raw of rawCategories) {
    const { candidate, score } = bestMatch(raw, candidateNames)
    if (candidate && score >= 0.5) {
      map.set(raw, { name: candidate, list: 'outgoing', isNew: false })
    } else {
      map.set(raw, { name: raw, list: 'outgoing', isNew: true })
    }
  }
  return map
}

export function buildInitialAccountMapping(rawAccounts) {
  const map = new Map()
  for (const raw of rawAccounts) {
    const lower = raw.toLowerCase()
    if (lower.includes('saving')) map.set(raw, ACCOUNTS.SAVINGS)
    else map.set(raw, ACCOUNTS.SPENDING)
  }
  return map
}
