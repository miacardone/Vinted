import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { formatBytes, formatDateTime } from '@/utils/format';

const KIND_ICON = { pdf: 'file', image: 'image', transcript: 'message', data: 'code' };

const PROCESSING_TONE = { processed: 'success', pending: 'warning', failed: 'danger' };

/**
 * Document viewer.
 *
 * Renders a representation of the page rather than a real PDF — a demo has no
 * binaries to serve, and a fake page that looks like a page communicates the
 * layout more honestly than a grey box saying "PDF preview".
 */
export function DocumentViewer({ documents = [] }) {
  const [activeId, setActiveId] = useState(documents[0]?.id ?? null);

  if (!documents.length) {
    return <EmptyState icon="file" title="No documents yet" body="Evidence attached to this case will appear here." />;
  }

  const active = documents.find((d) => d.id === activeId) ?? documents[0];

  return (
    <div className="doc-viewer">
      <div className="row row--between">
        <div className="row row--tight" style={{ minWidth: 0 }}>
          <Icon name={KIND_ICON[active.kind] ?? 'file'} size={16} className="muted" />
          <span className="small strong truncate">{active.label}</span>
          <Badge tone={PROCESSING_TONE[active.processing]}>{active.processing}</Badge>
        </div>
        <div className="row row--tight">
          <Button variant="ghost" size="sm" icon="download">
            Download
          </Button>
        </div>
      </div>

      <div className="doc-stage">
        {active.kind === 'image' ? (
          <div className="doc-page" style={{ aspectRatio: '4 / 3', justifyContent: 'center', alignItems: 'center' }}>
            <Icon name="image" size={44} style={{ color: 'var(--c-line-strong)' }} />
            <span className="micro faint">{active.label}</span>
          </div>
        ) : (
          <div className="doc-page">
            <div className="doc-page__line doc-page__line--title" />
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={`doc-page__line ${i % 4 === 3 ? 'doc-page__line--short' : ''}`.trim()} />
            ))}
          </div>
        )}
      </div>

      <div className="row row--between micro faint">
        <span>
          {active.pages} page{active.pages === 1 ? '' : 's'} · {formatBytes(active.sizeKb)}
        </span>
        <span>
          {active.uploadedBy} · {formatDateTime(active.uploadedAt)}
        </span>
      </div>

      <div className="doc-strip">
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            className={`doc-thumb ${doc.id === active.id ? 'is-active' : ''}`.trim()}
            onClick={() => setActiveId(doc.id)}
          >
            <Icon name={KIND_ICON[doc.kind] ?? 'file'} size={14} className="muted" />
            <span className="doc-thumb__label">{doc.label}</span>
            <span className="doc-thumb__meta">{formatBytes(doc.sizeKb)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default DocumentViewer;
