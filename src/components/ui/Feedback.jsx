import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

export function EmptyState({ icon = 'inbox', title, body, action, children }) {
  return (
    <div className="empty">
      <span className="empty__glyph">
        <Icon name={icon} size={22} />
      </span>
      {title && <h3 className="empty__title">{title}</h3>}
      {body && <p className="empty__body">{body}</p>}
      {action && (
        <Button variant="primary" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}

export function Skeleton({ height = 14, width = '100%', radius, style }) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', height, width, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRows({ rows = 6, height = 34 }) {
  return (
    <div className="stack stack--tight" style={{ padding: 'var(--s-4)' }} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <EmptyState
      icon="alert"
      title="That did not load"
      body={error?.message ?? 'Something went wrong fetching this data.'}
      action={onRetry ? { label: 'Try again', icon: 'refresh', onClick: onRetry } : undefined}
    />
  );
}

/**
 * Standard async wrapper: loading, error, empty, content. Pages use this so the
 * three non-happy states are never quietly skipped.
 */
export function AsyncBoundary({ status, error, onRetry, isEmpty, empty, skeleton, children }) {
  if (status === 'loading') return skeleton ?? <SkeletonRows />;
  if (status === 'error') return <ErrorState error={error} onRetry={onRetry} />;
  if (isEmpty) return empty ?? <EmptyState title="Nothing here yet" body="No records match this view." />;
  return children;
}

export default EmptyState;
