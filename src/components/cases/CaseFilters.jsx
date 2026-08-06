import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { Select, TextInput } from '@/components/ui/Field';
import { useBrand } from '@/brand/BrandProvider';
import { STATUSES } from '@/domain/statuses';
import { CASE_TYPES } from '@/domain/caseTypes';
import { ASSIGNABLE_ANALYSTS } from '@/data/users.seed';
import { allReasonCodes } from '@/brand/brand.config';

/**
 * Search plus an advanced panel that stays collapsed until asked for.
 *
 * Scheme, reason code and cycle are chargeback-only concepts, so those inputs
 * only appear once the case-type filter has excluded claims — otherwise the
 * panel offers filters that cannot match a third of the book.
 */
export function CaseFilters({ filters, onChange, resultCount }) {
  const brand = useBrand();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const set = (patch) => onChange({ ...filters, ...patch });

  const activeChips = [];
  if (filters.caseType && filters.caseType !== 'all') {
    activeChips.push({
      key: 'caseType',
      label: CASE_TYPES.find((t) => t.id === filters.caseType)?.label,
      clear: () => set({ caseType: 'all' }),
    });
  }
  (filters.statuses ?? []).forEach((s) =>
    activeChips.push({
      key: `status-${s}`,
      label: STATUSES.find((x) => x.id === s)?.label,
      clear: () => set({ statuses: filters.statuses.filter((x) => x !== s) }),
    }),
  );
  if (filters.queueIds?.length) {
    filters.queueIds.forEach((q) =>
      activeChips.push({
        key: `queue-${q}`,
        label: brand.queues.find((x) => x.id === q)?.label,
        clear: () => set({ queueIds: filters.queueIds.filter((x) => x !== q) }),
      }),
    );
  }
  if (filters.assigneeIds?.length) {
    filters.assigneeIds.forEach((a) =>
      activeChips.push({
        key: `assignee-${a}`,
        label: a === 'unassigned' ? 'Unassigned' : ASSIGNABLE_ANALYSTS.find((x) => x.id === a)?.name,
        clear: () => set({ assigneeIds: filters.assigneeIds.filter((x) => x !== a) }),
      }),
    );
  }
  if (filters.amountMin) {
    activeChips.push({ key: 'amountMin', label: `Min ${filters.amountMin}`, clear: () => set({ amountMin: '' }) });
  }
  if (filters.amountMax) {
    activeChips.push({ key: 'amountMax', label: `Max ${filters.amountMax}`, clear: () => set({ amountMax: '' }) });
  }
  if (filters.dueWithinDays !== '' && filters.dueWithinDays != null) {
    activeChips.push({
      key: 'due',
      label: `Due within ${filters.dueWithinDays}d`,
      clear: () => set({ dueWithinDays: '' }),
    });
  }

  const showCardFilters = filters.caseType === 'chargeback';

  return (
    <div className="stack stack--tight">
      <div className="filters">
        <div className="field" style={{ flex: 1, minWidth: 240 }}>
          <div className="topbar__search" style={{ maxWidth: 'none' }}>
            <Icon name="search" size={15} className="topbar__search-icon" />
            <input
              className="input"
              type="search"
              value={filters.search ?? ''}
              onChange={(e) => set({ search: e.target.value })}
              placeholder={`Case ID, ARN, order, item, ${brand.terms.buyer} or ${brand.terms.seller}…`}
              aria-label="Search cases"
            />
          </div>
        </div>

        <Select
          value={filters.caseType ?? 'all'}
          onChange={(e) => set({ caseType: e.target.value })}
          options={[{ value: 'all', label: 'All case types' }, ...CASE_TYPES.map((t) => ({ value: t.id, label: t.label }))]}
          aria-label="Case type"
        />

        <Button
          variant={advancedOpen ? 'subtle' : 'secondary'}
          icon="filter"
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
        >
          Advanced search
        </Button>

        {resultCount != null && <span className="small muted nowrap">{resultCount} matching</span>}
      </div>

      {activeChips.length > 0 && (
        <div className="chip-row">
          {activeChips.map((chip) => (
            <span key={chip.key} className="chip">
              {chip.label}
              <button type="button" className="chip__remove" onClick={chip.clear} aria-label={`Remove ${chip.label}`}>
                <Icon name="close" size={11} />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="chip"
            style={{ background: 'transparent', color: 'var(--c-ink-muted)' }}
            onClick={() =>
              onChange({
                ...filters,
                statuses: [],
                queueIds: [],
                assigneeIds: [],
                schemeIds: [],
                reasonCodes: [],
                entityIds: [],
                markets: [],
                amountMin: '',
                amountMax: '',
                dueWithinDays: '',
                caseType: 'all',
              })
            }
          >
            Clear all
          </button>
        </div>
      )}

      {advancedOpen && (
        <div className="filters__advanced">
          <Select
            label="Status"
            value=""
            onChange={(e) => e.target.value && set({ statuses: [...new Set([...(filters.statuses ?? []), e.target.value])] })}
            placeholder="Add a status…"
            options={STATUSES.map((s) => ({ value: s.id, label: s.label }))}
          />

          <Select
            label="Queue"
            value=""
            onChange={(e) => e.target.value && set({ queueIds: [...new Set([...(filters.queueIds ?? []), e.target.value])] })}
            placeholder="Add a queue…"
            options={brand.queues.map((q) => ({ value: q.id, label: q.label }))}
          />

          <Select
            label="Assignee"
            value=""
            onChange={(e) => e.target.value && set({ assigneeIds: [...new Set([...(filters.assigneeIds ?? []), e.target.value])] })}
            placeholder="Add an assignee…"
            options={[
              { value: 'unassigned', label: 'Unassigned' },
              ...ASSIGNABLE_ANALYSTS.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />

          <Select
            label="Entity"
            value={filters.entityIds?.[0] ?? ''}
            onChange={(e) => set({ entityIds: e.target.value ? [e.target.value] : [] })}
            placeholder="Any entity"
            options={brand.entities.map((en) => ({ value: en.id, label: en.label }))}
          />

          <Select
            label="Market"
            value={filters.markets?.[0] ?? ''}
            onChange={(e) => set({ markets: e.target.value ? [e.target.value] : [] })}
            placeholder="Any market"
            options={brand.markets.map((m) => ({ value: m, label: m }))}
          />

          {showCardFilters && (
            <>
              <Select
                label="Card scheme"
                value={filters.schemeIds?.[0] ?? ''}
                onChange={(e) => set({ schemeIds: e.target.value ? [e.target.value] : [] })}
                placeholder="Any scheme"
                options={brand.schemes.map((s) => ({ value: s.id, label: s.label }))}
              />

              <Select
                label="Reason code"
                value={filters.reasonCodes?.[0] ?? ''}
                onChange={(e) => set({ reasonCodes: e.target.value ? [e.target.value] : [] })}
                placeholder="Any reason code"
                options={allReasonCodes(brand).map((rc) => ({
                  value: rc.code,
                  label: `${rc.code} — ${rc.label}`,
                }))}
              />
            </>
          )}

          <TextInput
            label={`Min amount (${brand.currency})`}
            type="number"
            min="0"
            value={filters.amountMin ?? ''}
            onChange={(e) => set({ amountMin: e.target.value })}
          />

          <TextInput
            label={`Max amount (${brand.currency})`}
            type="number"
            min="0"
            value={filters.amountMax ?? ''}
            onChange={(e) => set({ amountMax: e.target.value })}
          />

          <TextInput
            label="Due within (days)"
            type="number"
            value={filters.dueWithinDays ?? ''}
            onChange={(e) => set({ dueWithinDays: e.target.value })}
            hint="Negative values find overdue cases."
          />
        </div>
      )}
    </div>
  );
}

export default CaseFilters;
