// QA verification script for the pure `describeMonthActivity` helper backing
// MonthSwitcher's activity indicator (see TEAM-BOARD.md, month-navigation
// activity indicator feature). Plain node, assert-and-log, matches the
// existing server/src/scripts/*Test.js style (see importMappingTest.js).
//
// Imports the CLIENT's pure ESM helper directly via an absolute file:// URL
// (no React/DOM dependency, so this works from a node process with no
// bundler) — avoids needing to duplicate logic.
//
// Run with: node src/scripts/monthActivityTest.js   (from server/)
// No network access, no live server, no DB required.

import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]):/, '$1:'));
const clientSrc = path.resolve(here, '../../../client/src');

const { describeMonthActivity } = await import(
  pathToFileURL(path.join(clientSrc, 'utils/monthActivity.js')).href
);

let passCount = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  passCount++;
  console.log(`  ok: ${msg}`);
}

const RANGE_ACTIVITY = {
  months: ['2025-01', '2025-02', '2025-04'],
  earliest: '2025-01',
  latest: '2025-04',
};

const ZERO_HISTORY = { months: [], earliest: null, latest: null };

console.log('A. Occupied month (in months[], within range) — AC1');
{
  const r = describeMonthActivity('2025-01', RANGE_ACTIVITY);
  ok(r.occupied === true, 'occupied is true for a month present in months[]');
  ok(r.dotFilled === true, 'dotFilled is true (filled dot) for occupied month');
  ok(r.caption === null, 'caption is null (silence = normal) for occupied month');
  ok(r.hasHistory === true, 'hasHistory true when earliest is non-null');
}
console.log('A2. Occupied month, not the first/last (mid-range) — AC1');
{
  const r = describeMonthActivity('2025-04', RANGE_ACTIVITY);
  ok(r.occupied === true, 'latest occupied month (2025-04) reads occupied');
  ok(r.caption === null, 'latest occupied month has no caption');
}

console.log('B. Empty-within-range month (gap in history) — AC2');
{
  const r = describeMonthActivity('2025-03', RANGE_ACTIVITY);
  ok(r.occupied === false, 'occupied is false for a gap month not in months[]');
  ok(r.dotFilled === false, 'dotFilled is false (hollow dot) for gap month');
  ok(r.caption === 'No transactions this month.', 'caption reads the generic empty-month text for a gap');
  ok(r.hasHistory === true, 'hasHistory stays true (history exists elsewhere)');
}

console.log('C. Before-earliest boundary month — AC6');
{
  const r = describeMonthActivity('2024-12', RANGE_ACTIVITY);
  ok(r.occupied === false, 'before-earliest month is not occupied');
  ok(r.dotFilled === false, 'before-earliest month renders hollow dot');
  ok(r.caption === 'Before your transaction history.', 'caption reads before-history text, not the generic empty text');
}
console.log('C2. Exactly on earliest boundary is occupied, not "before" — off-by-one check');
{
  const r = describeMonthActivity('2025-01', RANGE_ACTIVITY);
  ok(r.caption === null, 'month === earliest is occupied/silent, not treated as before-history (no off-by-one)');
}

console.log('D. After-latest boundary month — AC6');
{
  const r = describeMonthActivity('2025-05', RANGE_ACTIVITY);
  ok(r.occupied === false, 'after-latest month is not occupied');
  ok(r.dotFilled === false, 'after-latest month renders hollow dot');
  ok(r.caption === 'No transactions yet this month.', 'caption reads after-history text, not the generic empty text');
}
console.log('D2. Exactly on latest boundary is occupied, not "after" — off-by-one check');
{
  const r = describeMonthActivity('2025-04', RANGE_ACTIVITY);
  ok(r.caption === null, 'month === latest is occupied/silent, not treated as after-history (no off-by-one)');
}

console.log('E. Zero-history (no transactions at all) — AC5');
{
  const r = describeMonthActivity('2025-06', ZERO_HISTORY);
  ok(r.hasHistory === false, 'hasHistory is false when earliest is null (zero-history dataset)');
  ok(r.occupied === false, 'occupied is false with zero history');
  ok(r.dotFilled === false, 'dotFilled is false (hollow) with zero history');
  ok(r.caption === null, 'caption is null in zero-history state (MonthSwitcher shows "No transaction history yet" in the hint slot instead, not the caption)');
}

console.log('F. Defensive: null/undefined activity arg does not throw');
{
  const r = describeMonthActivity('2025-06', null);
  ok(r.hasHistory === false, 'null activity treated as zero-history');
  ok(r.occupied === false, 'null activity treated as not occupied');
  ok(r.caption === null, 'null activity produces null caption, no throw');

  const r2 = describeMonthActivity('2025-06', undefined);
  ok(r2.hasHistory === false, 'undefined activity treated as zero-history, no throw');
}

console.log('G. String comparison sanity — cross-year boundary (YYYY-MM lexicographic ordering)');
{
  const yearBoundary = { months: ['2024-11', '2024-12', '2025-01'], earliest: '2024-11', latest: '2025-01' };
  const before = describeMonthActivity('2024-10', yearBoundary);
  ok(before.caption === 'Before your transaction history.', '2024-10 correctly reads before 2024-11 earliest across a year boundary');
  const occupied = describeMonthActivity('2025-01', yearBoundary);
  ok(occupied.caption === null, '2025-01 (new year) correctly reads as occupied/latest, not after-history');
  const after = describeMonthActivity('2025-02', yearBoundary);
  ok(after.caption === 'No transactions yet this month.', '2025-02 correctly reads after 2025-01 latest across a year boundary');
}

console.log(`\nAll ${passCount} assertions passed.`);
