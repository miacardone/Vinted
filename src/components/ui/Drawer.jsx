import { useEffect } from 'react';
import Icon from '@/components/ui/Icon';

/** Side panel for secondary detail — used by the rule history drawer. */
export function Drawer({ open, title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer__head">
          <div className="card__head-text">
            <h2>{title}</h2>
            {subtitle && <p className="small muted">{subtitle}</p>}
          </div>
          <button type="button" className="btn btn--ghost btn--sm btn--icon" onClick={onClose} aria-label="Close">
            <Icon name="close" size={15} />
          </button>
        </header>

        <div className="drawer__body">{children}</div>

        {footer && <footer className="modal__foot">{footer}</footer>}
      </aside>
    </div>
  );
}

export default Drawer;
