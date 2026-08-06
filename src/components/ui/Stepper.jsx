import Icon from '@/components/ui/Icon';

/**
 * Wizard progress. Shared by the add-rule wizard (criteria / action / details)
 * and the bulk-action wizard (criteria / actions / review), so the two feel
 * like the same product rather than two implementations.
 */
export function Stepper({ steps = [], current = 0, onStepClick }) {
  return (
    <div className="stepper">
      {steps.map((step, index) => {
        const state = index === current ? 'is-active' : index < current ? 'is-done' : '';
        const clickable = onStepClick && index < current;

        return (
          <div key={step.id ?? step.label} className="row row--tight row--nowrap">
            <div
              className={`step ${state}`.trim()}
              onClick={clickable ? () => onStepClick(index) : undefined}
              style={clickable ? { cursor: 'pointer' } : undefined}
            >
              <span className="step__dot">
                {index < current ? <Icon name="check" size={13} strokeWidth={2.4} /> : index + 1}
              </span>
              <span className="step__label">{step.label}</span>
            </div>
            {index < steps.length - 1 && <span className="step__line" />}
          </div>
        );
      })}
    </div>
  );
}

export default Stepper;
