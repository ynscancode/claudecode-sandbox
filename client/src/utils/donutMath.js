// Pure helper extracted from DonutChart.jsx so that file only exports the
// component (keeps react-refresh/fast-refresh happy).
const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function buildDonutSegments(categories, total) {
  let acc = 0
  return categories.map((c) => {
    const frac = total > 0 ? c.value / total : 0
    const len = frac * CIRCUMFERENCE
    const seg = { color: c.color, dash: `${len} ${CIRCUMFERENCE - len}`, offset: -acc }
    acc += len
    return seg
  })
}

export { RADIUS }
