import { formatNumber } from '@/utils/format';

/**
 * Horizontal bar rows — for ranked categories where the labels are words
 * rather than dates. Reading long labels along a vertical axis is far easier
 * than rotating them under columns.
 */
export function BarRow({ label, value, max, color = 'var(--c-primary)', meta, formatValue = formatNumber }) {
  const pct = max ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;

  return (
    <div className="stack" style={{ gap: 5 }}>
      <div className="row row--between row--nowrap" style={{ gap: 'var(--s-3)' }}>
        <span className="small truncate">{label}</span>
        <span className="row row--tight" style={{ flex: 'none' }}>
          {meta && <span className="micro faint">{meta}</span>}
          <span className="mono small strong">{formatValue(value)}</span>
        </span>
      </div>
      <div className="meter">
        <div className="meter__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function BarRows({ rows = [], color, formatValue }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="stack">
      {rows.map((row) => (
        <BarRow
          key={row.id ?? row.label}
          label={row.label}
          value={row.value}
          meta={row.meta}
          max={max}
          color={row.color ?? color}
          formatValue={formatValue}
        />
      ))}
    </div>
  );
}

export default BarRows;
