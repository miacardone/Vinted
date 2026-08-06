import { useState } from 'react';
import Legend from '@/components/charts/Legend';
import { formatNumber } from '@/utils/format';

/**
 * Stacked column chart.
 *
 * Mark spec: thin columns, a 2px surface-coloured gap between stacked
 * segments, 4px rounded corners on the top of each column only (the data end),
 * and a recessive grid. One y-axis — never two.
 */
export function StackedBars({
  data = [],
  series = [],
  xKey = 'period',
  height = 220,
  formatValue = (v) => formatNumber(v),
  yTicks = 4,
  legend = true,
}) {
  const [hover, setHover] = useState(null);

  const W = 640;
  const H = height;
  const PAD = { top: 12, right: 8, bottom: 26, left: 38 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const totals = data.map((row) => series.reduce((sum, s) => sum + (row[s.id] ?? 0), 0));
  const max = Math.max(1, ...totals);
  // Round the axis up to something human before scaling.
  const niceMax = Math.ceil(max / 10) * 10 || 10;

  const slot = plotW / Math.max(data.length, 1);
  const barW = Math.min(38, slot * 0.58);

  const y = (value) => PAD.top + plotH - (value / niceMax) * plotH;

  return (
    <div className="chart-frame stack stack--tight">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Stacked column chart"
      >
        {/* Grid */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const value = (niceMax / yTicks) * i;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(value)} y2={y(value)} className="chart__grid-line" />
              <text x={PAD.left - 7} y={y(value) + 3.5} className="chart__axis-text" textAnchor="end">
                {formatNumber(Math.round(value))}
              </text>
            </g>
          );
        })}

        {data.map((row, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2;
          let cursor = 0;

          return (
            <g
              key={row[xKey]}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Generous hit target — bigger than the mark itself */}
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={plotH} fill="transparent" />

              {series.map((s, sIndex) => {
                const value = row[s.id] ?? 0;
                if (!value) return null;

                const segH = (value / niceMax) * plotH;
                const yTop = PAD.top + plotH - cursor - segH;
                cursor += segH;

                const isTop = series.slice(sIndex + 1).every((rest) => !(row[rest.id] ?? 0));

                return (
                  <rect
                    key={s.id}
                    x={x}
                    y={yTop}
                    width={barW}
                    // The 2px gap comes out of the segment, not the column pitch.
                    height={Math.max(segH - 2, 1)}
                    rx={isTop ? 4 : 0}
                    fill={s.color}
                    opacity={hover == null || hover === i ? 1 : 0.42}
                    style={{ transition: 'opacity 120ms var(--ease)' }}
                  >
                    <title>{`${row[xKey]} · ${s.label}: ${formatValue(value)}`}</title>
                  </rect>
                );
              })}

              <text
                x={PAD.left + slot * i + slot / 2}
                y={H - 8}
                className="chart__axis-text"
                textAnchor="middle"
              >
                {row[xKey]}
              </text>
            </g>
          );
        })}

        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} className="chart__baseline" />
      </svg>

      {hover != null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((PAD.left + slot * hover + slot / 2) / W) * 100}%`,
            top: 8,
          }}
        >
          <div className="strong" style={{ marginBottom: 4 }}>{data[hover][xKey]}</div>
          {series.map((s) => (
            <div key={s.id} className="chart-tooltip__row">
              <span className="row row--tight">
                <span className="chart-legend__swatch" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="chart-tooltip__value">{formatValue(data[hover][s.id] ?? 0)}</span>
            </div>
          ))}
          <div className="chart-tooltip__row" style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.22)' }}>
            <span>Total</span>
            <span className="chart-tooltip__value">{formatValue(totals[hover])}</span>
          </div>
        </div>
      )}

      {legend && series.length > 1 && <Legend items={series} showValues={false} />}
    </div>
  );
}

export default StackedBars;
