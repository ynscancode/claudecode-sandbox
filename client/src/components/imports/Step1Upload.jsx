import { useRef, useState } from 'react'
import { api } from '../../api/client.js'

export default function Step1Upload({ onParsed }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSubmitting(true)
    try {
      const data = await api.parseImportFile(file)
      onParsed(data, file.name)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
      // Allow re-selecting the same file path after an error.
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="import-dropzone">
        <p style={{ marginTop: 0 }}>Choose a CSV or Excel (.xlsx) file to import.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={submitting}
          onChange={handleFileChange}
          aria-label="Choose import file"
        />
        {submitting && <p aria-live="polite">Reading file…</p>}
      </div>
      {error && (
        <p className="error-text" role="alert" style={{ marginTop: 10 }}>
          {error}
        </p>
      )}
    </div>
  )
}
