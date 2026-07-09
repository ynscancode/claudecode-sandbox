// Shared presentational helpers for budget-health classification
// ('under' / 'near' / 'over'), used by both the Budget page's editing list
// and the Overview Budget card's comparison list so the two stay visually
// consistent.

// Canonical under/near/over classifier, from the raw (unrounded)
// actual/budget percentage. Both BudgetPage and DashboardPage use this so
// they agree at boundary bands (e.g. a raw 100.3% is 'over' on both, not
// 'over' on one and 'near' on the other due to a rounding difference).
export function classifyBudgetHealth(actual, budget) {
  if (budget === 0) return actual > 0 ? 'over' : 'under'
  const pct = (actual / budget) * 100
  if (pct > 100) return 'over'
  if (pct >= 90) return 'near'
  return 'under'
}

export function fillColorFor(health) {
  if (health === 'over') return 'var(--red)'
  if (health === 'near') return 'var(--warning)'
  return 'var(--green)' // under
}

// Non-color text cue for near/over, matching the highlight.js convention of
// not relying on color alone.
export function suffixFor(health) {
  if (health === 'over') return { text: ' — over', color: 'var(--red)' }
  if (health === 'near') return { text: ' — near limit', color: 'var(--warning-text)' }
  return null
}
