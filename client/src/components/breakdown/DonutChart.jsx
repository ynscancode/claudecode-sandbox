import { RADIUS } from '../../utils/donutMath.js'

// Raw SVG ring/donut chart matching the design spec's stroke-dasharray
// segment approach: one background track circle, then one stroke segment
// per category, rotated -90deg so segments start at 12 o'clock.
export default function DonutChart({ segments, centerLabel, centerValue }) {
  return (
    <div className="donut-wrap">
      <svg width="150" height="150" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--surface-2)" strokeWidth="13" />
        <g transform="rotate(-90 60 60)">
          {segments.map((s, i) => (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth="13"
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
              style={{ transition: 'stroke-dasharray .6s ease, stroke-dashoffset .6s ease' }}
            />
          ))}
        </g>
      </svg>
      <div className="donut-center">
        <div className="donut-center-label">{centerLabel}</div>
        <div className="donut-center-value">{centerValue}</div>
      </div>
    </div>
  )
}
