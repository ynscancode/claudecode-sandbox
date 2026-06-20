// Renders an already-formatted accounting-style string ("$48.00" / "($53.00)")
// so the last DIGIT lines up across rows regardless of whether a closing ")"
// is present. The closing ")" is rendered into a fixed-width
// absolutely-positioned gutter at the right edge of this inline element;
// values with no ")" reserve the same gutter width (via padding) so their
// last digit sits at the same x-position the digits would occupy if a ")"
// were present. Shared by BalanceValue (formatCurrency) and the Transactions
// OUT column (formatOutflow) — callers pass in the formatted text, the
// underlying format.js helpers are unchanged.
export default function AccountingValue({ text, className = '' }) {
  const hasParen = text.endsWith(')')
  const digits = hasParen ? text.slice(0, -1) : text

  return (
    <span className={`accounting-amount ${className}`.trim()}>
      {digits}
      {hasParen && <span className="accounting-paren" aria-hidden="true">)</span>}
    </span>
  )
}
