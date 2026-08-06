import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AsyncBoundary, SkeletonRows } from '@/components/ui/Feedback';
import StackedBars from '@/components/charts/StackedBars';
import { useAsync } from '@/hooks/useAsync';
import { getMonitoring } from '@/services/reports.service';
import { ERROR_TYPES, OUTCOME_STATES, PROCESSING_STATES } from '@/data/reports.seed';
import { useBrand } from '@/brand/BrandProvider';
import { formatNumber, formatPercent } from '@/utils/format';

/** Chart plus the numbers behind it — a stacked bar alone is not auditable. */
function MonitoringSection({ title, subtitle, data, series, totalsLabel, children }) {
  const totals = series.map((s) => ({
    ...s,
    total: data.reduce((sum, row) => sum + (row[s.id] ?? 0), 0),
  }));
  const grand = totals.reduce((sum, s) => sum + s.total, 0);

  return (
    <Card>
      <CardHead title={title} subtitle={subtitle} />
      <CardBody>
        <StackedBars data={data} series={series} />
      </CardBody>
      <CardBody flush>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{totalsLabel}</th>
                {data.map((row) => (
                  <th key={row.period} className="tbl__right">
                    {row.period}
                  </th>
                ))}
                <th className="tbl__right">Total</th>
                <th className="tbl__right">Share</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="row row--tight">
                      <span className="chart-legend__swatch" style={{ background: s.color }} />
                      <span className="small strong">{s.label}</span>
                    </span>
                  </td>
                  {data.map((row) => (
                    <td key={row.period} className="tbl__right mono small">
                      {formatNumber(row[s.id] ?? 0)}
                    </td>
                  ))}
                  <td className="tbl__right mono small strong">{formatNumber(s.total)}</td>
                  <td className="tbl__right mono small faint">
                    {formatPercent(grand ? (s.total / grand) * 100 : 0, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}

export function Monitoring() {
  const brand = useBrand();
  const { data, status, error, run } = useAsync(getMonitoring, []);
  const series = brand.chartSeries;

  return (
    <>
      <PageHeader
        title="Monitoring"
        subtitle="Document processing, dispute outcomes and integration errors over the last eight weeks."
      />

      <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={6} height={80} />}>
        {data && (
          <div className="stack stack--loose">
            <MonitoringSection
              title="Document processing"
              subtitle="Evidence documents ingested per week, by processing outcome."
              data={data.documentProcessing}
              totalsLabel="Processing state"
              series={PROCESSING_STATES.map((s) => ({
                id: s.id,
                label: s.label,
                color:
                  s.tone === 'success'
                    ? 'var(--c-success)'
                    : s.tone === 'warning'
                      ? 'var(--c-warning)'
                      : 'var(--c-danger)',
              }))}
            />

            <MonitoringSection
              title="Dispute outcomes"
              subtitle="Cases closed per week, by result."
              data={data.disputeOutcomes}
              totalsLabel="Outcome"
              series={OUTCOME_STATES.map((s) => ({
                id: s.id,
                label: s.label,
                color:
                  s.tone === 'success'
                    ? 'var(--c-success)'
                    : s.tone === 'danger'
                      ? 'var(--c-danger)'
                      : 'var(--c-series-neutral)',
              }))}
            />

            <MonitoringSection
              title="Error handling by response type"
              subtitle="Integration failures per week, grouped by the response that caused them."
              data={data.errorHandling}
              totalsLabel="Error type"
              series={ERROR_TYPES.map((t, i) => ({
                id: t.id,
                label: t.label,
                color: series[i % series.length],
              }))}
            >
              <div className="stack stack--tight" style={{ padding: 'var(--s-4)' }}>
                <span className="eyebrow">How each error is handled</span>
                {ERROR_TYPES.map((type) => (
                  <div key={type.id} className="row row--tight">
                    <Badge tone="neutral">{type.http}</Badge>
                    <span className="small strong">{type.label}</span>
                    <span className="small muted">— {type.remedy}</span>
                  </div>
                ))}
              </div>
            </MonitoringSection>
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}

export default Monitoring;
