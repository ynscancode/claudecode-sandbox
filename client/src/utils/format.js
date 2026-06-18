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
