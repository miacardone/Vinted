/**
 * Chart legend.
 *
 * Always rendered for two or more series, because colour alone must never be
 * the only way to tell series apart. Values sit in ink tokens rather than the
 * series colour — the swatch carries identity, the text stays readable.
 */
export function Legend({ items = [], showValues = true }) {
  return (
    <div className="chart-legend">
      {items.map((item) => (
        <span key={item.id ?? item.label} className="chart-legend__item">
          <span className="chart-legend__swatch" style={{ background: item.color }} />
          <span>{item.label}</span>
          {showValues && item.value != null && (
            <span className="chart-legend__value">{item.formattedValue ?? item.value}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export default Legend;
