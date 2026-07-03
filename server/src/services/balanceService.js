import client from '../db.js';

const runningBalanceSql = `
  SELECT t.*,
    SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END)
      OVER (PARTITION BY account_id ORDER BY date, id) AS running_balance
  FROM transactions t
`;

export async function listTransactionsWithBalance({ from, to, accountId } = {}) {
  const clauses = [];
  const params = {};

  if (from) {
    clauses.push('date >= :from');
    params.from = from;
  }
  if (to) {
    clauses.push('date <= :to');
    params.to = to;
  }
  if (accountId) {
    clauses.push('account_id = :accountId');
    params.accountId = accountId;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM (${runningBalanceSql}) ${where} ORDER BY date, id`;
  const result = await client.execute({ sql, args: params });
  return result.rows;
}

export async function getAccountBalances() {
  const accounts = (await client.execute('SELECT * FROM accounts')).rows;
  const balances = [];
  for (const account of accounts) {
    const row = (
      await client.execute({
        sql: `SELECT SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END) AS balance
              FROM transactions WHERE account_id = :accountId`,
        args: { accountId: account.id },
      })
    ).rows[0];
    balances.push({ ...account, balance: row.balance ?? 0 });
  }
  return balances;
}
