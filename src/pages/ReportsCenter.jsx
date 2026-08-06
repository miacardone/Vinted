import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import { Kpi, KpiRow } from '@/components/ui/Kpi';
import { AsyncBoundary, SkeletonRows } from '@/components/ui/Feedback';
import { BarRows } from '@/components/charts/BarRow';
import StackedBars from '@/components/charts/StackedBars';
import { useAsync } from '@/hooks/useAsync';
import { getReportsSummary } from '@/services/reports.service';
import { useBrand } from '@/brand/BrandProvider';
import { formatCompactMoney, formatMoney, formatNumber, formatPercent } from '@/utils/format';

export function ReportsCenter() {
  const brand = useBrand();
  const { data, status, error, run } = useAsync(getReportsSummary, []);
  const series = brand.chartSeries;

  return (
    <>
      <PageHeader
        title="Reports center"
        subtitle="Where the book stands by deadline pressure and by why the dispute was raised."
      />

      <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={5} height={70} />}>
        {data && (
          <div className="stack stack--loose">
            <KpiRow>
              <Kpi label="Open cases" value={formatNumber(data.kpis.openCases)} meta="Across both intake paths" />
              <Kpi
                label="Overdue"
                value={formatNumber(data.kpis.overdueCases)}
                meta={formatPercent((data.kpis.overdueCases / Math.max(data.kpis.openCases, 1)) * 100, 0) + ' of open'}
                tone={data.kpis.overdueCases ? 'danger' : undefined}
              />
              <Kpi label="Open exposure" value={formatCompactMoney(data.kpis.openValue)} meta="Value at risk" />
              <Kpi label="Recovered" value={formatCompactMoney(data.kpis.recoveredValue)} meta="Closed in our favour" tone="success" />
            </KpiRow>

            <Card>
              <CardHead
                title="Open cases by due date"
                subtitle="Where the deadline pressure actually sits."
              />
              <CardBody>
                <StackedBars
                  data={data.byDueBucket.map((b) => ({ bucket: b.label, cases: b.count }))}
                  series={[{ id: 'cases', label: 'Open cases', color: series[0] }]}
                  xKey="bucket"
                  legend={false}
                  height={200}
                />
              </CardBody>
            </Card>

            <div className="grid grid--halves">
              <Card>
                <CardHead title="Totals by reason category" subtitle="Volume and value, both intake paths." />
                <CardBody>
                  <BarRows
                    rows={data.byCategory.map((row, i) => ({
                      id: row.id,
                      label: row.label,
                      value: row.count,
                      meta: formatMoney(row.value),
                      color: series[i % series.length],
                    }))}
                  />
                </CardBody>
              </Card>

              <Card>
                <CardHead title="Totals by due-date bucket" subtitle="Open cases only." />
                <CardBody flush>
                  <div className="table-wrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Bucket</th>
                          <th className="tbl__right">Cases</th>
                          <th className="tbl__right">Exposure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.byDueBucket.map((row) => (
                          <tr key={row.id}>
                            <td className="small">
                              <span
                                className="row row--tight"
                                style={row.id === 'overdue' ? { color: 'var(--c-danger)' } : undefined}
                              >
                                {row.label}
                              </span>
                            </td>
                            <td className="tbl__right mono small">{formatNumber(row.count)}</td>
                            <td className="tbl__right mono small">{formatMoney(row.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHead title="Queue depth" subtitle="Open cases and exposure per queue, with service targets." />
              <CardBody flush>
                <div className="table-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Queue</th>
                        <th className="tbl__right">Open</th>
                        <th className="tbl__right">Overdue</th>
                        <th className="tbl__right">Exposure</th>
                        <th className="tbl__right">SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byQueue.map((row) => (
                        <tr key={row.id}>
                          <td className="small strong">{row.label}</td>
                          <td className="tbl__right mono small">{formatNumber(row.depth)}</td>
                          <td
                            className="tbl__right mono small"
                            style={row.overdue ? { color: 'var(--c-danger)' } : undefined}
                          >
                            {formatNumber(row.overdue)}
                          </td>
                          <td className="tbl__right mono small">{formatMoney(row.value)}</td>
                          <td className="tbl__right mono small faint">{row.sla}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}

export default ReportsCenter;
