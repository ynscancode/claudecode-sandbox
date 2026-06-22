import XLSX from 'xlsx';
import db from '../db.js';
import { createTransaction, createTransfer } from './transactionService.js';
import { createCategory, getOutgoingNames, getIncomingNames } from './categoryService.js';

// Per-file ValidationError class — matches the codebase pattern of not
// deduping error classes across service files (see transactionService.js,
// categoryService.js).
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// Ceiling on DATA rows (header excluded) for a single import file. Chosen as
// a generous ceiling for this app's single-user/single-SQLite-file profile —
// see dba's note on the team board for the sizing rationale.
const MAX_IMPORT_ROWS = 20000;

// Parses a CSV or .xlsx file buffer into a generic, rectangular string grid.
// One code path for both formats (SheetJS auto-detects); no extension
// branching. cellDates+dateNF normalize true Excel-date-serial cells to ISO
// strings; raw:false guarantees every other cell is a formatted string too,
// so the grid is uniformly string[][] regardless of source format.
export function parseFile(buffer) {
  let workbook;
  try {
    // dateNF must be passed here too, not only to sheet_to_json below: when
    // SheetJS's CSV reader auto-detects a date-shaped text cell (cellDates:
    // true), it caches a formatted string on the cell at READ time using
    // whatever dateNF was in effect then. Passing dateNF only to
    // sheet_to_json (as the original contract specified) is too late — the
    // cache is already populated with SheetJS's own default short-date
    // format (e.g. '6/5/26'), silently mangling the ISO date a CSV exporter
    // actually wrote. Passing the same dateNF at read time makes the cache
    // itself ISO, which sheet_to_json then returns verbatim. Verified this
    // doesn't change true xlsx date-serial cell handling (still formats to
    // ISO either way) — see team board note to tech-lead.
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, dateNF: 'yyyy-mm-dd' });
  } catch (err) {
    throw new ValidationError('Unable to read file: not a valid CSV or Excel file');
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new ValidationError('File has no readable sheet');
  }
  const sheet = workbook.Sheets[firstSheetName];

  const grid = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    dateNF: 'yyyy-mm-dd',
    defval: '',
  });

  if (grid.length === 0) {
    throw new ValidationError('File has no columns/rows');
  }

  const headers = grid[0].map((h) => String(h));
  if (headers.length === 0) {
    throw new ValidationError('File has no columns');
  }

  const dataRows = grid.slice(1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    throw new ValidationError(
      `File has ${dataRows.length} data rows, which exceeds the ${MAX_IMPORT_ROWS}-row import limit`
    );
  }

  // Rectangularize: pad/truncate every row to headers.length so rows[i][j]
  // is always a defined string for the client.
  const rows = dataRows.map((row) => {
    const out = new Array(headers.length);
    for (let i = 0; i < headers.length; i += 1) {
      out[i] = row[i] != null ? String(row[i]) : '';
    }
    return out;
  });

  return { headers, rows };
}

function assertCategoryDraftShape(draft) {
  const { name, list, account_id } = draft;
  if (!name || !list || account_id == null) {
    throw new ValidationError('categoriesToCreate entries require name, list, and account_id');
  }
  if (!['outgoing', 'incoming'].includes(list)) {
    throw new ValidationError('categoriesToCreate list must be "outgoing" or "incoming"');
  }
}

// Commits a fully-resolved import batch: creates any missing categories
// (skip-if-exists, case-insensitive, scoped per account+list — mirrors
// createCategory's own dup-check scope), then inserts each transaction draft
// via the existing transactionService entry points. One outer
// db.transaction() (define-then-invoke, mirrors createTransfer) so any
// ValidationError anywhere in the batch rolls back everything that ran
// before it — nothing is written until the whole batch succeeds.
export function commitImport({ categoriesToCreate = [], transactions = [] } = {}) {
  if (!Array.isArray(categoriesToCreate) || !Array.isArray(transactions)) {
    throw new ValidationError('categoriesToCreate and transactions must be arrays');
  }

  const txn = db.transaction(() => {
    let created = 0;
    let transfersLinked = 0;
    let categoriesCreated = 0;

    for (const draft of categoriesToCreate) {
      assertCategoryDraftShape(draft);
      const { name, list, account_id } = draft;
      const existingNames = list === 'outgoing'
        ? getOutgoingNames(account_id)
        : getIncomingNames(account_id);
      const alreadyExists = existingNames.some(
        (existing) => existing.toLowerCase() === String(name).trim().toLowerCase()
      );
      if (alreadyExists) {
        continue; // benign race: an earlier-in-batch create (or a pre-existing
        // category) already covers this name — skip rather than let
        // createCategory throw and abort the whole commit.
      }
      createCategory({ name, list, account_id });
      categoriesCreated += 1;
    }

    for (const draft of transactions) {
      if (!draft || typeof draft !== 'object') {
        throw new ValidationError('each transaction draft must be an object');
      }
      if (draft.type === 'normal') {
        createTransaction({
          date: draft.date,
          account_id: draft.account_id,
          direction: draft.direction,
          category: draft.category,
          amount: draft.amount,
          comment: draft.comment,
        });
        created += 1;
      } else if (draft.type === 'transfer') {
        createTransfer({
          date: draft.date,
          from_account_id: draft.from_account_id,
          to_account_id: draft.to_account_id,
          amount: draft.amount,
          comment: draft.comment,
        });
        transfersLinked += 1;
      } else {
        throw new ValidationError(`unknown transaction draft type "${draft && draft.type}"`);
      }
    }

    return { created, transfersLinked, categoriesCreated };
  });

  return txn();
}

export { ValidationError, MAX_IMPORT_ROWS };
