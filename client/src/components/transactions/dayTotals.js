import { ACCOUNT_NAMES } from '../../constants/categories.js'

export function computeDayTotals(txns) {
  const combined = { in: 0, out: 0 }
  const perAccount = {}
  const endOfDayBalance = {}

  for (const txn of txns) {
    combined[txn.direction] += txn.amount

    if (!perAccount[txn.account_id]) {
      perAccount[txn.account_id] = { accountId: txn.account_id, in: 0, out: 0 }
    }
    perAccount[txn.account_id][txn.direction] += txn.amount

    // txns are in chronological order, so the last one seen per account
    // holds that account's end-of-day running balance.
    endOfDayBalance[txn.account_id] = txn.running_balance
  }

  return {
    combined,
    perAccount: Object.values(perAccount).map((a) => ({
      ...a,
      name: ACCOUNT_NAMES[a.accountId],
      endOfDayBalance: endOfDayBalance[a.accountId],
    })),
  }
}
