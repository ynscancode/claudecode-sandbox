import { dayLabel } from './dateUtils.js'

// Derives the "Daily insights" panel stats from a flat list of this month's
// transactions (real spend only — transfers excluded) plus the current day
// number and days-in-month. All computation is client-side; no new backend
// endpoint needed since /transactions already gives us everything required.
export function computeDailyInsights(monthTransactions, { todayDate, dailyBudget }) {
  const todayDay = Number(todayDate.slice(8, 10))

  const realOut = monthTransactions.filter((t) => t.direction === 'out' && !t.is_transfer)

  const byDay = {}
  for (const t of realOut) {
    const day = Number(t.date.slice(8, 10))
    byDay[day] = (byDay[day] || 0) + t.amount
  }

  const activeDays = Object.keys(byDay).map(Number)
  const elapsedDays = Math.max(todayDay, 1)
  const totalSpend = realOut.reduce((sum, t) => sum + t.amount, 0)

  const spentToday = byDay[todayDay] || 0
  const dailyAverage = totalSpend / elapsedDays

  let busiestDay = activeDays[0] ?? todayDay
  for (const d of activeDays) {
    if ((byDay[d] || 0) > (byDay[busiestDay] || 0)) busiestDay = d
  }
  const busiestDayAmount = byDay[busiestDay] || 0

  const projectedMonth = dailyAverage * 30

  const daysConsidered = activeDays.length || 1
  const daysOnBudget = activeDays.filter((d) => (byDay[d] || 0) <= dailyBudget).length

  const monthPrefix = monthTransactions[0]?.date.slice(0, 7) ?? todayDate.slice(0, 7)
  const busiestDayLabel = activeDays.length
    ? dayLabel(`${monthPrefix}-${String(busiestDay).padStart(2, '0')}`)
    : '—'

  const todayOver = spentToday > dailyBudget
  const avgOver = dailyAverage > dailyBudget

  return {
    spentToday,
    spentTodayOver: todayOver,
    spentTodayNote: todayOver
      ? `over budget by`
      : `left of budget`,
    spentTodayNoteAmount: todayOver ? spentToday - dailyBudget : dailyBudget - spentToday,
    dailyAverage,
    dailyAverageOver: avgOver,
    dailyAveragePct: dailyBudget > 0
      ? Math.round(Math.abs((dailyAverage / dailyBudget - 1)) * 100)
      : 0,
    busiestDay,
    busiestDayAmount,
    busiestDayLabel,
    projectedMonth,
    daysOnBudget,
    daysConsidered,
  }
}
