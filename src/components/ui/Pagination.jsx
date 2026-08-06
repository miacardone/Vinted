import Icon from '@/components/ui/Icon';
import { formatNumber } from '@/utils/format';
import { PAGE_SIZES } from '@/utils/constants';

/** Windowed page numbers with ellipses, so 40 pages stay on one row. */
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push('…');
  pages.push(total);

  return pages;
}

export function Pagination({ page, pageSize, total, totalPages, onPageChange, onPageSizeChange }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="pagination">
      <span>
        Showing <strong className="mono">{formatNumber(from)}</strong>–
        <strong className="mono">{formatNumber(to)}</strong> of{' '}
        <strong className="mono">{formatNumber(total)}</strong>
      </span>

      {onPageSizeChange && (
        <label className="row row--tight micro">
          <span className="faint">Rows</span>
          <select
            className="select"
            style={{ height: 28, width: 72 }}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="pagination__pages">
        <button
          type="button"
          className="pagination__page"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <Icon name="chevron" size={14} style={{ transform: 'rotate(180deg)' }} />
        </button>

        {pageWindow(page, totalPages).map((entry, i) =>
          entry === '…' ? (
            <span key={`gap-${i}`} className="pagination__page" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              className={`pagination__page ${entry === page ? 'is-active' : ''}`.trim()}
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          className="pagination__page"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <Icon name="chevron" size={14} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
