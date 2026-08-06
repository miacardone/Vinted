import { detailSectionsFor } from '@/domain/caseTypes';
import { formatDate, formatMoney } from '@/utils/format';

/**
 * Left column of Work case.
 *
 * The section list comes from the domain layer rather than being hard-coded
 * here, which is how a chargeback ends up showing its card leg AND its
 * marketplace context while a claim shows only the latter — without this
 * component knowing anything about reason codes.
 */

function FieldValue({ field }) {
  if (field.value == null || field.value === '') return <span className="faint">—</span>;

  switch (field.format) {
    case 'money':
      return <span className="mono">{formatMoney(field.value)}</span>;
    case 'date':
      return <span className="mono">{formatDate(field.value)}</span>;
    case 'rating':
      return <span className="mono">{Number(field.value).toFixed(1)} / 5.0</span>;
    default:
      return <span className={field.mono ? 'mono' : undefined}>{field.value}</span>;
  }
}

export function CaseDetails({ caseRecord }) {
  const sections = detailSectionsFor(caseRecord);

  return (
    <div className="stack stack--tight">
      {sections.map((section) => (
        <section key={section.id}>
          <h3 className="detail-section__title">{section.title}</h3>
          <div className="detail-list">
            {section.fields.map((field) => (
              <div key={field.label} className="detail-row">
                <span className="detail-row__label">{field.label}</span>
                <span className="detail-row__value">
                  <FieldValue field={field} />
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default CaseDetails;
