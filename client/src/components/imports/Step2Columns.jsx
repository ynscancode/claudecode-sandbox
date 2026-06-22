// Column-mapping step: maps the file's actual headers to date/amount/
// direction/category/comment/account, with a best-guess prefill (computed
// by the caller via guessColumnMapping before this step mounts). Date format
// is a required, never-guessed selector since locale is genuinely ambiguous.

const NONE = '__none__'

function ColumnSelect({ label, headers, value, onChange, required }) {
  return (
    <label className="form-field">
      {label}
      {required && <span className="visually-hidden"> (required)</span>}
      <select
        value={value == null ? NONE : String(value)}
        onChange={(e) => onChange(e.target.value === NONE ? null : Number(e.target.value))}
      >
        {!required && <option value={NONE}>— Not in file —</option>}
        {required && value == null && <option value={NONE}>— Select a column —</option>}
        {headers.map((header, index) => (
          <option key={index} value={index}>
            {header || `Column ${index + 1}`}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function Step2Columns({ headers, mapping, onChange }) {
  function set(key, value) {
    onChange({ ...mapping, [key]: value })
  }

  return (
    <div>
      <p className="error-text" role="status" style={{ color: 'var(--muted)', marginBottom: 14 }}>
        Map the file's columns below. Fields marked required must be set before continuing.
      </p>
      <div className="import-mapping-grid">
        <ColumnSelect label="Date column" headers={headers} value={mapping.dateCol} onChange={(v) => set('dateCol', v)} required />

        <label className="form-field">
          Date format
          <select value={mapping.dateFormat || ''} onChange={(e) => set('dateFormat', e.target.value || null)}>
            <option value="">— Select a format —</option>
            <option value="YMD">Year-Month-Day (2026-06-21)</option>
            <option value="MDY">Month-Day-Year (06/21/2026)</option>
            <option value="DMY">Day-Month-Year (21/06/2026)</option>
          </select>
        </label>

        <label className="form-field full">
          Amount columns
          <div className="pill-group">
            <button
              type="button"
              className={`pill-btn ${mapping.amountMode === 'single' ? 'active' : ''}`}
              onClick={() => set('amountMode', 'single')}
            >
              Single amount column
            </button>
            <button
              type="button"
              className={`pill-btn ${mapping.amountMode === 'debit-credit' ? 'active' : ''}`}
              onClick={() => set('amountMode', 'debit-credit')}
            >
              Separate debit / credit columns
            </button>
          </div>
        </label>

        {mapping.amountMode === 'single' ? (
          <>
            <ColumnSelect label="Amount column" headers={headers} value={mapping.amountCol} onChange={(v) => set('amountCol', v)} required />
            <ColumnSelect label="Direction column (optional)" headers={headers} value={mapping.directionCol} onChange={(v) => set('directionCol', v)} />
          </>
        ) : (
          <>
            <ColumnSelect label="Debit column" headers={headers} value={mapping.debitCol} onChange={(v) => set('debitCol', v)} required />
            <ColumnSelect label="Credit column" headers={headers} value={mapping.creditCol} onChange={(v) => set('creditCol', v)} required />
          </>
        )}

        <ColumnSelect label="Category column" headers={headers} value={mapping.categoryCol} onChange={(v) => set('categoryCol', v)} required />
        <ColumnSelect label="Comment column (optional)" headers={headers} value={mapping.commentCol} onChange={(v) => set('commentCol', v)} />
        <ColumnSelect label="Account column (optional)" headers={headers} value={mapping.accountCol} onChange={(v) => set('accountCol', v)} />
      </div>
    </div>
  )
}
