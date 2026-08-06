import { useState } from 'react';
import { formatNumber } from '@/utils/format';

/**
 * Hand-rolled inline SVG charts — no charting library.
 *
 * Mark specs applied throughout: thin marks, a 2px surface-coloured gap
 * between stacked segments, 4px rounded corners on the data end only, 2px
 * lines, markers only on the hovered point, and a recessive grid. One y-axis,
 * never two. Axis titles are supported on every chart because Reports centre
 * needs them.
 */

const seriesColor = (i) => `var(--c-series-${i % 6})`;

/* ---------- Legend ---------- */

export function Legend({ items }) {
  return (
    <ul className="legend" style={{ listStyle: 'none', margin: 'var(--s-3) 0 0', padding: 0 }}>
      {items.map((it) => (
        <li key={it.label} className="legend__item">
          <span className="legend__swatch" style={{ background: it.color }} />
          {it.label}
          {it.value != null && <span className="mono strong" style={{ marginLeft: 4 }}>{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Stacked / grouped bar ---------- */

export function BarChart({ data, series, xKey = 'period', height = 260, xLabel, yLabel, formatValue = formatNumber, legend = true }) {
  const [hover, setHover] = useState(null);

  const W = 680;
  const H = height;
  const PAD = { top: 12, right: 10, bottom: xLabel ? 44 : 28, left: yLabel ? 56 : 42 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const totals = data.map((row) => series.reduce((s, x) => s + (row[x.key] ?? 0), 0));
  const max = Math.max(1, ...totals);
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const niceMax = Math.ceil(max / step) * step || 10;

  const slot = plotW / Math.max(data.length, 1);
  const barW = Math.min(46, slot * 0.56);
  const y = (v) => PAD.top + plotH - (v / niceMax) * plotH;

  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${yLabel ?? 'Value'} by ${xLabel ?? 'period'}`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const v = (niceMax / 4) * i;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="chart__grid" />
              <text x={PAD.left - 7} y={y(v) + 3.5} className="chart__axis" textAnchor="end">{formatNumber(Math.round(v))}</text>
            </g>
          );
        })}

        {data.map((row, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2;
          let cursor = 0;
          return (
            <g key={row[xKey]} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {series.map((s, si) => {
                const v = row[s.key] ?? 0;
                if (!v) return null;
                const segH = (v / niceMax) * plotH;
                const top = PAD.top + plotH - cursor - segH;
                cursor += segH;
                const isTop = series.slice(si + 1).every((rest) => !(row[rest.key] ?? 0));
                return (
                  <rect
                    key={s.key}
                    x={x} y={top} width={barW}
                    height={Math.max(segH - 2, 1)}
                    rx={isTop ? 4 : 0}
                    fill={s.color ?? seriesColor(si)}
                    opacity={hover == null || hover === i ? 1 : 0.4}
                    style={{ transition: 'opacity 120ms var(--ease)' }}
                  >
                    <title>{`${row[xKey]} · ${s.name}: ${formatValue(v)}`}</title>
                  </rect>
                );
              })}
              <text x={PAD.left + slot * i + slot / 2} y={H - (xLabel ? 26 : 9)} className="chart__axis" textAnchor="middle">
                {row[xKey]}
              </text>
            </g>
          );
        })}

        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} className="chart__baseline" />

        {xLabel && <text x={PAD.left + plotW / 2} y={H - 6} className="chart__axis-title" textAnchor="middle">{xLabel}</text>}
        {yLabel && (
          <text transform={`rotate(-90 14 ${PAD.top + plotH / 2})`} x={14} y={PAD.top + plotH / 2} className="chart__axis-title" textAnchor="middle">
            {yLabel}
          </text>
        )}
      </svg>

      {hover != null && (
        <div className="tooltip" style={{ position: 'absolute', left: `${((PAD.left + slot * hover + slot / 2) / W) * 100}%`, top: 6, transform: 'translate(-50%,0)' }}>
          <span className="tooltip__title">{data[hover][xKey]}</span>
          {series.map((s, si) => (
            <div key={s.key} className="row row--between row--nowrap" style={{ gap: 10 }}>
              <span className="row row--xtight row--nowrap">
                <span className="legend__swatch" style={{ background: s.color ?? seriesColor(si) }} />{s.name}
              </span>
              <span className="mono strong">{formatValue(data[hover][s.key] ?? 0)}</span>
            </div>
          ))}
        </div>
      )}

      {legend && series.length > 1 && (
        <Legend items={series.map((s, i) => ({ label: s.name, color: s.color ?? seriesColor(i) }))} />
      )}
    </div>
  );
}

/* ---------- Area ---------- */

export function AreaChart({ data, valueKey = 'value', xKey = 'period', height = 260, xLabel, yLabel, color = 'var(--c-series-0)', formatValue = formatNumber }) {
  const [hover, setHover] = useState(null);

  const W = 680;
  const H = height;
  const PAD = { top: 12, right: 12, bottom: xLabel ? 44 : 28, left: yLabel ? 56 : 42 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const max = Math.max(1, ...data.map((d) => d[valueKey] ?? 0));
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const niceMax = Math.ceil(max / step) * step || 10;

  const x = (i) => PAD.left + (data.length <= 1 ? plotW / 2 : (plotW / (data.length - 1)) * i);
  const y = (v) => PAD.top + plotH - (v / niceMax) * plotH;

  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d[valueKey] ?? 0)}`).join(' ');
  const area = data.length ? `${line} L${x(data.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z` : '';
  const gid = `area-${valueKey}-${data.length}`;
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${yLabel ?? 'Value'} over time`} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((i) => {
          const v = (niceMax / 3) * i;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="chart__grid" />
              <text x={PAD.left - 7} y={y(v) + 3.5} className="chart__axis" textAnchor="end">{formatNumber(Math.round(v))}</text>
            </g>
          );
        })}

        {area && <path d={area} fill={`url(#${gid})`} />}
        {line && <path d={line} className="chart__line" stroke={color} />}

        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--c-line-strong)" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover][valueKey] ?? 0)} r="5" fill={color} className="chart__dot" />
          </g>
        )}

        {data.map((d, i) => (
          <rect
            key={`hit-${d[xKey]}-${i}`}
            x={x(i) - plotW / Math.max(data.length, 1) / 2}
            y={PAD.top}
            width={plotW / Math.max(data.length, 1)}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {data.map((d, i) => (i % labelEvery === 0 ? (
          <text key={`lbl-${d[xKey]}-${i}`} x={x(i)} y={H - (xLabel ? 26 : 9)} className="chart__axis" textAnchor="middle">{d[xKey]}</text>
        ) : null))}

        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} className="chart__baseline" />

        {xLabel && <text x={PAD.left + plotW / 2} y={H - 6} className="chart__axis-title" textAnchor="middle">{xLabel}</text>}
        {yLabel && (
          <text transform={`rotate(-90 14 ${PAD.top + plotH / 2})`} x={14} y={PAD.top + plotH / 2} className="chart__axis-title" textAnchor="middle">{yLabel}</text>
        )}
      </svg>

      {hover != null && (
        <div className="tooltip" style={{ position: 'absolute', left: `${(x(hover) / W) * 100}%`, top: 6, transform: 'translate(-50%,0)' }}>
          <span className="tooltip__title">{data[hover][xKey]}</span>
          <span className="mono">{formatValue(data[hover][valueKey] ?? 0)}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Donut ---------- */

/**
 * Drawn as one stroked circle per slice with dasharray, which makes the 2px
 * surface gap between slices trivial. Centre carries the total; a dot legend
 * sits beneath.
 */
export function Donut({ data, centreValue, centreLabel, size = 190, thickness = 26, legend = true, colorOffset = 0, formatValue = formatNumber }) {
  const [hover, setHover] = useState(null);

  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const c = size / 2;
  const GAP = 2;

  let offset = 0;
  const arcs = data.map((d, i) => {
    const fraction = total ? d.value / total : 0;
    const length = Math.max(fraction * circumference - GAP, 0);
    const arc = { ...d, length, offset, fraction, color: d.color ?? (d.other ? 'var(--c-series-neutral)' : seriesColor(i + colorOffset)) };
    offset += fraction * circumference;
    return arc;
  });

  const active = hover != null ? arcs[hover] : null;

  return (
    <div className="stack stack--tight" style={{ alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${data.length} segments, ${total} total`} style={{ flex: 'none' }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--c-line)" strokeWidth={thickness} />
        <g transform={`rotate(-90 ${c} ${c})`}>
          {arcs.map((arc, i) => (
            <circle
              key={arc.label}
              cx={c} cy={c} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={hover === i ? thickness + 4 : thickness}
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              style={{ transition: 'stroke-width 120ms var(--ease)', cursor: 'pointer' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{`${arc.label}: ${formatValue(arc.value)} (${Math.round(arc.fraction * 100)}%)`}</title>
            </circle>
          ))}
        </g>
        <text x={c} y={c - 1} className="donut-centre__value" textAnchor="middle">
          {active ? formatValue(active.value) : (centreValue ?? formatNumber(total))}
        </text>
        <text x={c} y={c + 15} className="donut-centre__label" textAnchor="middle">
          {active ? active.label : centreLabel}
        </text>
      </svg>

      {legend && <Legend items={arcs.map((a) => ({ label: a.label, color: a.color }))} />}
    </div>
  );
}

/* ---------- Horizontal bar rows ---------- */

export function BarRows({ rows, formatValue = formatNumber }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="stack stack--tight">
      {rows.map((row, i) => (
        <div key={row.label} className="stack" style={{ gap: 4 }}>
          <div className="row row--between row--nowrap">
            <span className="small truncate">{row.label}</span>
            <span className="row row--xtight" style={{ flex: 'none' }}>
              {row.meta && <span className="micro subtle">{row.meta}</span>}
              <span className="mono small strong">{formatValue(row.value)}</span>
            </span>
          </div>
          <div className="meter">
            <div className="meter__fill" style={{ width: `${(row.value / max) * 100}%`, background: row.color ?? seriesColor(i) }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default BarChart;
