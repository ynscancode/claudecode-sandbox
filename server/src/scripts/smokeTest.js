const BASE = 'http://localhost:4000/api';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`  ok: ${msg}`);
}

async function main() {
  console.log('1. Accounts before any transactions');
  const accountsBefore = await req('GET', '/accounts');
  console.log(accountsBefore);

  console.log('2. Create normal "out" transaction (food, $15)');
  const t1 = await req('POST', '/transactions', {
    date: '2026-06-01', account_id: 1, direction: 'out', category: 'food', amount: 15, comment: 'lunch',
  });
  assert(t1.amount === 15, 't1 amount is 15');

  console.log('3. Create transfer Savings -> Spending ($50)');
  const transfer1 = await req('POST', '/transactions/transfer', {
    date: '2026-06-01', from_account_id: 2, to_account_id: 1, amount: 50,
  });
  assert(transfer1.inRow.comment === 'topup spending from savings', 'topup comment auto-filled');
  assert(transfer1.outRow.account_id === 2, 'out leg on savings');
  assert(transfer1.inRow.account_id === 1, 'in leg on spending');

  console.log('4. Create transfer Spending -> Savings ($30)');
  const transfer2 = await req('POST', '/transactions/transfer', {
    date: '2026-06-01', from_account_id: 1, to_account_id: 2, amount: 30,
  });
  assert(transfer2.outRow.comment === 'transfer to savings', 'transfer-to-savings default comment');

  console.log('5. List transactions with running balance');
  const txns = await req('GET', '/transactions');
  console.log(txns);
  const spendingTxns = txns.filter((t) => t.account_id === 1);
  const lastSpending = spendingTxns[spendingTxns.length - 1];
  // -15 (food) +50 (topup) -30 (transfer out) = 5
  assert(lastSpending.running_balance === 5, `spending running balance is 5 (got ${lastSpending.running_balance})`);

  console.log('6. Account balances after transactions');
  const accountsAfter = await req('GET', '/accounts');
  console.log(accountsAfter);
  const spending = accountsAfter.find((a) => a.id === 1);
  const savings = accountsAfter.find((a) => a.id === 2);
  assert(spending.balance === 5, `spending balance is 5 (got ${spending.balance})`);
  assert(savings.balance === -20, `savings balance is -20 (got ${savings.balance})`);

  console.log('7. Daily summary for 2026-06-01');
  const daily = await req('GET', '/summary/daily?date=2026-06-01');
  console.log(daily);
  // Daily summary includes transfer legs (real money movement between accounts);
  // only the monthly category breakdown excludes transfers.
  assert(daily.combined.total_in === 80, `combined total_in is 80 (got ${daily.combined.total_in})`);
  assert(daily.combined.total_out === 95, `combined total_out is 95 (got ${daily.combined.total_out})`);

  console.log('8. Monthly summary for 2026-06');
  const monthly = await req('GET', '/summary/monthly?month=2026-06');
  console.log(monthly);
  assert(monthly.totalOut === 15, `monthly totalOut excludes transfers, is 15 (got ${monthly.totalOut})`);
  const foodCat = monthly.byCategoryOut.find((c) => c.category === 'food');
  assert(foodCat && foodCat.total === 15, 'food category total is 15');
  const hasTransferCat = monthly.byCategoryOut.some((c) => c.category === 'transfer-out');
  assert(!hasTransferCat, 'transfer-out excluded from monthly breakdown');

  console.log('9. Edit transfer1 amount, confirm both legs updated');
  await req('PUT', `/transactions/${transfer1.outRow.id}`, { amount: 60 });
  const txnsAfterEdit = await req('GET', '/transactions');
  const editedOut = txnsAfterEdit.find((t) => t.id === transfer1.outRow.id);
  const editedIn = txnsAfterEdit.find((t) => t.id === transfer1.inRow.id);
  assert(editedOut.amount === 60 && editedIn.amount === 60, 'both transfer legs updated to amount 60');

  console.log('10. Delete transfer2, confirm both legs removed');
  await req('DELETE', `/transactions/${transfer2.outRow.id}`);
  const txnsAfterDelete = await req('GET', '/transactions');
  const stillExists = txnsAfterDelete.some(
    (t) => t.id === transfer2.outRow.id || t.id === transfer2.inRow.id
  );
  assert(!stillExists, 'both transfer2 legs deleted');

  console.log('\nALL SMOKE TESTS PASSED');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
