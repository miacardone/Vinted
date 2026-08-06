import { useState } from 'react';
import { formatNumber } from '@/utils/format';

/**
 * Area chart with a crosshair.
 *
 * Single series, so no legend box — the card title names it. A 2px line over a
 * soft fill, and a marker that only appears on the hovered point rather than a
 * dot on every one of thirty days.
 */
export function AreaChart({
  data = [],
  valueKey = 'count',
  labelKey = 'label',
  height = 200,
  color = 'var(--c-primary)',
  formatValue = (v) => formatNumber(v),
  yTicks = 3,
}) {
  const [hover, setHover] = useState(null);

  const W = 640;
  const H = height;
  const PAD = { top: 12, right: 10, bottom: 24, left: 34 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const values = data.map((d) => d[valueKey] ?? 0);
  const max = Math.max(1, ...values);
  const niceMax = Math.ceil(max / 5) * 5 || 5;

  const x = (i) => PAD.left + (data.length <= 1 ? plotW / 2 : (plotW / (data.length - 1)) * i);
  const y = (value) => PAD.top + plotH - (value / niceMax) * plotH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d[valueKey] ?? 0)}`).join(' ');
  const areaPath = data.length
    ? `${linePath} L${x(data.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`
    : '';

  const gradientId = `area-fill-${valueKey}`;

  // Only every nth label, or thirty dates collide into mush.
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div className="chart-frame">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Area chart of daily intake"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.26" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const value = (niceMax / yTicks) * i;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(value)} y2={y(value)} className="chart__grid-line" />
              <text x={PAD.left - 6} y={y(value) + 3.5} className="chart__axis-text" textAnchor="end">
                {formatNumber(Math.round(value))}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {linePath && <path d={linePath} className="chart__area-line" stroke={color} />}

        {/* Crosshair + marker for the hovered day only */}
        {hover != null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--c-line-strong)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle cx={x(hover)} cy={y(data[hover][valueKey] ?? 0)} r="5" fill={color} className="chart__dot" />
          </g>
        )}

        {/* Invisible hit columns — bigger targets than the line itself */}
        {data.map((d, i) => (
          <rect
            key={d[labelKey] ?? i}
            x={x(i) - plotW / Math.max(data.length, 1) / 2}
            y={PAD.top}
            width={plotW / Math.max(data.length, 1)}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={`lbl-${d[labelKey] ?? i}`} x={x(i)} y={H - 7} className="chart__axis-text" textAnchor="middle">
              {d[labelKey]}
            </text>
          ) : null,
        )}

        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} className="chart__baseline" />
      </svg>

      {hover != null && (
        <div className="chart-tooltip" style={{ left: `${(x(hover) / W) * 100}%`, top: 10 }}>
          <div className="strong">{data[hover][labelKey]}</div>
          <div className="chart-tooltip__value">{formatValue(data[hover][valueKey] ?? 0)}</div>
        </div>
      )}
    </div>
  );
}

export default AreaChart;
