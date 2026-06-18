import { PieChart, Pie, Cell, Tooltip } from 'recharts'

const COLORS = ['#CC785C', '#4FB3A9', '#D9B64E', '#8C9EC9', '#B98AC9', '#8FCB98', '#E0995A', '#C77B9E', '#7FA8A0', '#A89A6B']

export default function CategoryPieChart({ title, data, mode }) {
  const total = data.reduce((sum, d) => sum + d.total, 0)

  function valueFor(entry) {
    const pct = total > 0 ? (entry.total / total) * 100 : 0
    if (mode === 'cash') return `$${entry.total.toFixed(2)}`
    if (mode === 'percent') return `${pct.toFixed(1)}%`
    return `$${entry.total.toFixed(2)} (${pct.toFixed(1)}%)`
  }

  if (data.length === 0) {
    return (
      <div className="pie-panel">
        <h3>{title}</h3>
        <p>No data for this month.</p>
      </div>
    )
  }

  return (
    <div className="pie-panel">
      <h3>{title}</h3>
      <PieChart width={320} height={280}>
        <Pie data={data} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={false}>
          {data.map((entry, index) => (
            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name, props) => valueFor(props.payload)} />
      </PieChart>
      <div className="legend">
        {data.map((entry, index) => (
          <div className="legend-row" key={entry.category}>
            <span>
              <span className="legend-swatch" style={{ background: COLORS[index % COLORS.length] }} />
              {entry.category}
            </span>
            <span>{valueFor(entry)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
