// Accounting-style currency formatting: negative values in parentheses, no minus sign.
export function formatCurrency(value) {
  const abs = Math.abs(value).toFixed(2)
  return value < 0 ? `($${abs})` : `$${abs}`
}

// For sums that represent an inflow (always >= 0).
export function formatInflow(value) {
  return `$${value.toFixed(2)}`
}

// For sums that represent an outflow (always >= 0, shown in accounting parens).
export function formatOutflow(value) {
  return `($${value.toFixed(2)})`
}

// Signed format used for deltas and recent-activity amounts: "+$12.34" / "−$12.34".
export function formatSigned(value) {
  const abs = Math.abs(value).toFixed(2)
  return (value < 0 ? '−$' : '+$') + abs
}
