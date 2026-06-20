import { formatCurrency } from '../../utils/format.js'
import AccountingValue from './AccountingValue.jsx'

// Renders an accounting-style balance ("$48.00" / "($53.00)") so that the
// last DIGIT lines up across rows regardless of sign. formatCurrency's
// output text is unchanged for any other caller — this only restyles how a
// balance is split into DOM nodes for the .balance-cell column, via the
// shared AccountingValue gutter component.
export default function BalanceValue({ value }) {
  return <AccountingValue text={formatCurrency(value)} className="balance-amount" />
}
