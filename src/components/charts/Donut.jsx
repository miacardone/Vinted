import { useState } from 'react';
import Legend from '@/components/charts/Legend';
import { formatNumber, formatPercent } from '@/utils/format';

/**
 * Donut.
 *
 * Drawn as a single circle per segment using stroke-dasharray rather than arc
 * paths — it makes the 2px surface-coloured gap between segments trivial, and
 * that gap is what keeps adjacent slices legible without adding a border
 * colour that would compete with the series.
 *
 * The centre carries the total as a hero number, so the chart answers "how
 * many altogether" without the reader summing the slices.
 */
export function Donut({
  segments = [],
  size = 168,
  thickness = 22,
  centreValue,
  centreLabel,
  legend = true,
  formatValue = (v) => formatNumber(v),
}) {
  const [hovered, setHovered] = useState(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const centre = size / 2;

  // 2px visual gap, expressed in path length.
  const GAP = 2;

  let offset = 0;
  const arcs = segments.map((segment) => {
    const fraction = total ? segment.value / total : 0;
    const length = Math.max(fraction * circumference - GAP, 0);
    const arc = { ...segment, length, offset, fraction };
    offset += fraction * circumference;
    return arc;
  });

  const active = hovered != null ? arcs[hovered] : null;

  return (
    <div className="stack stack--tight">
      <div className="row" style={{ justifyContent: 'center' }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="chart"
          style={{ width: size, height: size, flex: 'none' }}
          role="img"
          aria-label={`Donut chart, ${segments.length} segments, ${total} total`}
        >
          {/* Track keeps the ring visible when there is little or no data */}
          <circle cx={centre} cy={centre} r={radius} fill="none" stroke="var(--c-line)" strokeWidth={thickness} />

          <g transform={`rotate(-90 ${centre} ${centre})`}>
            {arcs.map((arc, i) => (
              <circle
                key={arc.id ?? arc.label}
                cx={centre}
                cy={centre}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={hovered === i ? thickness + 4 : thickness}
                strokeDasharray={`${arc.length} ${circumference - arc.length}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="butt"
                style={{ transition: 'stroke-width 120ms var(--ease)', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <title>{`${arc.label}: ${formatValue(arc.value)} (${formatPercent(arc.fraction * 100, 0)})`}</title>
              </circle>
            ))}
          </g>

          <g className="donut-centre">
            <text x={centre} y={centre - 2} className="donut-centre__value">
              {active ? formatValue(active.value) : (centreValue ?? formatNumber(total))}
            </text>
            <text x={centre} y={centre + 15} className="donut-centre__label">
              {active ? active.label.slice(0, 22) : centreLabel}
            </text>
          </g>
        </svg>
      </div>

      {legend && (
        <Legend
          items={arcs.map((arc) => ({
            id: arc.id ?? arc.label,
            label: arc.label,
            color: arc.color,
            value: arc.value,
            formattedValue: `${formatValue(arc.value)} · ${formatPercent(arc.fraction * 100, 0)}`,
          }))}
        />
      )}
    </div>
  );
}

export default Donut;
