import Icon from '@/components/ui/Icon';

/**
 * Stat tile. A number with a label and one line of context — deliberately not
 * a chart, because a single value plotted is just a number wearing a costume.
 */
export function Kpi({ label, value, meta, tone, icon }) {
  return (
    <div className="kpi">
      <span className="kpi__label">{label}</span>
      <span className="kpi__value">{value}</span>
      {meta && (
        <span className={`kpi__meta ${tone ? `kpi__meta--${tone}` : ''}`.trim()}>
          {icon && <Icon name={icon} size={12} />}
          {meta}
        </span>
      )}
    </div>
  );
}

export function KpiRow({ children }) {
  return <div className="grid grid--kpi">{children}</div>;
}

export default Kpi;
