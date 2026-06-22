// Best-guess column-mapping prefill from a file's actual headers. Pure
// function so it's testable independent of the wizard's React state.
import { bestMatch } from '../../utils/fuzzyMatch.js'

const HEADER_ALIASES = {
  date: ['date', 'transaction date', 'posted date', 'posting date', 'trans date'],
  amount: ['amount', 'value', 'transaction amount', 'total'],
  debit: ['debit', 'withdrawal', 'money out', 'out', 'expense'],
  credit: ['credit', 'deposit', 'money in', 'in', 'income'],
  direction: ['direction', 'type', 'in/out', 'debit/credit'],
  category: ['category', 'cat', 'type of expense', 'tag'],
  comment: ['comment', 'note', 'notes', 'description', 'memo', 'details'],
  account: ['account', 'account name', 'wallet', 'source'],
};

function normalizeTokens(str) {
  return String(str ?? '')
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// True if aliasTokens appears as a contiguous run within headerTokens, e.g.
// header "account_id" -> ["account", "id"] contains alias "account" ->
// ["account"].
function containsTokenSequence(headerTokens, aliasTokens) {
  if (aliasTokens.length === 0 || aliasTokens.length > headerTokens.length) return false;
  for (let start = 0; start <= headerTokens.length - aliasTokens.length; start++) {
    let match = true;
    for (let k = 0; k < aliasTokens.length; k++) {
      if (headerTokens[start + k] !== aliasTokens[k]) { match = false; break; }
    }
    if (match) return true;
  }
  return false;
}

function guessOneColumn(headers, aliasKey) {
  const aliases = HEADER_ALIASES[aliasKey];
  let best = { index: null, score: 0 };
  headers.forEach((header, index) => {
    const headerTokens = normalizeTokens(header);
    // A header whose tokens contain an alias's tokens as an exact run (e.g.
    // "account_id" containing "account") is a far stronger signal than
    // edit-distance similarity, which can otherwise score an unrelated but
    // coincidentally similar-length header (e.g. "amount" vs. the "account"
    // alias) above the header that's actually the right one.
    const hasExactTokenMatch = aliases.some((alias) => containsTokenSequence(headerTokens, normalizeTokens(alias)));
    const score = hasExactTokenMatch ? 1 : bestMatch(header, aliases).score;
    if (score > best.score) best = { index, score };
  });
  // Require a high-confidence match; otherwise leave unmapped so the user
  // explicitly picks rather than silently mapping the wrong column. 0.6 was
  // too lenient: short, generic words can score deceptively high against
  // each other by pure edit distance (e.g. "account" vs. the "amount"
  // alias scores 0.71) despite being unrelated headers. 0.75 still allows
  // single-character-typo tolerance on alias-length words while rejecting
  // that kind of coincidental overlap.
  return best.score >= 0.75 ? best.index : null;
}

// Returns a best-guess columnMapping object (indexes into the header array,
// or null where no confident guess was found). amountMode defaults to
// 'single' if an amount-like column is found, otherwise 'debit-credit' if
// both debit and credit columns are found.
export function guessColumnMapping(headers) {
  const dateCol = guessOneColumn(headers, 'date');
  const amountCol = guessOneColumn(headers, 'amount');
  const debitCol = guessOneColumn(headers, 'debit');
  const creditCol = guessOneColumn(headers, 'credit');
  const directionCol = guessOneColumn(headers, 'direction');
  const categoryCol = guessOneColumn(headers, 'category');
  const commentCol = guessOneColumn(headers, 'comment');
  const accountCol = guessOneColumn(headers, 'account');

  const amountMode = amountCol == null && debitCol != null && creditCol != null ? 'debit-credit' : 'single';

  return {
    dateCol,
    dateFormat: null, // required, never guessed
    amountMode,
    amountCol: amountMode === 'single' ? amountCol : null,
    directionCol,
    debitCol: amountMode === 'debit-credit' ? debitCol : null,
    creditCol: amountMode === 'debit-credit' ? creditCol : null,
    categoryCol,
    commentCol,
    accountCol,
    fixedAccountId: null,
  };
}
