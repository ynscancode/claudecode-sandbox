import { useEffect, useState, useCallback } from 'react'
import { Receipt, ArrowLeftRight } from 'lucide-react'
import { api } from '../api/client.js'
import TransactionList from '../components/transactions/TransactionList.jsx'
import TransactionForm from '../components/transactions/TransactionForm.jsx'
import TransferForm from '../components/transactions/TransferForm.jsx'
import EditTransactionPanel from '../components/transactions/EditTransactionPanel.jsx'
import { currentMonthStr, monthRangeFor } from '../utils/dateUtils.js'
import { ACCOUNT_NAMES } from '../constants/categories.js'

export default function TransactionsPage() {
  const [month, setMonth] = useState(currentMonthStr())
  const [accountFilter, setAccountFilter] = useState('all')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [formError, setFormError] = useState(null)
  const [mode, setMode] = useState('normal')
  const [editingTxn, setEditingTxn] = useState(null)

  const loadTransactions = useCallback(async () => {
    setLoading(true)
    const { from, to } = monthRangeFor(month)
    const accountId = accountFilter === 'all' ? undefined : accountFilter
    const data = await api.getTransactions({ from, to, accountId })
    setTransactions(data)
    setLoading(false)
  }, [month, accountFilter])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  async function handleCreateTransaction(data) {
    setFormError(null)
    await api.createTransaction(data)
    await loadTransactions()
  }

  async function handleCreateTransfer(data) {
    setFormError(null)
    await api.createTransfer(data)
    await loadTransactions()
  }

  async function handleSaveEdit(id, data) {
    await api.updateTransaction(id, data)
    setEditingTxn(null)
    await loadTransactions()
  }

  async function handleDelete(txn) {
    const confirmMsg = txn.is_transfer
      ? 'Delete this transfer? Both linked legs will be removed.'
      : 'Delete this transaction?'
    if (!window.confirm(confirmMsg)) return
    await api.deleteTransaction(txn.id)
    await loadTransactions()
  }

  return (
    <div>
      <h1 className="page-title">Transactions</h1>

      <div className="card filter-bar">
        <label className="field">
          Month
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        <label className="field">
          Account
          <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
            <option value="all">All accounts</option>
            {Object.entries(ACCOUNT_NAMES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      {editingTxn && (
        <EditTransactionPanel
          txn={editingTxn}
          onSave={handleSaveEdit}
          onCancel={() => setEditingTxn(null)}
        />
      )}

      <div className="card">
        <div className="mode-toggle">
          <button type="button" className={mode === 'normal' ? 'active' : ''} onClick={() => setMode('normal')}>
            <Receipt size={16} aria-hidden="true" /> Normal transaction
          </button>
          <button type="button" className={mode === 'transfer' ? 'active' : ''} onClick={() => setMode('transfer')}>
            <ArrowLeftRight size={16} aria-hidden="true" /> Internal transfer
          </button>
        </div>
        {mode === 'normal'
          ? <TransactionForm onSubmit={handleCreateTransaction} />
          : <TransferForm onSubmit={handleCreateTransfer} />}
        {formError && <p className="error-text">{formError}</p>}
      </div>

      {loading ? <div className="loading-placeholder"><p>Loading...</p></div> : (
        <TransactionList
          transactions={transactions}
          onEdit={setEditingTxn}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
