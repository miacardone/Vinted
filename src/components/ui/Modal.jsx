import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/Icon';

/**
 * Modal. Escape closes, the backdrop closes, body scroll is locked while open,
 * and focus moves into the dialog so keyboard users are not left behind it.
 */
export function Modal({ open, title, subtitle, onClose, children, footer, size }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    const previouslyFocused = document.activeElement;
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`modal ${size ? `modal--${size}` : ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal__head">
          <div className="card__head-text">
            <h2>{title}</h2>
            {subtitle && <p className="small muted">{subtitle}</p>}
          </div>
          <button type="button" className="btn btn--ghost btn--sm btn--icon" onClick={onClose} aria-label="Close">
            <Icon name="close" size={15} />
          </button>
        </header>

        <div className="modal__body">{children}</div>

        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}

export default Modal;
