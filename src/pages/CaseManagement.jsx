import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody } from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';
import { AsyncBoundary, EmptyState, SkeletonRows } from '@/components/ui/Feedback';
import CaseTable from '@/components/cases/CaseTable';
import CaseFilters from '@/components/cases/CaseFilters';
import BulkEditModal from '@/components/cases/BulkEditModal';
import { useAsync } from '@/hooks/useAsync';
import { useSelection } from '@/hooks/useSelection';
import { useToast } from '@/context/ToastContext';
import { bulkUpdateCases, getConsolidationOverview, listCases } from '@/services/cases.service';
import { CASE_TABS, DEFAULT_PAGE_SIZE } from '@/utils/constants';
import { pluralise } from '@/utils/format';
import { useBrand } from '@/brand/BrandProvider';

const EMPTY_FILTERS = {
  caseType: 'all',
  statuses: [],
  queueIds: [],
  assigneeIds: [],
  schemeIds: [],
  reasonCodes: [],
  entityIds: [],
  markets: [],
  search: '',
  amountMin: '',
  amountMax: '',
  dueWithinDays: '',
};

export function CaseManagement() {
  const brand = useBrand();
  const { notify } = useToast();
  const [searchParams] = useSearchParams();
  const selection = useSelection();

  const [tab, setTab] = useState('open');
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    search: searchParams.get('search') ?? '',
  }));
  const [sort, setSort] = useState({ field: 'dueAt', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  const query = useMemo(
    () => ({ filters: { ...filters, tab }, sort, page, pageSize }),
    [filters, tab, sort, page, pageSize],
  );

  const { data, status, error, run } = useAsync(() => listCases(query), [query]);
  const { data: consolidation } = useAsync(getConsolidationOverview, []);

  const linkedCaseIds = useMemo(
    () => new Set((consolidation?.groups ?? []).flatMap((g) => g.caseIds)),
    [consolidation],
  );

  // Any change to what is being shown resets to page 1, or the operator lands
  // on an empty page 7 of a 2-page result.
  useEffect(() => {
    setPage(1);
  }, [filters, tab, pageSize]);

  const onApplyBulk = useCallback(
    async (changes) => {
      setApplying(true);
      try {
        const result = await bulkUpdateCases(selection.ids, changes);
        notify(`${pluralise(result.applied, 'case')} updated.`, 'success');
        setBulkOpen(false);
        selection.clear();
        await run();
      } catch (err) {
        notify(err.message ?? 'Bulk edit failed.', 'danger');
      } finally {
        setApplying(false);
      }
    },
    [selection, notify, run],
  );

  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Case management"
        subtitle={`Every ${brand.terms.chargeback} and ${brand.terms.claim} in one queue. Columns adapt to the case type you filter on.`}
        actions={
          <Button variant="secondary" icon="download">
            Export view
          </Button>
        }
      />

      <Card>
        <CardBody tight>
          <Tabs tabs={CASE_TABS} active={tab} onChange={setTab} />

          <div style={{ paddingTop: 'var(--s-4)' }}>
            <CaseFilters filters={filters} onChange={setFilters} resultCount={meta?.total} />
          </div>
        </CardBody>

        {selection.count > 0 && (
          <div style={{ padding: '0 var(--s-4)' }}>
            <div className="bulk-bar">
              <span className="bulk-bar__count">{selection.count}</span>
              <span className="small">selected</span>
              <span className="spacer" />
              <Button variant="secondary" size="sm" icon="edit" onClick={() => setBulkOpen(true)}>
                Bulk edit
              </Button>
              <Button variant="ghost" size="sm" onClick={selection.clear}>
                Clear selection
              </Button>
            </div>
          </div>
        )}

        <AsyncBoundary
          status={status}
          error={error}
          onRetry={run}
          skeleton={<SkeletonRows rows={8} />}
          isEmpty={data?.data?.length === 0}
          empty={
            <EmptyState
              icon="search"
              title="No cases match this view"
              body="Try widening the filters, or switch to the All tab to include archived cases."
              action={{ label: 'Reset filters', icon: 'refresh', onClick: () => setFilters(EMPTY_FILTERS) }}
            />
          }
        >
          {data && (
            <>
              <CaseTable
                cases={data.data}
                caseType={filters.caseType}
                selection={selection}
                sort={sort}
                onSortChange={setSort}
                linkedCaseIds={linkedCaseIds}
              />

              <Pagination
                page={meta.page}
                pageSize={meta.pageSize}
                total={meta.total}
                totalPages={meta.totalPages}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </AsyncBoundary>
      </Card>

      <p className="micro faint row row--tight" style={{ marginTop: 'var(--s-3)' }}>
        <Icon name="link" size={12} style={{ color: 'var(--c-primary)' }} />
        A link icon next to a case ID means it is consolidated with other cases.
      </p>

      <BulkEditModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        count={selection.count}
        onApply={onApplyBulk}
        busy={applying}
      />
    </>
  );
}

export default CaseManagement;
