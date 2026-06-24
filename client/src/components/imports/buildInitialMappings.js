// Pulled out of Step3Values.jsx (a component file) so react-refresh's
// "only export components" rule is satisfied — these are plain helpers, not
// components, and Step3Values.jsx imports them.
import { bestMatch } from '../../utils/fuzzyMatch.js'
import { ACCOUNTS, ACCOUNT_NAMES } from '../../constants/categories.js'
import { uniqueValuesByAccount } from '../../utils/importTransforms.js'

// True when EVERY unique, non-blank raw value in a category column is a
// bare integer code (e.g. "1", "23" — no decimals, no leading +/-). Gated on
// the FULL set of raw values, not per-value (product-owner DECISION 2 #2):
// a per-value check would let a column with one stray non-numeric value get
// partially fuzzy-matched and partially forced-manual, which is more
// confusing than an all-or-nothing rule. A column mixing e.g. "3" and
// "Groceries" is NOT numeric-coded and falls through to the normal
// fuzzy-match path unchanged. Blank cells are ignored (handled separately by
// the Uncategorized fallback, not this check); a column with zero unique
// non-blank values doesn't trigger this path either (nothing to map).
export function isNumericCodeColumn(rawValues) {
  const nonBlank = rawValues.map((v) => String(v ?? '').trim()).filter(Boolean)
  if (nonBlank.length === 0) return false
  return nonBlank.every((v) => /^\d+$/.test(v))
}

// Builds the initial categoryMapping (Map<rawString, {name, list, isNew}>)
// using fuzzy-match prefill against the account's existing categories.
//
// Numeric-coded columns (DECISION 2) skip fuzzy matching entirely and seed
// every code as an explicit UNSELECTED entry ({ name: null }) instead of
// defaulting to "+ Create new: '<code>'" — a bare numeric code has no
// semantic relationship to any category name, so a fuzzy/auto-create default
// is actively misleading (it was literally creating categories named "1",
// "2", etc.). The user must pick per-code with no auto-suggestion bias.
//
// Round-2 DECISION 1: if legendLookup (Map<lowercasedCode, name>) is
// provided and the column is numeric-coded, pre-fill each code whose
// lowercased form appears in the legend instead of leaving it unselected.
// The legend name is checked case-insensitively against candidateNames:
//   - matches an existing candidate -> isNew: false with the candidate's
//     exact stored casing (avoids duplicates that differ only by case).
//   - no match -> isNew: true with the legend's literal text (user-editable).
// Codes NOT in the legend still fall back to the unselected sentinel.
// Non-numeric columns: legendLookup is ignored (fuzzy path unchanged).
export function buildInitialCategoryMapping(rawCategories, candidateNames, legendLookup = null) {
  if (isNumericCodeColumn(rawCategories)) {
    return new Map(rawCategories.map((raw) => {
      if (legendLookup && legendLookup.size > 0) {
        const legendName = legendLookup.get(String(raw).trim().toLowerCase())
        if (legendName != null) {
          // Case-insensitive check against existing candidates
          const lower = legendName.toLowerCase()
          const existing = candidateNames.find((c) => c.toLowerCase() === lower)
          if (existing != null) {
            return [raw, { name: existing, list: 'outgoing', isNew: false }]
          }
          return [raw, { name: legendName, list: 'outgoing', isNew: true }]
        }
      }
      // Code not in legend (or no legend) — unselected sentinel
      return [raw, { name: null, list: 'outgoing', isNew: false }]
    }))
  }
  const map = new Map()
  for (const raw of rawCategories) {
    const { candidate, score } = bestMatch(raw, candidateNames)
    if (candidate && score >= 0.5) {
      map.set(raw, { name: candidate, list: 'outgoing', isNew: false })
    } else {
      map.set(raw, { name: raw, list: 'outgoing', isNew: true })
    }
  }
  return map
}

// Builds a single compound-keyed categoryMapping for multi-account mode
// (Round-2 DECISION 2). Groups unique raw category values per resolved
// accountId using uniqueValuesByAccount, calls buildInitialCategoryMapping
// per account, and returns one flat Map with compound keys
// `${accountId}|${rawCategory}` so buildDraftTransactions can resolve
// each row's category against the correct account's vocabulary.
//
// candidateNamesByAccount: plain object { [accountId]: string[] }
// legendLookup: same Map<lowercasedCode, name> as above, applied per-account
//   (one shared legend, per DECISION 2 point 4 — each account independently
//   checks its own candidateNames for isNew vs not).
export function buildInitialCategoryMappingMulti(rows, columnMapping, accountMapping, candidateNamesByAccount, legendLookup) {
  const byAccount = uniqueValuesByAccount(rows, columnMapping.categoryCol, columnMapping.accountCol, accountMapping)
  const result = new Map()
  for (const [accountId, rawCats] of byAccount) {
    const candidates = candidateNamesByAccount[accountId] ?? []
    const perAccountMap = buildInitialCategoryMapping(rawCats, candidates, legendLookup)
    for (const [rawCat, entry] of perAccountMap) {
      result.set(`${accountId}|${rawCat}`, entry)
    }
  }
  return result
}

// Token-run check identical in spirit to guessColumnMapping.js's
// containsTokenSequence — a raw label whose tokens contain the account
// name's tokens as an exact run (e.g. "Spending Account" -> ["spending",
// "account"] contains "spending" -> ["spending"]) is a far stronger signal
// than edit-distance similarity, and avoids the brittle substring-only
// check this replaces (which only ever tested for "saving" and defaulted
// everything else to Spending by accident, not by matching).
function normalizeTokens(str) {
  return String(str ?? '')
    .trim()
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function containsTokenSequence(labelTokens, nameTokens) {
  if (nameTokens.length === 0 || nameTokens.length > labelTokens.length) return false
  for (let start = 0; start <= labelTokens.length - nameTokens.length; start++) {
    let match = true
    for (let k = 0; k < nameTokens.length; k++) {
      if (labelTokens[start + k] !== nameTokens[k]) { match = false; break }
    }
    if (match) return true
  }
  return false
}

// Common shorthand a raw label might use instead of the full account name
// (e.g. "Spend" for Spending). Matched the same way as the real name.
const ACCOUNT_ALIASES = {
  [ACCOUNTS.SPENDING]: ['spending', 'spend'],
  [ACCOUNTS.SAVINGS]: ['savings', 'saving', 'save'],
}

// Maps a raw account label to ACCOUNTS.SPENDING / ACCOUNTS.SAVINGS using
// token-run + fuzzy matching against the two real account names (and a
// couple of common shorthands), rather than a brittle single substring
// check. When neither account matches confidently, the raw label is left
// UNMAPPED (no Map entry) rather than silently defaulting to Spending —
// Step3Values.jsx's account <select> and buildDraftTransactions's
// "Account ... is not mapped" flag both already treat a missing Map entry
// as "the user must pick," which is the correct affordance for a genuinely
// ambiguous label (better than silently corrupting one account's balance
// with rows that actually belonged to the other).
export function buildInitialAccountMapping(rawAccounts) {
  const map = new Map()
  for (const raw of rawAccounts) {
    const labelTokens = normalizeTokens(raw)
    let bestAccountId = null
    let bestScore = 0
    for (const accountId of [ACCOUNTS.SPENDING, ACCOUNTS.SAVINGS]) {
      const candidates = [ACCOUNT_NAMES[accountId], ...ACCOUNT_ALIASES[accountId]]
      const hasExactTokenMatch = candidates.some((c) => containsTokenSequence(labelTokens, normalizeTokens(c)))
      const score = hasExactTokenMatch ? 1 : bestMatch(raw, candidates).score
      if (score > bestScore) {
        bestScore = score
        bestAccountId = accountId
      }
    }
    // Same 0.75 high-confidence floor used by guessColumnMapping.js's
    // guessOneColumn — short, generic words can score deceptively high by
    // pure edit distance despite being unrelated; require near-exact or a
    // confirmed token-run match before auto-assigning.
    if (bestScore >= 0.75) {
      map.set(raw, bestAccountId)
    }
  }
  return map
}
