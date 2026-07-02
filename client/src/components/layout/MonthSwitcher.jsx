import { ChevronLeft, ChevronRight } from 'lucide-react'
import { prevMonthStr, nextMonthStr, monthLabelShort } from '../../utils/dateUtils.js'
import { describeMonthActivity } from '../../utils/monthActivity.js'

// Reusable month navigation control used across all three tabs (Overview,
// Transactions, Budget): prev/next chevron buttons for stepping one month at
// a time, plus a native month input in the middle for jumping directly to
// any month, regardless of transaction history.
//
// Activity indicator (dot + caption + "Earliest:" hint + "Jump to earliest")
// is opt-in via `showActivityIndicator` and stays presentational: this
// component derives ALL indicator state from the pure `describeMonthActivity`
// helper and the already scope-resolved `activity` prop passed down by the
// page — it never reads any context itself, so Budget's call site (which
// passes neither new prop) renders byte-for-byte as before.
export default function MonthSwitcher({
  month,
  onChange,
  showActivityIndicator = false,
  activity = null,
  showJumpToEarliest = false,
}) {
  const switcher = (
    <div className="month-switcher">
      {showActivityIndicator && (
        <span
          className={`month-activity-dot ${
            describeMonthActivity(month, activity || { months: [], earliest: null, latest: null }).dotFilled
              ? 'month-activity-dot-filled'
              : 'month-activity-dot-hollow'
          }`}
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        className="month-switcher-btn"
        aria-label="Previous month"
        onClick={() => onChange(prevMonthStr(month))}
      >
        <ChevronLeft size={16} />
      </button>
      <input
        type="month"
        className="month-switcher-input"
        value={month}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select month"
      />
      <button
        type="button"
        className="month-switcher-btn"
        aria-label="Next month"
        onClick={() => onChange(nextMonthStr(month))}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )

  // Master opt-in gate: when off, render EXACTLY the original markup (no
  // wrapper, no indicator DOM at all) so existing call sites (Budget) are
  // untouched pixel-for-pixel.
  if (!showActivityIndicator) return switcher

  const scoped = activity || { months: [], earliest: null, latest: null }
  const { caption, hasHistory } = describeMonthActivity(month, scoped)

  return (
    <div className="month-switcher-wrap">
      {switcher}
      <div className="month-activity-info">
        <span className="month-activity-caption" role="status">{caption}</span>
        {hasHistory ? (
          <span className="month-activity-hint">
            Earliest: {monthLabelShort(scoped.earliest)}
            {showJumpToEarliest && (
              <button
                type="button"
                className="month-activity-jump"
                onClick={() => onChange(scoped.earliest)}
              >
                Jump to earliest
              </button>
            )}
          </span>
        ) : (
          <span className="month-activity-hint">No transaction history yet</span>
        )}
      </div>
    </div>
  )
}
