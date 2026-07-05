import client from '../db.js';
import { getBudgetableNames } from './categoryService.js';
import { ACCOUNTS } from '../constants/categories.js';

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function assertValidMonth(month) {
  if (!month || typeof month !== 'string' || !MONTH_RE.test(month)) {
    throw new ValidationError('month must be in YYYY-MM format');
  }
}

// Budgeting is Spending-only by design — a Savings category is never a
// valid budget target even if a same-named category exists on Spending's
// independent list.
async function assertValidCategory(category, userId) {
  if (!category || !(await getBudgetableNames(ACCOUNTS.SPENDING, userId)).includes(category)) {
    throw new ValidationError(`category "${category}" is not budgetable`);
  }
}

function assertValidAmount(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    throw new ValidationError('amount must be a finite number >= 0');
  }
}

export async function getBudgetsForMonth(month, userId) {
  assertValidMonth(month);

  const rows = (
    await client.execute({
      sql: 'SELECT category, amount FROM budgets WHERE month = :month AND user_id = :userId',
      args: { month, userId },
    })
  ).rows;
  const byCategory = new Map(rows.map((row) => [row.category, row.amount]));

  return (await getBudgetableNames(ACCOUNTS.SPENDING, userId)).map((category) => ({
    category,
    amount: byCategory.get(category) ?? 0,
  }));
}

export async function setBudget({ month, category, amount }, userId) {
  assertValidMonth(month);
  await assertValidCategory(category, userId);
  assertValidAmount(amount);

  await client.execute({
    sql: `
      INSERT INTO budgets (month, category, amount, user_id)
      VALUES (:month, :category, :amount, :userId)
      ON CONFLICT(user_id, month, category) DO UPDATE SET amount = excluded.amount
    `,
    args: { month, category, amount, userId },
  });

  return { month, category, amount };
}

// POST /budgets/copy-from-recent — copies every budget row from the most
// recent month STRICTLY EARLIER than targetMonth (for this user only) into
// targetMonth. targetMonth ends up EXACTLY equal to the source month (delete
// target first, then copy every source row) — it never merges with whatever
// was already in targetMonth. If no earlier month has any budget row for
// this user, nothing is modified and sourceMonth is null.
export async function copyBudgetsFromRecentMonth(targetMonth, userId) {
  assertValidMonth(targetMonth);

  const sourceRow = (
    await client.execute({
      sql: `
        SELECT month FROM budgets
        WHERE user_id = :userId AND month < :targetMonth
        ORDER BY month DESC LIMIT 1
      `,
      args: { userId, targetMonth },
    })
  ).rows[0];

  if (!sourceRow) {
    return { month: targetMonth, sourceMonth: null, budgets: await getBudgetsForMonth(targetMonth, userId) };
  }

  const sourceMonth = sourceRow.month;

  const tx = await client.transaction('write');
  try {
    await tx.execute({
      sql: 'DELETE FROM budgets WHERE user_id = :userId AND month = :targetMonth',
      args: { userId, targetMonth },
    });
    await tx.execute({
      sql: `
        INSERT INTO budgets (month, category, amount, user_id)
        SELECT :targetMonth, category, amount, :userId
        FROM budgets
        WHERE user_id = :userId AND month = :sourceMonth
      `,
      args: { userId, targetMonth, sourceMonth },
    });
    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }

  return { month: targetMonth, sourceMonth, budgets: await getBudgetsForMonth(targetMonth, userId) };
}

// GET /budgets/recent — looks up the most recent month STRICTLY EARLIER
// than `month` (for this user only) that has any budget row, without
// copying anything. Lets the client show "Copy from [Month Name]" before
// the user commits to POST /budgets/copy-from-recent.
export async function getRecentBudgetMonth(month, userId) {
  assertValidMonth(month);
  const sourceRow = (
    await client.execute({
      sql: `SELECT month FROM budgets WHERE user_id = :userId AND month < :month ORDER BY month DESC LIMIT 1`,
      args: { userId, month },
    })
  ).rows[0];
  return { month: sourceRow ? sourceRow.month : null };
}

// POST /budgets/clear — deletes every budget row for this user in `month`.
// Every category then reads back as its default 0 via getBudgetsForMonth
// (consistent with the app's "no unset concept, 0 is the default" model).
export async function clearBudgetsForMonth(month, userId) {
  assertValidMonth(month);

  await client.execute({
    sql: 'DELETE FROM budgets WHERE user_id = :userId AND month = :month',
    args: { userId, month },
  });

  return { month, budgets: await getBudgetsForMonth(month, userId) };
}

export { ValidationError };
