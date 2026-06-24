// Value-mapping step: ONE row per UNIQUE category string and ONE row per
// UNIQUE account-label string found in the file — not per file row.
import { useMemo } from 'react'
import { ACCOUNT_NAMES } from '../../constants/categories.js'
import { uniqueValues } from '../../utils/importTransforms.js'

const CREATE_NEW = '__create_new__'

// uniqueValues (case-insensitive collapse, first-seen casing kept) now lives
// in importTransforms.js so this DISPLAY layer and ImportModal.jsx's
// proceedToValues SEED layer share the exact same algorithm — see the
// function's doc comment there for why that consistency matters.

// Single category mapping row — shared by both single-account and multi-account
// rendering paths. The ONLY difference between the two paths is the Map key
// they write: compound `${accountId}|${rawCat}` in multi mode, plain `rawCat`
// in single mode. Factored out here to avoid duplicating the dropdown logic.
//
// Props:
//   raw           — the raw category string from the file (for display/aria)
//   mapKey        — the key to use in categoryMapping (plain or compound)
//   entry         — the current mapping entry { name, list, isNew } (or null)
//   outgoing      — string[] of outgoing category names for THIS account
//   incoming      — string[] of incoming category names for THIS account
//   colorFn       — (name: string) => cssColorString for the swatch
//   updateFn      — (mapKey, patch) => void  (calls setCategoryMapping)
function CategoryRow({ raw, mapKey, entry, outgoing, incoming, colorFn, updateFn }) {
  const resolvedEntry = entry || { name: raw, list: 'outgoing', isNew: true }
  const allNames = [...new Set([...outgoing, ...incoming])]
  // Genuine unselected state (Fix 4): a numeric-coded column's entries are
  // pre-seeded as { name: null, isNew: false } by buildInitialCategoryMapping
  // — neither a real mapped name nor a "create new" default. Mirrors the
  // account select's existing value="" / "— Select an account —" pattern.
  const isUnselected = resolvedEntry.name == null && !resolvedEntry.isNew
  const selectValue = isUnselected ? '' : resolvedEntry.isNew ? CREATE_NEW : resolvedEntry.name
  return (
    <div className="import-value-row" key={mapKey}>
      <span className="import-value-raw" title={raw}>{raw}</span>
      <span className="import-value-arrow" aria-hidden="true">→</span>
      <select
        value={selectValue}
        aria-label={`Map category "${raw}" to`}
        onChange={(e) => {
          const value = e.target.value
          if (value === '') return // unselected placeholder is a no-op; can't be re-selected once a real option is chosen
          if (value === CREATE_NEW) {
            updateFn(mapKey, { name: raw, isNew: true })
          } else {
            const isOutgoing = outgoing.includes(value)
            updateFn(mapKey, { name: value, list: isOutgoing ? 'outgoing' : 'incoming', isNew: false })
          }
        }}
      >
        {isUnselected && <option value="">— Select a category —</option>}
        <option value={CREATE_NEW}>+ Create new: "{raw}"</option>
        {allNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      {resolvedEntry.isNew && (
        <select
          value={resolvedEntry.list}
          onChange={(e) => updateFn(mapKey, { list: e.target.value })}
          aria-label={`List type for new category ${raw}`}
        >
          <option value="outgoing">Outgoing</option>
          <option value="incoming">Incoming</option>
        </select>
      )}
      {!resolvedEntry.isNew && resolvedEntry.name != null && (
        <span className="import-swatch" style={{ background: colorFn(resolvedEntry.name) }} aria-hidden="true" />
      )}
    </div>
  )
}

export default function Step3Values({
  rows,
  columnMapping,
  categoryMapping,
  setCategoryMapping,
  accountMapping,
  setAccountMapping,
  outgoingNames,
  incomingNames,
  colorFor,
  // Round-2 props (all optional/nullable — unused in single-account mode)
  categoriesByAccount,
  outgoingByAccount,
  incomingByAccount,
  colorForAccount,
}) {
  const rawCategories = useMemo(() => uniqueValues(rows, columnMapping.categoryCol), [rows, columnMapping.categoryCol])
  const rawAccounts = useMemo(() => uniqueValues(rows, columnMapping.accountCol), [rows, columnMapping.accountCol])

  function updateCategory(mapKey, patch) {
    const next = new Map(categoryMapping)
    next.set(mapKey, { ...(next.get(mapKey) || {}), ...patch })
    setCategoryMapping(next)
  }

  function updateAccount(raw, accountId) {
    const next = new Map(accountMapping)
    next.set(raw, accountId)
    setAccountMapping(next)
  }

  // Determine whether we should render in multi-account mode: accountScope is
  // 'multiple' AND categoriesByAccount has been populated (has at least one
  // resolved account entry, meaning accountMapping has been set up enough to
  // group by account). Fall back to single-account rendering if the map is
  // empty (e.g. user hasn't mapped account labels yet on the same visit).
  const isMultiMode = columnMapping.accountScope === 'multiple' && categoriesByAccount && categoriesByAccount.size > 0

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Categories</h3>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -4 }}>
        One row per unique category found in the file. Pick an existing category or create a new one.
      </p>

      {isMultiMode ? (
        // Multi-account mode (Round-2 DECISION 2): one sub-list per resolved
        // account, each headed by account name, each with compound Map keys
        // `${accountId}|${rawCat}` and per-account category vocabulary.
        [...categoriesByAccount.entries()].map(([accountId, rawCats]) => {
          const accountOutgoing = outgoingByAccount?.[accountId] ?? outgoingNames
          const accountIncoming = incomingByAccount?.[accountId] ?? incomingNames
          const colorFn = colorForAccount
            ? (name) => colorForAccount(accountId, name)
            : colorFor
          return (
            <div key={accountId} style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '8px 0 4px' }}>{ACCOUNT_NAMES[accountId] ?? `Account ${accountId}`} categories</h4>
              {rawCats.length === 0 ? (
                <p role="status" style={{ color: 'var(--muted)' }}>
                  No categories found for this account.
                </p>
              ) : (
                rawCats.map((raw) => {
                  const mapKey = `${accountId}|${raw}`
                  const entry = categoryMapping.get(mapKey)
                  return (
                    <CategoryRow
                      key={mapKey}
                      raw={raw}
                      mapKey={mapKey}
                      entry={entry}
                      outgoing={accountOutgoing}
                      incoming={accountIncoming}
                      colorFn={colorFn}
                      updateFn={updateCategory}
                    />
                  )
                })
              )}
            </div>
          )
        })
      ) : rawCategories.length === 0 ? (
        <p role="status" style={{ color: 'var(--muted)' }}>
          No category column mapped — every row will import as "Uncategorized".
        </p>
      ) : (
        // Single-account mode: flat list keyed by plain rawCat (unchanged from Round 1).
        rawCategories.map((raw) => {
          const entry = categoryMapping.get(raw)
          return (
            <CategoryRow
              key={raw}
              raw={raw}
              mapKey={raw}
              entry={entry}
              outgoing={outgoingNames}
              incoming={incomingNames}
              colorFn={colorFor}
              updateFn={updateCategory}
            />
          )
        })
      )}

      <h3>Accounts</h3>
      {columnMapping.accountScope === 'multiple' ? (
        <>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -4 }}>
            Map each account label found in your file to Spending or Savings.
          </p>
          {rawAccounts.length === 0 ? (
            <p className="error-text" role="alert">Account column is mapped but no values were found.</p>
          ) : (
            rawAccounts.map((raw) => (
              <div className="import-value-row" key={raw}>
                <span className="import-value-raw" title={raw}>{raw}</span>
                <span className="import-value-arrow" aria-hidden="true">→</span>
                <select
                  value={accountMapping.get(raw) ?? ''}
                  aria-label={`Map account "${raw}" to`}
                  onChange={(e) => updateAccount(raw, Number(e.target.value))}
                >
                  {accountMapping.get(raw) == null && (
                    <option value="">— Select an account —</option>
                  )}
                  {Object.entries(ACCOUNT_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </>
      ) : (
        // Single-account mode (Fix 1): the account column is hidden/cleared
        // on Step 2, so there's nothing to map here — just confirm where
        // every row is going. The fixed-account select already communicates
        // this on the previous step; this is a read-only echo, not a second
        // place to set it.
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -4 }}>
          All rows import to {ACCOUNT_NAMES[columnMapping.fixedAccountId] ?? 'the selected account'}.
        </p>
      )}
    </div>
  )
}
