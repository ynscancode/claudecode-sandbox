import db from '../db.js';
import { ACCOUNTS } from '../constants/categories.js';

export function getDailySummary(date) {
  const combined = db
    .prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE 0 END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN direction = 'out' THEN amount ELSE 0 END), 0) AS total_out
      FROM transactions WHERE date = ?
    `)
    .get(date);

  const perAccount = db
    .prepare(`
      SELECT a.id AS account_id, a.name AS account_name,
        COALESCE(SUM(CASE WHEN t.direction = 'in' THEN t.amount ELSE 0 END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN t.direction = 'out' THEN t.amount ELSE 0 END), 0) AS total_out
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id AND t.date = ?
      GROUP BY a.id, a.name
    `)
    .all(date);

  const byCategoryOut = db
    .prepare(`
      SELECT category, SUM(amount) AS total
      FROM transactions
      WHERE date = ? AND direction = 'out' AND is_transfer = 0
      GROUP BY category
      ORDER BY total DESC
    `)
    .all(date);

  const byCategoryIn = db
    .prepare(`
      SELECT category, SUM(amount) AS total
      FROM transactions
      WHERE date = ? AND direction = 'in' AND is_transfer = 0
      GROUP BY category
      ORDER BY total DESC
    `)
    .all(date);

  return { date, combined, perAccount, byCategoryIn, byCategoryOut };
}

export function getMonthlySummary(month) {
  const totals = db
    .prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE 0 END), 0) AS total_in,
        COALESCE(SUM(CASE WHEN direction = 'out' THEN amount ELSE 0 END), 0) AS total_out
      FROM transactions
      WHERE strftime('%Y-%m', date) = ? AND is_transfer = 0
    `)
    .get(month);

  const byCategoryOut = db
    .prepare(`
      SELECT category, SUM(amount) AS total
      FROM transactions
      WHERE strftime('%Y-%m', date) = ? AND direction = 'out' AND is_transfer = 0
      GROUP BY category
      ORDER BY total DESC
    `)
    .all(month);

  const byCategoryIn = db
    .prepare(`
      SELECT category, SUM(amount) AS total
      FROM transactions
      WHERE strftime('%Y-%m', date) = ? AND direction = 'in' AND is_transfer = 0
      GROUP BY category
      ORDER BY total DESC
    `)
    .all(month);

  return {
    month,
    totalIn: totals.total_in,
    totalOut: totals.total_out,
    byCategoryIn,
    byCategoryOut,
  };
}

export function getTransactionActivity() {
  const rows = db
    .prepare(`
      SELECT account_id, strftime('%Y-%m', date) AS month
      FROM transactions
      GROUP BY account_id, strftime('%Y-%m', date)
      ORDER BY month
    `)
    .all();

  const byAccount = {};
  for (const id of Object.values(ACCOUNTS)) {
    byAccount[String(id)] = { months: [], earliest: null, latest: null };
  }

  const allMonths = new Set();
  for (const row of rows) {
    const key = String(row.account_id);
    if (!byAccount[key]) {
      byAccount[key] = { months: [], earliest: null, latest: null };
    }
    byAccount[key].months.push(row.month);
    allMonths.add(row.month);
  }

  for (const scope of Object.values(byAccount)) {
    scope.earliest = scope.months.length ? scope.months[0] : null;
    scope.latest = scope.months.length ? scope.months[scope.months.length - 1] : null;
  }

  const months = Array.from(allMonths).sort();

  return {
    all: {
      months,
      earliest: months.length ? months[0] : null,
      latest: months.length ? months[months.length - 1] : null,
    },
    byAccount,
  };
}
