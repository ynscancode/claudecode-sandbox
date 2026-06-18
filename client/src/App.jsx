import { NavLink, Routes, Route } from 'react-router-dom'
import { Wallet, LayoutDashboard, ArrowLeftRight, PieChart } from 'lucide-react'
import DashboardPage from './pages/DashboardPage.jsx'
import TransactionsPage from './pages/TransactionsPage.jsx'
import BreakdownPage from './pages/BreakdownPage.jsx'

function App() {
  return (
    <div className="app">
      <nav className="top-nav">
        <h1><Wallet size={18} aria-hidden="true" /> Budget Tracker</h1>
        <div className="nav-links">
          <NavLink to="/" end><LayoutDashboard size={16} aria-hidden="true" /> Dashboard</NavLink>
          <NavLink to="/transactions"><ArrowLeftRight size={16} aria-hidden="true" /> Transactions</NavLink>
          <NavLink to="/breakdown"><PieChart size={16} aria-hidden="true" /> Breakdown</NavLink>
        </div>
      </nav>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/breakdown" element={<BreakdownPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
