import { useId } from 'react';

export function TextInput({ label, hint, error, id: providedId, ...rest }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <input id={id} className="input" {...rest} />
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

/**
 * Accepts either an `options` array or raw children — the criteria builder
 * needs <optgroup> to group fields by category, which a flat array cannot express.
 */
export function Select({ label, options = [], hint, placeholder, id: providedId, children, ...rest }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <select id={id} className="select" {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {children ??
          options.map((opt) => (
            <option key={String(opt.value)} value={opt.value ?? ''}>
              {opt.label}
            </option>
          ))}
      </select>
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function Textarea({ label, hint, id: providedId, ...rest }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <textarea id={id} className="textarea" {...rest} />
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export function Checkbox({ label, description, ...rest }) {
  const id = useId();
  return (
    <label htmlFor={id} className="row row--tight" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
      <input id={id} type="checkbox" className="checkbox" style={{ marginTop: 2 }} {...rest} />
      <span style={{ minWidth: 0 }}>
        <span className="small">{label}</span>
        {description && <span className="micro faint" style={{ display: 'block' }}>{description}</span>}
      </span>
    </label>
  );
}

export function Toggle({ label, description, id: providedId, ...rest }) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  if (!label) return <input id={id} type="checkbox" className="toggle" {...rest} />;

  return (
    <label htmlFor={id} className="row row--between row--nowrap" style={{ cursor: 'pointer', width: '100%' }}>
      <span style={{ minWidth: 0 }}>
        <span className="small strong">{label}</span>
        {description && <span className="micro faint" style={{ display: 'block' }}>{description}</span>}
      </span>
      <input id={id} type="checkbox" className="toggle" {...rest} />
    </label>
  );
}

export default TextInput;
