import db from '../db.js';

const runningBalanceSql = `
  SELECT t.*,
    SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END)
      OVER (PARTITION BY account_id ORDER BY date, id) AS running_balance
  FROM transactions t
`;

export function listTransactionsWithBalance({ from, to, accountId } = {}) {
  const clauses = [];
  const params = {};

  if (from) {
    clauses.push('date >= @from');
    params.from = from;
  }
  if (to) {
    clauses.push('date <= @to');
    params.to = to;
  }
  if (accountId) {
    clauses.push('account_id = @accountId');
    params.accountId = accountId;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM (${runningBalanceSql}) ${where} ORDER BY date, id`;
  return db.prepare(sql).all(params);
}

export function getAccountBalances() {
  const accounts = db.prepare('SELECT * FROM accounts').all();
  return accounts.map((account) => {
    const row = db
      .prepare(
        `SELECT SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END) AS balance
         FROM transactions WHERE account_id = ?`
      )
      .get(account.id);
    return { ...account, balance: row.balance ?? 0 };
  });
}
