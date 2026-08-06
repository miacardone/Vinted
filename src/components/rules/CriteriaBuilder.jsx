import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Select, TextInput } from '@/components/ui/Field';
import { CRITERIA_FIELDS, FIELD_GROUPS, fieldOptions, getField, operatorsForType } from '@/domain/criteria';

/**
 * Criteria rows shared by the add-rule wizard and the bulk-action wizard.
 *
 * The operator list is derived from the field's type, and the value input
 * switches between a select and a number/text box for the same reason — an
 * operator like "is greater than" makes no sense on an enum, so it is never
 * offered.
 */
export function CriteriaBuilder({ criteria = [], onChange, cases = [], matchType, onMatchTypeChange }) {
  const update = (id, patch) =>
    onChange(criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const add = () =>
    onChange([
      ...criteria,
      { id: `c_${Date.now()}`, fieldId: 'caseType', operator: 'equals', value: 'chargeback' },
    ]);

  const remove = (id) => onChange(criteria.filter((c) => c.id !== id));

  return (
    <div className="stack">
      {onMatchTypeChange && (
        <div className="row row--tight">
          <span className="small muted">Match</span>
          <Select
            value={matchType}
            onChange={(e) => onMatchTypeChange(e.target.value)}
            options={[
              { value: 'all', label: 'all criteria (AND)' },
              { value: 'any', label: 'any criterion (OR)' },
            ]}
          />
        </div>
      )}

      {criteria.length === 0 && (
        <p className="small muted">No criteria yet — a rule with no criteria matches nothing.</p>
      )}

      <div className="stack stack--tight">
        {criteria.map((criterion) => {
          const field = getField(criterion.fieldId);
          const operators = operatorsForType(field?.type ?? 'enum');
          const options = fieldOptions(criterion.fieldId, cases);
          const isEnum = field?.type === 'enum' || field?.type === 'boolean';

          return (
            <div key={criterion.id} className="row row--tight row--nowrap" style={{ alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                <Select
                  label="Field"
                  value={criterion.fieldId}
                  onChange={(e) => {
                    const nextField = getField(e.target.value);
                    const nextOps = operatorsForType(nextField?.type ?? 'enum');
                    update(criterion.id, {
                      fieldId: e.target.value,
                      operator: nextOps[0]?.id ?? 'equals',
                      value: '',
                      value2: undefined,
                    });
                  }}
                >
                  {FIELD_GROUPS.map((group) => (
                    <optgroup key={group} label={group}>
                      {CRITERIA_FIELDS.filter((f) => f.group === group).map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </div>

              <div style={{ flex: '0 1 150px' }}>
                <Select
                  label="Operator"
                  value={criterion.operator}
                  onChange={(e) => update(criterion.id, { operator: e.target.value })}
                  options={operators.map((op) => ({ value: op.id, label: op.label }))}
                />
              </div>

              <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                {isEnum ? (
                  <Select
                    label="Value"
                    value={criterion.value ?? ''}
                    onChange={(e) => update(criterion.id, { value: e.target.value })}
                    placeholder="Select…"
                    options={options}
                  />
                ) : (
                  <TextInput
                    label="Value"
                    type={field?.type === 'number' ? 'number' : 'text'}
                    value={criterion.value ?? ''}
                    onChange={(e) => update(criterion.id, { value: e.target.value })}
                  />
                )}
              </div>

              {criterion.operator === 'between' && (
                <div style={{ flex: '0 1 120px' }}>
                  <TextInput
                    label="And"
                    type="number"
                    value={criterion.value2 ?? ''}
                    onChange={(e) => update(criterion.id, { value2: e.target.value })}
                  />
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(criterion.id)}
                aria-label="Remove criterion"
                style={{ marginBottom: 1 }}
              >
                <Icon name="trash" size={15} />
              </Button>
            </div>
          );
        })}
      </div>

      <div>
        <Button variant="secondary" size="sm" icon="plus" onClick={add}>
          Add criterion
        </Button>
      </div>
    </div>
  );
}

export default CriteriaBuilder;
