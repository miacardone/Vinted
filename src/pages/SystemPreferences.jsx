import { useEffect, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Select, TextInput, Toggle } from '@/components/ui/Field';
import { AsyncBoundary, SkeletonRows } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { getSystemPreferences, saveSystemPreferences } from '@/services/system.service';
import { useBrand } from '@/brand/BrandProvider';
import { formatMoney } from '@/utils/format';

export function SystemPreferences() {
  const brand = useBrand();
  const { notify } = useToast();
  const { data, status, error, run } = useAsync(getSystemPreferences, []);

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      await saveSystemPreferences(draft);
      notify('System preferences saved.', 'success');
      await run();
    } catch (err) {
      notify(err.message ?? 'Could not save preferences.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const sampleCaseId = draft
    ? `${draft.numbering.prefix}${draft.numbering.separator}${String(draft.numbering.nextSequence + 1).padStart(
        draft.numbering.digits,
        '0',
      )}`
    : '';

  return (
    <>
      <PageHeader
        title="System preferences"
        subtitle="Numbering, currency, due-date offsets and the thresholds that drive routing and risk."
        actions={
          <Button variant="primary" icon="check" onClick={save} disabled={!draft || saving}>
            {saving ? 'Saving…' : 'Save preferences'}
          </Button>
        }
      />

      <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={6} />}>
        {draft && (
          <div className="stack">
            <div className="grid grid--halves">
              <Card>
                <CardHead title="Case numbering" subtitle="How new case IDs are generated." />
                <CardBody>
                  <div className="stack">
                    <TextInput
                      label="Prefix"
                      value={draft.numbering.prefix}
                      onChange={(e) =>
                        setDraft({ ...draft, numbering: { ...draft.numbering, prefix: e.target.value.toUpperCase() } })
                      }
                    />
                    <TextInput
                      label="Separator"
                      value={draft.numbering.separator}
                      maxLength={1}
                      onChange={(e) =>
                        setDraft({ ...draft, numbering: { ...draft.numbering, separator: e.target.value } })
                      }
                    />
                    <TextInput
                      label="Digits"
                      type="number"
                      min="3"
                      max="10"
                      value={draft.numbering.digits}
                      onChange={(e) =>
                        setDraft({ ...draft, numbering: { ...draft.numbering, digits: Number(e.target.value) } })
                      }
                    />
                    <div className="row row--tight small">
                      <span className="muted">Next case will be</span>
                      <code className="code__inline">{sampleCaseId}</code>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHead title="Currency and locale" />
                <CardBody>
                  <div className="stack">
                    <Select
                      label="Currency"
                      value={draft.currency}
                      onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                      options={[
                        { value: 'EUR', label: 'EUR — Euro' },
                        { value: 'GBP', label: 'GBP — Pound sterling' },
                        { value: 'USD', label: 'USD — US dollar' },
                        { value: 'PLN', label: 'PLN — Polish złoty' },
                      ]}
                    />
                    <Select
                      label="Locale"
                      value={draft.locale}
                      onChange={(e) => setDraft({ ...draft, locale: e.target.value })}
                      options={[
                        { value: 'en-GB', label: 'English (United Kingdom)' },
                        { value: 'en-US', label: 'English (United States)' },
                        { value: 'fr-FR', label: 'French (France)' },
                        { value: 'de-DE', label: 'German (Germany)' },
                        { value: 'lt-LT', label: 'Lithuanian (Lithuania)' },
                      ]}
                    />
                    <TextInput
                      label="Timezone"
                      value={draft.timezone}
                      onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
                    />
                    <p className="micro faint">
                      Changing these here affects new records. The display locale for this session comes from the tenant
                      configuration.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHead
                title="Internal due-date offsets"
                subtitle="Network windows are fixed by the schemes. The internal buffer is ours — it is what analysts actually work to."
              />
              <CardBody>
                <div className="grid grid--thirds">
                  {brand.schemes.map((scheme) => (
                    <TextInput
                      key={scheme.id}
                      label={`${scheme.label} response window (days)`}
                      type="number"
                      min="1"
                      value={draft.dueDateOffsets.schemeDays[scheme.id]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          dueDateOffsets: {
                            ...draft.dueDateOffsets,
                            schemeDays: {
                              ...draft.dueDateOffsets.schemeDays,
                              [scheme.id]: Number(e.target.value),
                            },
                          },
                        })
                      }
                    />
                  ))}

                  <TextInput
                    label={`${brand.terms.claimProgramme} window (days)`}
                    type="number"
                    min="1"
                    value={draft.dueDateOffsets.claimDays}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        dueDateOffsets: { ...draft.dueDateOffsets, claimDays: Number(e.target.value) },
                      })
                    }
                  />

                  <TextInput
                    label="Internal buffer (days)"
                    type="number"
                    min="0"
                    value={draft.dueDateOffsets.internalBufferDays}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        dueDateOffsets: { ...draft.dueDateOffsets, internalBufferDays: Number(e.target.value) },
                      })
                    }
                    hint="Days before the network deadline that a case is due internally."
                  />
                </div>
              </CardBody>
            </Card>

            <div className="grid grid--halves">
              <Card>
                <CardHead title="Amount thresholds" />
                <CardBody>
                  <div className="stack">
                    <TextInput
                      label={`Minimum processing amount (${draft.currency})`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.thresholds.minimumProcessingAmount}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          thresholds: { ...draft.thresholds, minimumProcessingAmount: Number(e.target.value) },
                        })
                      }
                      hint="Below this, defending costs more than the recovery is worth."
                    />
                    <TextInput
                      label={`Risk amount (${draft.currency})`}
                      type="number"
                      min="0"
                      value={draft.thresholds.riskAmount}
                      onChange={(e) =>
                        setDraft({ ...draft, thresholds: { ...draft.thresholds, riskAmount: Number(e.target.value) } })
                      }
                      hint="Cases at or above this are treated as high value for priority and routing."
                    />
                    <p className="micro faint">
                      Currently flagging anything at or above {formatMoney(draft.thresholds.riskAmount, draft.currency)}.
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHead title="Routing" />
                <CardBody>
                  <div className="stack">
                    <Toggle
                      label="Auto-assign on intake"
                      description="Route new cases to an analyst automatically where a rule matches."
                      checked={draft.routing.autoAssign}
                      onChange={(e) =>
                        setDraft({ ...draft, routing: { ...draft.routing, autoAssign: e.target.checked } })
                      }
                    />

                    <TextInput
                      label={`High-value routing threshold (${draft.currency})`}
                      type="number"
                      min="0"
                      value={draft.routing.highValue}
                      onChange={(e) =>
                        setDraft({ ...draft, routing: { ...draft.routing, highValue: Number(e.target.value) } })
                      }
                      hint="Above this, cases route to a senior queue regardless of reason code."
                    />

                    <TextInput
                      label="Bulk action batch size"
                      type="number"
                      min="1"
                      max="500"
                      value={draft.routing.bulkBatchSize}
                      onChange={(e) =>
                        setDraft({ ...draft, routing: { ...draft.routing, bulkBatchSize: Number(e.target.value) } })
                      }
                      hint="How many cases a bulk action applies to per batch."
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}

export default SystemPreferences;
