// Value-mapping step: ONE row per UNIQUE category string and ONE row per
// UNIQUE account-label string found in the file — not per file row.
import { useMemo } from 'react'
import { ACCOUNT_NAMES } from '../../constants/categories.js'

const CREATE_NEW = '__create_new__'

function uniqueValues(rows, colIndex) {
  if (colIndex == null) return []
  const seen = new Set()
  const out = []
  for (const row of rows) {
    const value = String(row[colIndex] ?? '').trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out;
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
}) {
  const rawCategories = useMemo(() => uniqueValues(rows, columnMapping.categoryCol), [rows, columnMapping.categoryCol])
  const rawAccounts = useMemo(() => uniqueValues(rows, columnMapping.accountCol), [rows, columnMapping.accountCol])

  function updateCategory(raw, patch) {
    const next = new Map(categoryMapping)
    next.set(raw, { ...next.get(raw), ...patch })
    setCategoryMapping(next)
  }

  function updateAccount(raw, accountId) {
    const next = new Map(accountMapping)
    next.set(raw, accountId)
    setAccountMapping(next)
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Categories</h3>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -4 }}>
        One row per unique category found in the file. Pick an existing category or create a new one.
      </p>
      {rawCategories.length === 0 ? (
        <p className="error-text" role="alert">No category column mapped — go back and map one.</p>
      ) : (
        rawCategories.map((raw) => {
          const entry = categoryMapping.get(raw) || { name: raw, list: 'outgoing', isNew: true }
          const allNames = [...new Set([...outgoingNames, ...incomingNames])]
          const selectValue = entry.isNew ? CREATE_NEW : entry.name
          return (
            <div className="import-value-row" key={raw}>
              <span className="import-value-raw" title={raw}>{raw}</span>
              <span className="import-value-arrow" aria-hidden="true">→</span>
              <select
                value={selectValue}
                aria-label={`Map category "${raw}" to`}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === CREATE_NEW) {
                    updateCategory(raw, { name: raw, isNew: true })
                  } else {
                    const isOutgoing = outgoingNames.includes(value)
                    updateCategory(raw, { name: value, list: isOutgoing ? 'outgoing' : 'incoming', isNew: false })
                  }
                }}
              >
                <option value={CREATE_NEW}>+ Create new: "{raw}"</option>
                {allNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {entry.isNew && (
                <select
                  value={entry.list}
                  onChange={(e) => updateCategory(raw, { list: e.target.value })}
                  aria-label={`List type for new category ${raw}`}
                >
                  <option value="outgoing">Outgoing</option>
                  <option value="incoming">Incoming</option>
                </select>
              )}
              {!entry.isNew && (
                <span className="import-swatch" style={{ background: colorFor(entry.name) }} aria-hidden="true" />
              )}
            </div>
          )
        })
      )}

      <h3>Accounts</h3>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -4 }}>
        One row per unique account label found in the file.
      </p>
      {columnMapping.accountCol == null ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          No account column mapped — every row will import to a single fixed account, configurable on the previous step.
        </p>
      ) : rawAccounts.length === 0 ? (
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
              {Object.entries(ACCOUNT_NAMES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        ))
      )}
    </div>
  )
}
