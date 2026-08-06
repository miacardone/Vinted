import { useMemo, useState } from 'react';
import { PageHeader, Card, Badge } from '@/components/ui/Surface';
import { BarChart, AreaChart, Donut } from '@/components/charts/Charts';
import { DataTable } from '@/components/ui/DataTable';
import { TruncatedText } from '@/components/ui/Overlay';
import { CASES } from '@/data/cases';
import { useBrand } from '@/brand/BrandProvider';
import { analystActivity, caseActivityPerWeek, newCasesPerDay, reasonCodeDonut } from '@/domain/metrics';
import { formatNumber } from '@/utils/format';

/**
 * Dashboard.
 *
 * Row order is fixed by the brief: bar → donut → donut → area → table. The two
 * donut cards hold a 1:1 aspect so they read as a matched pair.
 */

const RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days'];

function RangeChip({ value, onChange }) {
  return (
    <select
      className="select"
      style={{ width: 'auto', height: 26, fontSize: 'var(--fs-micro)' }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Date range"
    >
      {RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}

export function Dashboard() {
  const brand = useBrand();
  const [range, setRange] = useState(RANGES[1]);

  const weeks = range === 'Last 7 days' ? 2 : range === 'Last 90 days' ? 12 : 6;
  const days = range === 'Last 7 days' ? 7 : range === 'Last 90 days' ? 90 : 28;

  const activity = useMemo(() => caseActivityPerWeek(CASES, weeks), [weeks]);
  const daily = useMemo(() => newCasesPerDay(CASES, days), [days]);
  const analysts = useMemo(() => analystActivity(CASES), []);
  const donuts = useMemo(
    () => brand.schemes.slice(0, 2).map((s) => ({ scheme: s, ...reasonCodeDonut(CASES, s.id) })),
    [brand.schemes],
  );

  const analystColumns = [
    { key: 'email', header: 'Email', fw: 14, cell: (r) => <TruncatedText value={r.email} className="mono" /> },
    { key: 'aht', header: 'AHT (minutes)', fw: 7, align: 'right', cell: (r) => <span className="mono">{r.aht.toFixed(2)}</span> },
    { key: 'casesPerUser', header: 'Cases per user', fw: 7, align: 'right', cell: (r) => <span className="mono">{formatNumber(r.casesPerUser)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live position across both intake paths — volumes, reason-code mix and analyst throughput."
      />

      <div className="stack">
        {/* Row 1 — full-width stacked bar */}
        <Card title="Case Activity Per Week" action={<RangeChip value={range} onChange={setRange} />}>
          <BarChart
            data={activity}
            xLabel="Week"
            yLabel="Cases"
            series={[
              { key: 'completed', name: 'Completed' },
              { key: 'represented', name: 'Represented' },
              { key: 'open', name: 'Open' },
              { key: 'expired', name: 'Expired' },
              { key: 'rejected', name: 'Rejected' },
            ]}
          />
        </Card>

        {/* Row 2 — two square donut cards */}
        <div className="grid grid--2">
          {donuts.map((d, i) => (
            <Card
              key={d.scheme.id}
              className="card--square"
              title={`${d.scheme.label} Reason Codes`}
              action={<Badge tone="neutral">{formatNumber(d.total)} cases</Badge>}
            >
              <div className="row" style={{ justifyContent: 'center', height: '100%', alignItems: 'center' }}>
                <Donut
                  data={d.slices}
                  centreValue={formatNumber(d.total)}
                  centreLabel={d.scheme.label}
                  colorOffset={i * 2}
                  size={200}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Row 3 — full-width area */}
        <Card title="New Cases Per Day" action={<RangeChip value={range} onChange={setRange} />}>
          <AreaChart data={daily} xLabel="Day" yLabel="New cases" />
        </Card>

        {/* Row 4 — analyst activity table */}
        <Card title={`${brand.terms.analyst} activity`} bodyClassName="card__body--flush">
          <DataTable
            columns={analystColumns}
            rows={analysts}
            rowKey={(r) => r.email}
            density="comfortable"
          />
        </Card>
      </div>
    </>
  );
}

export default Dashboard;
