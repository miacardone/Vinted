import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import { Kpi, KpiRow } from '@/components/ui/Kpi';
import { AsyncBoundary, SkeletonRows } from '@/components/ui/Feedback';
import StackedBars from '@/components/charts/StackedBars';
import AreaChart from '@/components/charts/AreaChart';
import Donut from '@/components/charts/Donut';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAsync } from '@/hooks/useAsync';
import { getDashboard } from '@/services/reports.service';
import { getConsolidationOverview } from '@/services/cases.service';
import { useBrand } from '@/brand/BrandProvider';
import { formatCompactMoney, formatMinutes, formatNumber, formatPercent } from '@/utils/format';
import { ROUTES } from '@/utils/constants';

export function Dashboard() {
  const brand = useBrand();
  const { data, status, error, run } = useAsync(getDashboard, []);
  const { data: consolidation } = useAsync(getConsolidationOverview, []);

  const kpis = data?.kpis;
  const series = brand.chartSeries;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Live position across ${brand.terms.chargebacks} and ${brand.terms.claimProgramme} ${brand.terms.claims}.`}
        actions={
          <Button as={Link} to={ROUTES.caseManagement} variant="primary" icon="inbox">
            Open case management
          </Button>
        }
      />

      <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={4} height={80} />}>
        {kpis && (
          <div className="stack stack--loose">
            <KpiRow>
              <Kpi
                label="Open cases"
                value={formatNumber(kpis.openCases)}
                meta={`${formatNumber(kpis.unassignedCases)} unassigned`}
                icon="inbox"
              />
              <Kpi
                label="Overdue"
                value={formatNumber(kpis.overdueCases)}
                meta={`${formatNumber(kpis.dueSoonCases)} due within 48h`}
                tone={kpis.overdueCases > 0 ? 'danger' : undefined}
                icon="alert"
              />
              <Kpi label="Open exposure" value={formatCompactMoney(kpis.openValue)} meta="Disputed value at risk" icon="card" />
              <Kpi
                label="Win rate"
                value={formatPercent(kpis.winRate, 0)}
                meta={`${formatCompactMoney(kpis.recoveredValue)} recovered`}
                tone="success"
                icon="check"
              />
              <Kpi
                label="Avg handling"
                value={formatMinutes(kpis.avgHandlingMinutes)}
                meta={`${formatNumber(kpis.chargebackCount)} CB · ${formatNumber(kpis.claimCount)} claims`}
                icon="clock"
              />
            </KpiRow>

            {/* Consolidation is the differentiator, so it gets a banner rather
                than being buried inside the case detail. */}
            {consolidation?.stats?.duplicateRiskGroups > 0 && (
              <Card>
                <CardBody tight>
                  <div className="row row--between">
                    <div className="row row--tight" style={{ minWidth: 0 }}>
                      <Icon name="link" size={18} style={{ color: 'var(--c-danger)', flex: 'none' }} />
                      <span className="small">
                        <strong>
                          {consolidation.stats.duplicateRiskGroups} order
                          {consolidation.stats.duplicateRiskGroups === 1 ? ' is' : 's are'} being disputed through two
                          channels at once.
                        </strong>{' '}
                        <span className="muted">
                          {formatCompactMoney(consolidation.stats.duplicateRefundExposure)} could be refunded twice if
                          these are worked separately.
                        </span>
                      </span>
                    </div>
                    <Button
                      as={Link}
                      to={ROUTES.workCaseDetail(consolidation.groups.find((g) => g.duplicateRefundRisk)?.caseIds[0])}
                      variant="secondary"
                      size="sm"
                    >
                      Review linked cases
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            <div className="grid grid--split">
              <Card>
                <CardHead
                  title="Weekly case activity"
                  subtitle="Cases received per week, split by intake path."
                />
                <CardBody>
                  <StackedBars
                    data={data.weeklyActivity}
                    series={[
                      { id: 'chargeback', label: brand.terms.chargebacks, color: series[0] },
                      { id: 'claim', label: brand.terms.claims, color: series[2] },
                    ]}
                  />
                </CardBody>
              </Card>

              <Card>
                <CardHead title="Daily intake" subtitle="New cases received, last 30 days." />
                <CardBody>
                  <AreaChart data={data.dailyIntake} valueKey="count" color={series[0]} />
                </CardBody>
              </Card>
            </div>

            <div className="grid grid--halves">
              {data.reasonDonuts.map((donut) => (
                <Card key={donut.schemeId}>
                  <CardHead
                    title={`${donut.schemeLabel} reason codes`}
                    subtitle={`${formatNumber(donut.total)} ${brand.terms.chargebacks} by reason code.`}
                  />
                  <CardBody>
                    {donut.total === 0 ? (
                      <p className="muted small">No {donut.schemeLabel} cases in the current book.</p>
                    ) : (
                      <Donut
                        segments={donut.segments.map((seg, i) => ({
                          id: seg.code,
                          label: `${seg.code === 'other' ? '' : `${seg.code} · `}${seg.label}`,
                          value: seg.count,
                          color: seg.code === 'other' ? brand.chartNeutral : series[i % series.length],
                        }))}
                        centreLabel={`${donut.schemeLabel} cases`}
                      />
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>

            <Card>
              <CardHead
                title={`${brand.terms.analyst === 'analyst' ? 'Analyst' : 'Agent'} handling time`}
                subtitle="Average handling time with the workload it was measured against."
              />
              <CardBody flush>
                <div className="table-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>{brand.terms.analyst === 'analyst' ? 'Analyst' : 'Agent'}</th>
                        <th className="tbl__right">Assigned</th>
                        <th className="tbl__right">Open</th>
                        <th className="tbl__right">Overdue</th>
                        <th className="tbl__right">Closed</th>
                        <th className="tbl__right">Avg handling</th>
                        <th style={{ width: 140 }}>Utilisation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.analysts.map((row) => {
                        const tone =
                          row.utilisation > 90 ? 'danger' : row.utilisation > 70 ? 'warning' : 'success';
                        return (
                          <tr key={row.id}>
                            <td>
                              <span className="row row--tight">
                                <span className="avatar avatar--sm">{row.initials}</span>
                                <span className="strong">{row.name}</span>
                              </span>
                            </td>
                            <td className="tbl__right mono">{formatNumber(row.assigned)}</td>
                            <td className="tbl__right mono">{formatNumber(row.open)}</td>
                            <td className="tbl__right mono" style={row.overdue ? { color: 'var(--c-danger)' } : undefined}>
                              {formatNumber(row.overdue)}
                            </td>
                            <td className="tbl__right mono">{formatNumber(row.closed)}</td>
                            <td className="tbl__right mono">{formatMinutes(row.avgHandlingMinutes)}</td>
                            <td>
                              <div className="row row--tight row--nowrap">
                                <div className="meter" style={{ flex: 1 }}>
                                  <div
                                    className={`meter__fill meter__fill--${tone}`}
                                    style={{ width: `${Math.min(row.utilisation, 100)}%` }}
                                  />
                                </div>
                                <span className="micro mono faint" style={{ width: 34, textAlign: 'right' }}>
                                  {formatPercent(row.utilisation, 0)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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

export default Dashboard;
