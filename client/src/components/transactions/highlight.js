import { ACCOUNTS } from '../../constants/categories.js'

// Returns a CSS class name (or null) describing how a transaction row should be highlighted.
export function highlightClassFor(txn) {
  if (txn.is_transfer) {
    const isSavingsToSpendingLeg =
      (txn.category === 'transfer-in' && txn.account_id === ACCOUNTS.SPENDING) ||
      (txn.category === 'transfer-out' && txn.account_id === ACCOUNTS.SAVINGS)
    if (isSavingsToSpendingLeg) return 'highlight-topup'

    const isSpendingToSavingsLeg =
      (txn.category === 'transfer-out' && txn.account_id === ACCOUNTS.SPENDING) ||
      (txn.category === 'transfer-in' && txn.account_id === ACCOUNTS.SAVINGS)
    if (isSpendingToSavingsLeg) return 'highlight-transfer-out'

    return null
  }

  if (txn.direction === 'out') {
    if (txn.amount > 40) return 'highlight-red'
    if (txn.amount > 20) return 'highlight-orange'
  }

  return null
}

// Returns a short text label describing the transfer direction for a given
// highlight class, so the direction isn't conveyed by color alone (WCAG 1.4.1).
export function highlightLabelFor(highlightClass) {
  if (highlightClass === 'highlight-topup') return '↑ topup'
  if (highlightClass === 'highlight-transfer-out') return '↓ to savings'
  return null
}
