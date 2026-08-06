import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Tabs from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Select, Textarea, TextInput } from '@/components/ui/Field';
import { AsyncBoundary, EmptyState, SkeletonRows } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { deleteReport, listReports, previewReport, runReport, saveReport } from '@/services/reports.service';
import { REPORT_FIELDS, REPORT_FIELD_CATEGORIES, REPORT_TEMPLATES } from '@/data/reports.seed';
import { formatDate, formatDateTime, formatMoney, formatNumber, titleCase } from '@/utils/format';

const TABS = [
  { id: 'reports', label: 'Reports' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'builder', label: 'Report builder' },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const scheduleSummary = (schedule) => {
  if (!schedule || schedule.mode === 'on_demand') return 'On demand';
  const base = titleCase(schedule.frequency ?? '');
  const time = schedule.hour != null ? ` at ${String(schedule.hour).padStart(2, '0')}:00` : '';
  return `${base}${time}`;
};

/** Formats a preview cell using the field's declared format. */
function PreviewCell({ fieldId, value }) {
  const field = REPORT_FIELDS.find((f) => f.id === fieldId);
  if (value == null || value === '') return <span className="faint">—</span>;

  if (field?.format === 'money') return <span className="mono">{formatMoney(value)}</span>;
  if (field?.format === 'date') return <span className="mono">{formatDate(value)}</span>;
  return <span className={field?.mono ? 'mono' : undefined}>{String(value)}</span>;
}

function ReportBuilder({ onSaved }) {
  const { notify } = useToast();

  const [templateId, setTemplateId] = useState(REPORT_TEMPLATES[0].id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState(REPORT_TEMPLATES[0].fields);
  const [mode, setMode] = useState('on_demand');
  const [frequency, setFrequency] = useState('weekly');
  const [hour, setHour] = useState(8);
  const [recipients, setRecipients] = useState('');
  const [format, setFormat] = useState('csv');
  const [saving, setSaving] = useState(false);

  // Picking a template replaces the field selection — that is the point of a
  // template. Any manual edits after that are preserved until another is picked.
  const applyTemplate = (id) => {
    const template = REPORT_TEMPLATES.find((t) => t.id === id);
    setTemplateId(id);
    if (template) setFields(template.fields);
  };

  // useAsync already re-runs when `fields` changes — an extra effect here would
  // fire a second, identical request on every edit.
  const { data: preview, status: previewStatus } = useAsync(
    () => previewReport({ fields, limit: 6 }),
    [fields],
  );

  const toggleField = (fieldId) =>
    setFields((current) =>
      current.includes(fieldId) ? current.filter((f) => f !== fieldId) : [...current, fieldId],
    );

  const save = async () => {
    setSaving(true);
    try {
      const report = {
        name: name.trim(),
        description: description.trim(),
        templateId,
        fields,
        schedule:
          mode === 'on_demand'
            ? { mode: 'on_demand' }
            : {
                mode: 'recurring',
                frequency,
                hour: Number(hour),
                recipients: recipients
                  .split(',')
                  .map((r) => r.trim())
                  .filter(Boolean),
                format,
              },
      };
      await saveReport(report);
      notify(`Report “${report.name}” saved.`, 'success');
      setName('');
      setDescription('');
      onSaved?.();
    } catch (err) {
      notify(err.message ?? 'Could not save the report.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', alignItems: 'start' }}>
      <div className="stack">
        <Card>
          <CardHead title="Configuration" />
          <CardBody>
            <div className="stack">
              <TextInput
                label="Report name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Weekly counterfeit review"
              />
              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Schedule" subtitle="Scheduling lives here rather than on a separate page." />
          <CardBody>
            <div className="stack">
              <div className="row row--tight">
                <button
                  type="button"
                  className={`tile ${mode === 'on_demand' ? 'is-selected' : ''}`.trim()}
                  style={{ flex: 1 }}
                  onClick={() => setMode('on_demand')}
                >
                  <Icon name="play" size={16} style={{ color: 'var(--c-primary)' }} />
                  <span className="tile__title">On demand</span>
                  <span className="tile__body">Run it yourself when you need it.</span>
                </button>
                <button
                  type="button"
                  className={`tile ${mode === 'recurring' ? 'is-selected' : ''}`.trim()}
                  style={{ flex: 1 }}
                  onClick={() => setMode('recurring')}
                >
                  <Icon name="calendar" size={16} style={{ color: 'var(--c-primary)' }} />
                  <span className="tile__title">Recurring</span>
                  <span className="tile__body">Delivered on a schedule.</span>
                </button>
              </div>

              {mode === 'recurring' && (
                <>
                  <Select
                    label="Frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    options={FREQUENCIES}
                  />
                  <TextInput
                    label="Hour (24h)"
                    type="number"
                    min="0"
                    max="23"
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                  />
                  <TextInput
                    label="Recipients"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="ops@example.com, risk@example.com"
                    hint="Comma separated."
                  />
                  <Select
                    label="Format"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    options={[
                      { value: 'csv', label: 'CSV' },
                      { value: 'xlsx', label: 'Excel' },
                      { value: 'json', label: 'JSON' },
                    ]}
                  />
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="stack">
        <Card>
          <CardHead title="Start from a template" subtitle="Templates set the field selection; edit it afterwards." />
          <CardBody>
            <div className="tile-grid">
              {REPORT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`tile ${templateId === template.id ? 'is-selected' : ''}`.trim()}
                  onClick={() => applyTemplate(template.id)}
                >
                  <Icon name={template.icon} size={18} style={{ color: 'var(--c-primary)' }} />
                  <span className="tile__title">{template.name}</span>
                  <span className="tile__body">{template.description}</span>
                  <span className="micro faint">{template.fields.length} fields</span>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 300px) minmax(0, 1fr)', alignItems: 'start' }}>
          <Card>
            <CardHead title="Fields" subtitle={`${fields.length} selected`} />
            <CardBody flush>
              <div className="picker">
                {REPORT_FIELD_CATEGORIES.map((category) => (
                  <div key={category}>
                    <div className="picker__group-label">{category}</div>
                    {REPORT_FIELDS.filter((f) => f.category === category).map((field) => (
                      <label key={field.id} className="picker__option">
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={fields.includes(field.id)}
                          onChange={() => toggleField(field.id)}
                        />
                        {field.label}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHead
              title="Live preview"
              subtitle={preview ? `First rows of ${formatNumber(preview.total)} cases` : 'Building preview…'}
            />
            {fields.length === 0 ? (
              <EmptyState icon="chart" title="No fields selected" body="Pick at least one field to preview the output." />
            ) : previewStatus === 'loading' ? (
              <SkeletonRows rows={5} />
            ) : (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      {fields.map((fieldId) => (
                        <th key={fieldId}>{REPORT_FIELDS.find((f) => f.id === fieldId)?.label ?? fieldId}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(preview?.rows ?? []).map((row, i) => (
                      <tr key={i}>
                        {fields.map((fieldId) => (
                          <td key={fieldId} className="small nowrap">
                            <PreviewCell fieldId={fieldId} value={row[fieldId]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <footer className="card__foot">
              <span className="small muted">
                {mode === 'on_demand' ? 'Runs on demand' : `Runs ${frequency} at ${String(hour).padStart(2, '0')}:00`}
              </span>
              <span className="spacer" />
              <Button variant="primary" icon="check" onClick={save} disabled={!name.trim() || !fields.length || saving}>
                {saving ? 'Saving…' : 'Save report'}
              </Button>
            </footer>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function CustomReports() {
  const { notify } = useToast();
  const [tab, setTab] = useState('reports');
  const { data: reports, status, error, run } = useAsync(listReports, []);

  const scheduled = useMemo(
    () => (reports ?? []).filter((r) => r.schedule?.mode === 'recurring'),
    [reports],
  );

  const doRun = async (report) => {
    try {
      await runReport(report.id);
      notify(`“${report.name}” ran successfully.`, 'success');
      await run();
    } catch (err) {
      notify(err.message ?? 'Could not run the report.', 'danger');
    }
  };

  const doDelete = async (report) => {
    try {
      await deleteReport(report.id);
      notify(`“${report.name}” deleted.`, 'success');
      await run();
    } catch (err) {
      notify(err.message ?? 'Could not delete the report.', 'danger');
    }
  };

  return (
    <>
      <PageHeader
        title="Custom reports"
        subtitle="Build a report from any field on the case record, preview it against the live book, and schedule delivery."
        actions={
          tab !== 'builder' && (
            <Button variant="primary" icon="plus" onClick={() => setTab('builder')}>
              New report
            </Button>
          )
        }
      />

      <div className="stack">
        <Card>
          <CardBody tight>
            <Tabs
              tabs={TABS.map((t) =>
                t.id === 'reports'
                  ? { ...t, count: reports?.length }
                  : t.id === 'scheduled'
                    ? { ...t, count: scheduled.length }
                    : t,
              )}
              active={tab}
              onChange={setTab}
            />
          </CardBody>
        </Card>

        {tab === 'builder' ? (
          <ReportBuilder
            onSaved={async () => {
              await run();
              setTab('reports');
            }}
          />
        ) : (
          <Card>
            <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={5} />}>
              {(() => {
                const rows = tab === 'scheduled' ? scheduled : reports ?? [];

                if (!rows.length) {
                  return (
                    <EmptyState
                      icon="chart"
                      title={tab === 'scheduled' ? 'No scheduled reports' : 'No saved reports'}
                      body={
                        tab === 'scheduled'
                          ? 'Set a recurring schedule in the report builder and it will appear here.'
                          : 'Build a report to save it for reuse.'
                      }
                      action={{ label: 'Open report builder', icon: 'plus', onClick: () => setTab('builder') }}
                    />
                  );
                }

                return (
                  <div className="table-wrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Report</th>
                          <th>Created by</th>
                          <th className="tbl__right">Fields</th>
                          <th>Schedule</th>
                          {tab === 'scheduled' && <th>Recipients</th>}
                          <th className="tbl__right">Last run</th>
                          <th style={{ width: 110 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((report) => (
                          <tr key={report.id}>
                            <td>
                              <span className="stack" style={{ gap: 1 }}>
                                <span className="strong small">{report.name}</span>
                                <span className="micro faint">{report.description}</span>
                              </span>
                            </td>
                            <td className="small">{report.createdBy}</td>
                            <td className="tbl__right mono small">{report.fields.length}</td>
                            <td>
                              <Badge tone={report.schedule?.mode === 'recurring' ? 'info' : 'muted'}>
                                {scheduleSummary(report.schedule)}
                              </Badge>
                            </td>
                            {tab === 'scheduled' && (
                              <td className="micro faint">{(report.schedule.recipients ?? []).join(', ')}</td>
                            )}
                            <td className="tbl__right micro faint nowrap">
                              {report.lastRunAt ? formatDateTime(report.lastRunAt) : 'Never'}
                            </td>
                            <td>
                              <div className="row row--tight row--nowrap">
                                <Button variant="ghost" size="sm" onClick={() => doRun(report)} aria-label="Run now" title="Run now">
                                  <Icon name="play" size={14} />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => doDelete(report)} aria-label="Delete" title="Delete">
                                  <Icon name="trash" size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </AsyncBoundary>
          </Card>
        )}
      </div>
    </>
  );
}

export default CustomReports;
