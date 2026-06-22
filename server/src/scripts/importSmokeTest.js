// Sequential req/assert smoke test for the import feature, following the
// same style as smokeTest.js. Requires a running server on port 4000.
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

function csvFormData(csvText, filename = 'test.csv') {
  const fd = new FormData();
  const blob = new Blob([csvText], { type: 'text/csv' });
  fd.append('file', blob, filename);
  return fd;
}

async function parseMultipart(formData) {
  const res = await fetch(`${BASE}/imports/parse`, { method: 'POST', body: formData });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, data };
}

async function main() {
  console.log('1. Parse a small in-memory CSV via multipart');
  const csv = [
    'Date,Amount,Category,Comment',
    '2026-06-05,12.50,food,lunch',
    '2026-06-06,30,transport,bus pass',
  ].join('\n');
  const { status: parseStatus, data: parsed } = await parseMultipart(csvFormData(csv));
  assert(parseStatus === 200, `parse CSV returns 200 (got ${parseStatus})`);
  assert(Array.isArray(parsed.headers) && parsed.headers.length === 4, 'parsed headers has 4 columns');
  assert(Array.isArray(parsed.rows) && parsed.rows.length === 2, `parsed rows has 2 data rows (got ${parsed.rows.length})`);
  assert(parsed.rows[0][0] === '2026-06-05', `first row date is ISO string (got ${parsed.rows[0][0]})`);
  assert(typeof parsed.rows[0][1] === 'string', 'amount cell is a string, not a number');

  console.log('2. Parse with no file attached -> clean 400');
  const noFileForm = new FormData();
  const { status: noFileStatus, data: noFileData } = await parseMultipart(noFileForm);
  assert(noFileStatus === 400, `missing file rejected with 400 (got ${noFileStatus})`);
  assert(noFileData && typeof noFileData.error === 'string', 'missing file response has an error message');

  console.log('2b. Parse a header-only CSV (zero data rows) -> 200, NOT an error (per spec)');
  const headerOnlyForm = csvFormData('Date,Amount,Category,Comment\n', 'header-only.csv');
  const { status: headerOnlyStatus, data: headerOnlyData } = await parseMultipart(headerOnlyForm);
  assert(headerOnlyStatus === 200, `header-only CSV returns 200 (got ${headerOnlyStatus})`);
  assert(Array.isArray(headerOnlyData.rows) && headerOnlyData.rows.length === 0, 'header-only CSV yields zero data rows, not an error');

  console.log('2c. Parse a corrupt .xlsx (zip magic bytes, garbage body) -> clean 400 (not a 500/crash)');
  // SheetJS's CSV path is maximally lenient (arbitrary bytes parse as a
  // single-column "header" rather than throwing), so a true unreadable-file
  // case needs content that looks like an xlsx (zip magic header `PK\x03\x04`)
  // but fails to unzip/parse as a workbook.
  const corruptXlsx = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04]), // 'PK\x03\x04' zip magic
    Buffer.from('not a real zip body, corrupt on purpose'.repeat(5)),
  ]);
  const garbageForm = new FormData();
  garbageForm.append('file', new Blob([corruptXlsx]), 'corrupt.xlsx');
  const { status: garbageStatus, data: garbageData } = await parseMultipart(garbageForm);
  assert(garbageStatus === 400, `unreadable/corrupt xlsx rejected with 400 (got ${garbageStatus})`);
  assert(garbageData && typeof garbageData.error === 'string', 'unreadable file response has an error message');

  console.log('3. Baseline transaction count before commit tests');
  const txnsBefore = await req('GET', '/transactions');
  const countBefore = txnsBefore.length;

  console.log('4. Commit a normal transaction + a brand-new category');
  const newCategoryName = `Import Smoke ${Date.now()}`;
  const commit1 = await req('POST', '/imports/commit', {
    categoriesToCreate: [
      { name: newCategoryName, list: 'outgoing', account_id: 1 },
    ],
    transactions: [
      {
        type: 'normal',
        date: '2026-06-07',
        account_id: 1,
        direction: 'out',
        category: newCategoryName,
        amount: 9.99,
        comment: 'import smoke test row',
      },
    ],
  });
  assert(commit1.created === 1, `commit1 created 1 transaction (got ${commit1.created})`);
  assert(commit1.transfersLinked === 0, 'commit1 linked 0 transfer pairs');
  assert(commit1.categoriesCreated === 1, `commit1 created 1 category (got ${commit1.categoriesCreated})`);

  const categoriesAfter1 = await req('GET', '/categories?account_id=1');
  const createdCat = categoriesAfter1.outgoing.find((c) => c.name === newCategoryName);
  assert(Boolean(createdCat), 'new category now present in GET /categories');

  console.log('5. Commit again referencing the SAME category name -> no abort, categoriesCreated=0 (skip-if-exists)');
  const commit2 = await req('POST', '/imports/commit', {
    categoriesToCreate: [
      { name: newCategoryName.toLowerCase(), list: 'outgoing', account_id: 1 }, // case-insensitive match
    ],
    transactions: [
      {
        type: 'normal',
        date: '2026-06-08',
        account_id: 1,
        direction: 'out',
        category: newCategoryName,
        amount: 4.5,
        comment: 'second row, same category',
      },
    ],
  });
  assert(commit2.created === 1, `commit2 created 1 transaction (got ${commit2.created})`);
  assert(commit2.categoriesCreated === 0, `commit2 skip-if-exists: 0 categories created (got ${commit2.categoriesCreated})`);

  console.log('6. Commit a transfer-pair draft -> exactly 2 linked rows matching createTransfer shape');
  const beforeTransferCount = (await req('GET', '/transactions')).length;
  const transferComment = `import smoke transfer ${Date.now()}`;
  const commit3 = await req('POST', '/imports/commit', {
    categoriesToCreate: [],
    transactions: [
      {
        type: 'transfer',
        date: '2026-06-09',
        from_account_id: 2,
        to_account_id: 1,
        amount: 25,
        comment: transferComment,
      },
    ],
  });
  assert(commit3.created === 0, 'commit3 created 0 normal transactions');
  assert(commit3.transfersLinked === 1, `commit3 linked 1 transfer pair (got ${commit3.transfersLinked})`);
  const afterTransferTxns = await req('GET', '/transactions');
  assert(afterTransferTxns.length === beforeTransferCount + 2, 'transfer commit added exactly 2 rows');
  const transferLegs = afterTransferTxns.filter(
    (t) => t.is_transfer && t.comment === transferComment
  );
  assert(transferLegs.length === 2, `exactly 2 transfer legs found (got ${transferLegs.length})`);
  const outLeg = transferLegs.find((t) => t.direction === 'out');
  const inLeg = transferLegs.find((t) => t.direction === 'in');
  assert(Boolean(outLeg) && Boolean(inLeg), 'one out leg and one in leg present');
  assert(outLeg.account_id === 2 && inLeg.account_id === 1, 'out leg on Savings, in leg on Spending');
  assert(
    outLeg.linked_transaction_id === inLeg.id && inLeg.linked_transaction_id === outLeg.id,
    'legs are mutually linked via linked_transaction_id'
  );
  assert(outLeg.category === 'transfer-out' && inLeg.category === 'transfer-in', 'legs carry system transfer categories');

  console.log('7. Commit a batch with one invalid row mixed in -> entire batch rolls back');
  const countBeforeRollbackTest = (await req('GET', '/transactions')).length;
  let rollbackCommitFailed = false;
  try {
    await req('POST', '/imports/commit', {
      categoriesToCreate: [],
      transactions: [
        {
          type: 'normal',
          date: '2026-06-10',
          account_id: 1,
          direction: 'out',
          category: newCategoryName,
          amount: 1, // valid row, would normally insert fine
          comment: 'valid row before the bad one',
        },
        {
          type: 'normal',
          date: '2026-06-10',
          account_id: 1,
          direction: 'out',
          category: 'this-category-does-not-exist',
          amount: 1,
          comment: 'invalid category, should abort the whole batch',
        },
      ],
    });
  } catch (err) {
    rollbackCommitFailed = /400/.test(err.message);
  }
  assert(rollbackCommitFailed, 'commit with an invalid row failed with 400');
  const countAfterRollbackTest = (await req('GET', '/transactions')).length;
  assert(
    countAfterRollbackTest === countBeforeRollbackTest,
    `transaction count unchanged after rolled-back commit (before=${countBeforeRollbackTest}, after=${countAfterRollbackTest})`
  );

  console.log('\nALL IMPORT SMOKE TESTS PASSED');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
