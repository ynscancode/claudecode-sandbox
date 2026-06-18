import { useEffect, useState } from 'react'
import { Wallet, PiggyBank } from 'lucide-react'
import { api } from '../api/client.js'
import DailySummaryCard from '../components/dashboard/DailySummaryCard.jsx'
import MonthlySummaryCard from '../components/dashboard/MonthlySummaryCard.jsx'
import { todayStr, currentMonthStr } from '../utils/dateUtils.js'
import { formatCurrency } from '../utils/format.js'
import { ACCOUNTS } from '../constants/categories.js'

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([])
  const [dailySummary, setDailySummary] = useState(null)
  const [monthlySummary, setMonthlySummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [accountsData, daily, monthly] = await Promise.all([
        api.getAccounts(),
        api.getDailySummary(todayStr()),
        api.getMonthlySummary(currentMonthStr()),
      ])
      setAccounts(accountsData)
      setDailySummary(daily)
      setMonthlySummary(monthly)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading-placeholder"><p>Loading...</p></div>

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <h2 className="month-header">Accounts</h2>
      <div className="card-grid">
        {accounts.map((account) => {
          const AccountIcon = account.id === ACCOUNTS.SAVINGS ? PiggyBank : Wallet
          return (
            <div className="card" key={account.id}>
              <div className="stat-label"><AccountIcon size={14} aria-hidden="true" /> {account.name} balance</div>
              <div className="stat-value">{formatCurrency(account.balance)}</div>
            </div>
          )
        })}
      </div>

      <h2 className="month-header">Summary</h2>
      <div className="card-grid">
        <DailySummaryCard summary={dailySummary} />
        <MonthlySummaryCard summary={monthlySummary} />
      </div>
    </div>
  )
}
