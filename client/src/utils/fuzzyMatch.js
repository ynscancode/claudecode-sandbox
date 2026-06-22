// Small normalized Levenshtein similarity scorer used to prefill the import
// wizard's category-mapping suggestions. No external dependency — this is a
// few dozen lines, not worth pulling in a library for.

function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row rolling array, O(min(m,n)) memory.
  let prevRow = new Array(n + 1);
  for (let j = 0; j <= n; j++) prevRow[j] = j;

  for (let i = 1; i <= m; i++) {
    const currRow = new Array(n + 1);
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1, // deletion
        currRow[j - 1] + 1, // insertion
        prevRow[j - 1] + cost // substitution
      );
    }
    prevRow = currRow;
  }
  return prevRow[n];
}

// Returns a similarity score in [0, 1], 1 being an exact match (case/space
// insensitive), 0 being completely dissimilar.
export function similarity(a, b) {
  const sa = String(a ?? '').trim().toLowerCase();
  const sb = String(b ?? '').trim().toLowerCase();
  if (sa === sb) return 1;
  const maxLen = Math.max(sa.length, sb.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(sa, sb);
  return 1 - dist / maxLen;
}

// Given an input string and a list of candidate strings, returns
// { candidate, score } for the best match, or { candidate: null, score: 0 }
// if candidates is empty.
export function bestMatch(input, candidates) {
  if (!candidates || candidates.length === 0) {
    return { candidate: null, score: 0 };
  }
  let best = candidates[0];
  let bestScore = similarity(input, candidates[0]);
  for (let i = 1; i < candidates.length; i++) {
    const score = similarity(input, candidates[i]);
    if (score > bestScore) {
      bestScore = score;
      best = candidates[i];
    }
  }
  return { candidate: best, score: bestScore };
}
