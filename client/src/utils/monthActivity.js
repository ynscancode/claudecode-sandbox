// Pure helper backing MonthSwitcher's activity indicator (dot + caption).
// Kept side-effect-free and outside the component so QA can unit-test the
// caption matrix (AC1/AC2/AC5/AC6) without rendering anything.
//
// `activity` is the already scope-resolved shape from
// TransactionActivityContext: { months: string[], earliest: string|null, latest: string|null }.
// 'YYYY-MM' strings compare correctly with plain string operators, so no
// date parsing is needed here.
export function describeMonthActivity(month, activity) {
  const months = activity?.months || []
  const earliest = activity?.earliest ?? null
  const latest = activity?.latest ?? null
  const hasHistory = earliest != null

  const occupied = months.includes(month)

  let caption = null
  if (!hasHistory) {
    caption = null
  } else if (month < earliest) {
    caption = 'Before your transaction history.'
  } else if (month > latest) {
    caption = 'No transactions yet this month.'
  } else if (!occupied) {
    caption = 'No transactions this month.'
  }

  return {
    occupied,
    dotFilled: occupied,
    caption,
    hasHistory,
  }
}
