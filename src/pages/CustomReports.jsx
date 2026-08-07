import { useMemo, useState } from 'react';
import { PageHeader, Card, Toolbar, Tabs, Button, IconButton, Badge, Kpi, EmptyState } from '@/components/ui/Surface';
import { DataTable, ExportButtons } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SearchBar, SelectField, TextField } from '@/components/ui/Form';
import { BarChart, Donut } from '@/components/charts/Charts';
import { TruncatedText } from '@/components/ui/Overlay';
import Icon from '@/components/ui/Icon';
import { GROUP_BY_FIELDS, REPORT_FORMATS, REPORT_TEMPLATES, REPORT_TYPES, SAVED_REPORTS } from '@/data/content';
import { CASES } from '@/data/cases';
import { caseActivityPerWeek, caseKpis, reasonCodeDonut } from '@/domain/metrics';
import brand from '@/brand/brand.config';
import { useToast } from '@/context/ToastContext';
import { formatCompactCurrency, formatDate, formatNumber, formatPercent } from '@/utils/format';

/**
 * Custom reports.
 *
 * Scheduling lives HERE, in the builder, rather than on a Scheduler page — a
 * schedule belongs to a report. Scheduled reports get their own tab in the list.
 */

const TABS = [{ value: 'reports', label: 'Reports' }, { value: 'scheduled', label: 'Scheduled reports' }, { value: 'builder', label: 'Report builder' }];

function AdvancedSearchModal({ open, onClose, value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Advanced search"
      size="lg"
      footer={<><Button variant="ghost" onClick={() => onChange({ name: '', type: '', createdBy: '', format: '', minRows: '', maxRows: '' })}>Reset</Button><Button variant="primary" onClick={onClose}>Apply</Button></>}
    >
      <div className="grid grid--3">
        <TextField label="Name" value={value.name} onChange={(e) => set({ name: e.target.value })} />
        <SelectField label="Type" value={value.type} onChange={(e) => set({ type: e.target.value })} placeholder="Any type" options={REPORT_TYPES.map((t) => ({ value: t, label: t }))} />
        <TextField label="Created by" value={value.createdBy} onChange={(e) => set({ createdBy: e.target.value })} />
        <SelectField label="Format" value={value.format} onChange={(e) => set({ format: e.target.value })} placeholder="Any format" options={REPORT_FORMATS.map((f) => ({ value: f, label: f }))} />
        <TextField label="Row count min" type="number" value={value.minRows} onChange={(e) => set({ minRows: e.target.value })} />
        <TextField label="Row count max" type="number" value={value.maxRows} onChange={(e) => set({ maxRows: e.target.value })} />
      </div>
    </Modal>
  );
}

function ReportBuilder({ onSave }) {
  const { notify } = useToast();

  const [templateId, setTemplateId] = useState(REPORT_TEMPLATES[0].id);
  const [name, setName] = useState('');
  const [type, setType] = useState(REPORT_TYPES[0]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [groupBy, setGroupBy] = useState(GROUP_BY_FIELDS[0]);
  const [format, setFormat] = useState('CSV');
  const [mode, setMode] = useState('on_demand');
  const [frequency, setFrequency] = useState('Weekly');
  const [emailOnComplete, setEmailOnComplete] = useState(true);
  const [recipients, setRecipients] = useState([`ops@${brand.emailDomain}`]);
  const [recipientDraft, setRecipientDraft] = useState('');

  const template = REPORT_TEMPLATES.find((t) => t.id === templateId);
  const kpis = useMemo(() => caseKpis(CASES), []);
  const byPeriod = useMemo(() => caseActivityPerWeek(CASES, 6), []);
  const donut = useMemo(() => reasonCodeDonut(CASES, brand.schemes[0].id, 5), []);

  const range = start && end ? `${formatDate(start)} – ${formatDate(end)}` : 'All time';

  const addRecipient = () => {
    const v = recipientDraft.trim();
    if (!v || recipients.includes(v)) return;
    setRecipients((p) => [...p, v]);
    setRecipientDraft('');
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr)', alignItems: 'start' }}>
      <Card title="Configuration">
        <div className="stack stack--tight">
          <TextField label="Report name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekly counterfeit review" />
          <SelectField label="Report type" value={type} onChange={(e) => setType(e.target.value)} options={REPORT_TYPES.map((t) => ({ value: t, label: t }))} />

          <div className="field">
            <span className="field__label">Start date</span>
            <div className="row row--xtight row--nowrap">
              <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              {start && <IconButton icon="close" label="Clear start date" size={12} onClick={() => setStart('')} />}
            </div>
          </div>

          <div className="field">
            <span className="field__label">End date</span>
            <div className="row row--xtight row--nowrap">
              <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              {end && <IconButton icon="close" label="Clear end date" size={12} onClick={() => setEnd('')} />}
            </div>
          </div>

          <SelectField label="Group by" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} options={GROUP_BY_FIELDS.map((f) => ({ value: f, label: f }))} />
          <SelectField label="Format" value={format} onChange={(e) => setFormat(e.target.value)} options={REPORT_FORMATS.map((f) => ({ value: f, label: f }))} />

          <div className="field">
            <span className="field__label">Schedule</span>
            <div className="seg">
              <button type="button" className={`seg__btn ${mode === 'on_demand' ? 'is-active' : ''}`.trim()} onClick={() => setMode('on_demand')}>Run on demand</button>
              <button type="button" className={`seg__btn ${mode === 'recurring' ? 'is-active' : ''}`.trim()} onClick={() => setMode('recurring')}>Recurring</button>
            </div>
          </div>

          {mode === 'recurring' && (
            <SelectField label="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} options={['Daily', 'Weekly', 'Monthly'].map((f) => ({ value: f, label: f }))} />
          )}

          <label className="row row--xtight" style={{ cursor: 'pointer' }}>
            <input type="checkbox" className="checkbox" checked={emailOnComplete} onChange={(e) => setEmailOnComplete(e.target.checked)} />
            <span className="small">Email on complete</span>
          </label>

          <div className="field">
            <span className="field__label">Recipients</span>
            <div className="row row--tight" style={{ marginBottom: 4 }}>
              {recipients.map((r) => (
                <span key={r} className="chip">
                  {r}
                  <button type="button" className="chip__remove" onClick={() => setRecipients((p) => p.filter((x) => x !== r))} aria-label={`Remove ${r}`}>
                    <Icon name="close" size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="row row--xtight row--nowrap">
              <input className="input" value={recipientDraft} onChange={(e) => setRecipientDraft(e.target.value)} placeholder={`name@${brand.emailDomain}`} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())} />
              <Button variant="secondary" size="sm" onClick={addRecipient}>Add</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="stack stack--tight">
        <Card title="Choose a template">
          <div className="grid grid--4">
            {REPORT_TEMPLATES.map((t) => (
              <button key={t.id} type="button" className={`tile ${templateId === t.id ? 'is-selected' : ''}`.trim()} onClick={() => { setTemplateId(t.id); setType(t.type); setGroupBy(t.groupBy); }}>
                <span className="tile__preview"><Icon name="spreadsheet" size={20} /></span>
                <span className="small strong">{t.name}</span>
                <span className="micro subtle">{t.description}</span>
                {templateId === t.id && <Badge tone="primary">Selected</Badge>}
              </button>
            ))}
          </div>
        </Card>

        <Card
          title="Report preview"
          action={<Button variant="primary" icon="check" disabled={!name.trim()} onClick={() => { onSave({ name: name.trim(), type, format, mode, frequency, recipients, templateId }); notify(`Report “${name.trim()}” saved.`, 'success'); setName(''); }}>Save report</Button>}
        >
          <div className="stack">
            <div>
              <h3>{name.trim() || template.name}</h3>
              <p className="micro subtle">
                {range} · Grouped by {groupBy} · {template.name} · {format}
                {mode === 'recurring' ? ` · ${frequency}` : ' · On demand'}
              </p>
            </div>

            <div className="grid grid--4">
              <Kpi label="Total cases" value={formatNumber(kpis.total)} />
              <Kpi label="Represented" value={formatNumber(kpis.represented)} />
              <Kpi label="Win rate" value={formatPercent(kpis.winRate, 0)} />
              <Kpi label="Disputed amount" value={formatCompactCurrency(kpis.openValue)} />
            </div>

            <div className="grid grid--2">
              <div>
                <span className="t-section-label">Cases by period</span>
                <BarChart
                  data={byPeriod}
                  height={220}
                  xLabel="Week"
                  yLabel="Cases"
                  series={[{ key: 'completed', name: 'Completed' }, { key: 'represented', name: 'Represented' }, { key: 'open', name: 'Open' }]}
                />
              </div>
              <div>
                <span className="t-section-label">By reason code</span>
                <Donut data={donut.slices} centreValue={formatNumber(donut.total)} centreLabel={brand.schemes[0].label} size={170} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function CustomReports() {
  const { notify } = useToast();
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState(SAVED_REPORTS);
  const [search, setSearch] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [criteria, setCriteria] = useState({ name: '', type: '', createdBy: '', format: '', minRows: '', maxRows: '' });

  const scheduled = reports.filter((r) => r.schedule?.mode === 'recurring');
  const source = tab === 'scheduled' ? scheduled : reports;

  const filtered = source.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (criteria.name && !r.name.toLowerCase().includes(criteria.name.toLowerCase())) return false;
    if (criteria.type && r.type !== criteria.type) return false;
    if (criteria.createdBy && !r.createdBy.includes(criteria.createdBy)) return false;
    if (criteria.format && r.format !== criteria.format) return false;
    if (criteria.minRows && r.rowCount < Number(criteria.minRows)) return false;
    if (criteria.maxRows && r.rowCount > Number(criteria.maxRows)) return false;
    return true;
  });

  const columns = [
    { key: 'name', header: 'Name', fw: 14, cell: (r) => <span className="small strong">{r.name}</span> },
    { key: 'type', header: 'Type', fw: 8, cell: (r) => <span className="small" style={{ color: 'var(--c-primary)', fontWeight: 600 }}>{r.type}</span> },
    { key: 'dateCreated', header: 'Date created', fw: 8, cell: (r) => <span className="small">{formatDate(r.dateCreated)}</span> },
    { key: 'createdBy', header: 'Created by', fw: 11, cell: (r) => <TruncatedText value={r.createdBy} className="small mono" /> },
    { key: 'rowCount', header: 'Row count', fw: 6, align: 'right', cell: (r) => <span className="mono small">{formatNumber(r.rowCount)}</span> },
    { key: 'fileSize', header: 'File size', fw: 6, align: 'right', cell: (r) => <span className="mono small">{r.fileSize}</span> },
    ...(tab === 'scheduled' ? [
      { key: 'frequency', header: 'Frequency', fw: 7, cell: (r) => <Badge tone="info">{r.schedule.frequency}</Badge> },
      { key: 'recipients', header: 'Recipients', fw: 12, cell: (r) => <TruncatedText value={r.schedule.recipients.join(', ')} className="micro subtle" /> },
    ] : []),
    {
      key: 'actions', header: 'Actions', fw: 7, width: '86px',
      cell: (r) => (
        <div className="row row--xtight row--nowrap">
          <IconButton icon="play" label="Run now" size={13} onClick={() => notify(`“${r.name}” queued.`, 'success')} />
          <IconButton icon="download" label="Download" size={13} onClick={() => notify('Download started.')} />
          <IconButton icon="trash" label="Delete" tone="danger" size={13} onClick={() => { setReports((p) => p.filter((x) => x.id !== r.id)); notify('Report deleted.', 'success'); }} />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Custom reports"
        description="Build a report from the live book, preview it, and schedule delivery. Scheduling lives in the builder rather than on its own page."
        actions={tab !== 'builder' && <Button variant="primary" icon="plus" onClick={() => setTab('builder')}>Report Builder</Button>}
      />

      <div className="stack stack--tight">
        <Card bodyClassName="card__body--flush">
          <div style={{ padding: '0 var(--s-4)' }}>
            <Tabs
              tabs={TABS.map((t) => ({ ...t, badge: t.value === 'reports' ? reports.length : t.value === 'scheduled' ? scheduled.length : undefined }))}
              value={tab}
              onChange={setTab}
            />
          </div>
        </Card>

        {tab === 'builder' ? (
          <ReportBuilder onSave={(r) => {
            setReports((p) => [...p, {
              ...r, id: `rep${p.length + 1}`, dateCreated: new Date().toISOString(), createdBy: 'you',
              rowCount: CASES.length, fileSize: '—',
              schedule: r.mode === 'recurring' ? { mode: 'recurring', frequency: r.frequency, recipients: r.recipients } : { mode: 'on_demand' },
            }]);
            setTab('reports');
          }} />
        ) : (
          <Card bodyClassName="card__body--flush">
            <Toolbar>
              <SearchBar value={search} onChange={setSearch} placeholder="Search reports…" onAdvanced={() => setAdvanced(true)} advancedCount={Object.values(criteria).filter(Boolean).length} />
              <ExportButtons columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} name="reports" onCopied={(ok) => notify(ok ? 'Copied.' : 'Clipboard blocked.', ok ? 'success' : 'danger')} />
            </Toolbar>
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              empty={<EmptyState icon="spreadsheet" title={tab === 'scheduled' ? 'No scheduled reports' : 'No reports yet'} hint="Build a report and set a recurring schedule to see it here." action={<Button variant="primary" onClick={() => setTab('builder')}>Open report builder</Button>} />}
            />
          </Card>
        )}
      </div>

      <AdvancedSearchModal open={advanced} onClose={() => setAdvanced(false)} value={criteria} onChange={setCriteria} />
    </>
  );
}

export default CustomReports;
