// Returns a CSS class name (or null) describing how a transaction row should be highlighted.
// Transfer legs all get the same neutral row treatment (direction is conveyed by the
// IN/OUT badge instead, see transferBadgeFor); only non-transfer spend amounts use this
// for the orange/red warning-dot indicator. Thresholds are caller-supplied (from
// ThresholdsContext, see contexts/thresholds.js) rather than hardcoded, so the legend's
// editable pills and this dot logic always agree on the same live values.
export function highlightClassFor(txn, { orange, red } = {}) {
  if (txn.is_transfer) {
    return 'highlight-transfer'
  }

  if (txn.direction === 'out') {
    if (txn.amount > red) return 'highlight-red'
    if (txn.amount > orange) return 'highlight-orange'
  }

  return null
}

// Returns a small IN/OUT text badge for a transfer leg, colored green/red by direction
// (matches the mockup's t.transferLabel / t.labelColor). Non-color text cue for WCAG 1.4.1.
export function transferBadgeFor(txn) {
  if (!txn.is_transfer) return null
  return {
    text: txn.direction === 'in' ? 'IN' : 'OUT',
    color: txn.direction === 'in' ? 'var(--green)' : 'var(--red)',
  }
}
