import { useState, useSyncExternalStore } from 'react';
import Icon from '@/components/ui/Icon';
import { Badge, Button, IconButton } from '@/components/ui/Surface';
import { Tooltip } from '@/components/ui/Overlay';
import { useBrand } from '@/brand/BrandProvider';
import { getCaseDocs } from '@/data/work-case';
import { renderDocToCanvas } from '@/data/doc-raster';
import { addBlocks, getPacket } from '@/data/packet-store';
import { clearMarkup, getMarkup, getVersion, setMarkup, subscribe as subscribeMarkup } from '@/data/doc-markup-store';
import RedactionStudio from '@/components/workcase/RedactionStudio';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/utils/format';

/**
 * Document viewer.
 *
 * DELIBERATE DEPARTURE FROM THE REFERENCE: its demo documents are blurred,
 * because they contain real customer data that had to be redacted. Ours are
 * generated from the case record and are fully legible — a representment
 * letter that cites this case's real reason code, amount, ARN, last-4 and
 * dates. A blurred document teaches a reviewer nothing about the product.
 */

function Letterhead({ brand, title }) {
  return (
    <div className="doc-page__brand">
      <span className="doc-page__logo">
        <img src={brand.logo} alt="" width={16} height={16} style={{ borderRadius: 3 }} />
        {brand.name}
      </span>
      <span className="doc-page__meta">
        {title}<br />
        {brand.legalName}
      </span>
    </div>
  );
}

function RepresentmentLetter({ c, brand }) {
  return (
    <>
      <Letterhead brand={brand} title="REPRESENTMENT" />

      <div className="doc-page__meta" style={{ textAlign: 'left' }}>
        {formatDate(new Date().toISOString())}
      </div>

      <div>
        <div>Chargeback Department</div>
        <div>{c.acquirer ?? 'Issuing Bank'}</div>
        <div>Re: Second Presentment</div>
      </div>

      <p className="doc-page__re">
        RE: Case {c.id} · ARN {c.arn ?? '—'} · {c.networkLabel ?? brand.terms.claimProgramme} {c.reasonCode}
      </p>

      <p>To whom it may concern,</p>

      <p>
        We are responding to the dispute raised under reason code{' '}
        <strong>{c.reasonCode} — {c.reasonLabel}</strong> for the transaction detailed below. We have reviewed
        the cardholder&apos;s claim against our order and delivery records and respectfully submit that the
        transaction was valid and the goods were supplied as described.
      </p>

      <table className="doc-page__table">
        <tbody>
          <tr><td>Transaction amount</td><td>{formatCurrency(c.transactionAmount, c.currency)}</td></tr>
          <tr><td>Disputed amount</td><td>{formatCurrency(c.disputeAmount, c.currency)}</td></tr>
          <tr><td>Transaction date</td><td>{formatDate(c.transDate)}</td></tr>
          <tr><td>Card number</td><td>{c.pan ?? `•••• ${c.ccLast4}`}</td></tr>
          <tr><td>Cardholder</td><td>{c.cardholder ?? c.buyer}</td></tr>
          <tr><td>Merchant ID</td><td>{c.mid}</td></tr>
          <tr><td>Order reference</td><td>{c.orderId}</td></tr>
          <tr><td>Item</td><td>{c.itemTitle}</td></tr>
          <tr><td>Despatched via</td><td>{c.carrier} · {c.tracking}</td></tr>
        </tbody>
      </table>

      <p>
        The item was listed as &ldquo;{c.itemTitle}&rdquo; in {c.itemCategory}, described in{' '}
        {c.itemCondition.toLowerCase()} condition, and despatched to the address on file. Carrier records
        confirm the consignment was scanned and delivered. The listing description, photographs and the
        accepted terms of sale are enclosed with this response.
      </p>

      <p>
        On the basis of the evidence supplied we ask that the chargeback be reversed in full and the funds
        returned to the merchant.
      </p>

      <div className="doc-page__sig">
        <div>Yours faithfully,</div>
        <div style={{ marginTop: 14, fontWeight: 700 }}>Disputes Team</div>
        <div>{brand.legalName}</div>
        <div className="doc-page__meta" style={{ textAlign: 'left' }}>{brand.supportEmail}</div>
      </div>
    </>
  );
}

function SalesReceipt({ c, brand }) {
  return (
    <>
      <Letterhead brand={brand} title="SALES RECEIPT" />
      <p className="doc-page__re">Order {c.orderId}</p>
      <table className="doc-page__table">
        <tbody>
          <tr><td>Order placed</td><td>{formatDate(c.orderPlacedAt)}</td></tr>
          <tr><td>{brand.terms.buyer}</td><td>{c.buyer}</td></tr>
          <tr><td>{brand.terms.seller}</td><td>{c.seller}</td></tr>
          <tr><td>Item</td><td>{c.itemTitle}</td></tr>
          <tr><td>Condition</td><td>{c.itemCondition}</td></tr>
          <tr><td>Item price</td><td>{formatCurrency(c.itemPrice, c.currency)}</td></tr>
          <tr><td>Postage</td><td>{formatCurrency(c.shipping, c.currency)}</td></tr>
          <tr><td><strong>Total paid</strong></td><td><strong>{formatCurrency(c.caseAmount, c.currency)}</strong></td></tr>
          <tr><td>Payment method</td><td>{c.paymentMethod}</td></tr>
          <tr><td>Entity</td><td>{c.entityLabel}</td></tr>
        </tbody>
      </table>
      <p>Payment captured in full. No refund has been issued against this order.</p>
      <div className="doc-page__sig doc-page__meta" style={{ textAlign: 'left' }}>
        Receipt generated for dispute {c.id}
      </div>
    </>
  );
}

function IssuerMemo({ c, brand }) {
  return (
    <>
      <Letterhead brand={brand} title="ISSUER MEMO" />
      <p className="doc-page__re">Cardholder dispute · {c.reasonCode}</p>
      <p>
        The cardholder contacted us on {formatDate(c.dateCreated)} regarding a charge of{' '}
        {formatCurrency(c.disputeAmount, c.currency)} dated {formatDate(c.transDate)}.
      </p>
      <p>
        They state: &ldquo;{c.reasonLabel}&rdquo;. The cardholder confirms the card ending {c.ccLast4} was in
        their possession at the time of the transaction.
      </p>
      <table className="doc-page__table">
        <tbody>
          <tr><td>Acquirer case</td><td>{c.acquirerCaseNumber ?? '—'}</td></tr>
          <tr><td>Dispute cycle</td><td>{c.cycleLabel ?? '—'}</td></tr>
          <tr><td>Response due</td><td>{formatDate(c.networkDueDate)}</td></tr>
        </tbody>
      </table>
      <p>Supporting documentation from the cardholder is attached.</p>
    </>
  );
}

function GenericDoc({ c, brand, title }) {
  return (
    <>
      <Letterhead brand={brand} title={title.toUpperCase()} />
      <p className="doc-page__re">{title} · Case {c.id}</p>
      <table className="doc-page__table">
        <tbody>
          <tr><td>Order</td><td>{c.orderId}</td></tr>
          <tr><td>Item</td><td>{c.itemTitle}</td></tr>
          <tr><td>{brand.terms.buyer}</td><td>{c.buyer}</td></tr>
          <tr><td>{brand.terms.seller}</td><td>{c.seller}</td></tr>
          <tr><td>Carrier</td><td>{c.carrier}</td></tr>
          <tr><td>Tracking</td><td>{c.tracking}</td></tr>
          <tr><td>Amount</td><td>{formatCurrency(c.disputeAmount, c.currency)}</td></tr>
        </tbody>
      </table>
      <p>
        This document was supplied in support of case {c.id} and forms part of the evidence package for
        reason code {c.reasonCode}.
      </p>
    </>
  );
}

function DocPage({ doc, c, brand, thumb = false }) {
  const body = doc.kind === 'representment_letter' ? <RepresentmentLetter c={c} brand={brand} />
    : doc.kind === 'sales_receipt' ? <SalesReceipt c={c} brand={brand} />
      : doc.kind === 'issuer_memo' || doc.kind === 'cardholder_statement' ? <IssuerMemo c={c} brand={brand} />
        : <GenericDoc c={c} brand={brand} title={doc.title} />;

  return <div className={`doc-page ${thumb ? 'doc-page--thumb' : ''}`.trim()}>{body}</div>;
}

export function DocViewer({ c, side }) {
  const brand = useBrand();
  const { notify } = useToast();
  const docs = getCaseDocs(c.id)[side] ?? [];

  const [index, setIndex] = useState(0);
  const [layout, setLayout] = useState('single');
  const [zoom, setZoom] = useState(100);
  const [studio, setStudio] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // Re-render when any document on this case gains or loses its markup.
  useSyncExternalStore(subscribeMarkup, getVersion);

  /**
   * Redacting a case document means rasterising it first — see doc-raster.js.
   * Boxes drawn over rendered HTML would leave every word in the DOM, which is
   * the failure the studio exists to prevent.
   */
  const openRedaction = (doc) => {
    const existing = getMarkup(c.id, doc.id);
    setStudio({
      id: `doc-${doc.id}`,
      docId: doc.id,
      title: doc.title,
      // Re-opening works from the ALREADY-MARKED copy, never the source.
      // Starting again from the original would silently resurrect pixels the
      // analyst removed on the previous pass.
      dataUrl: existing?.dataUrl ?? renderDocToCanvas(doc, c),
    });
  };

  const safeIndex = Math.min(index, Math.max(docs.length - 1, 0));
  const active = docs[safeIndex];
  const markup = active ? getMarkup(c.id, active.id) : null;

  if (!docs.length) {
    return <div className="doc-stage"><p className="small muted">No documents on this side of the case.</p></div>;
  }

  return (
    <div>
      <div className="doc-toolbar">
        <div className="seg" role="group" aria-label="Layout">
          <Tooltip label="Single page">
            <button type="button" className={`seg__btn ${layout === 'single' ? 'is-active' : ''}`.trim()} onClick={() => setLayout('single')}>
              <Icon name="single" size={12} /> Single
            </button>
          </Tooltip>
          <Tooltip label="Grid of all pages">
            <button type="button" className={`seg__btn ${layout === 'grid' ? 'is-active' : ''}`.trim()} onClick={() => setLayout('grid')}>
              <Icon name="grid" size={12} /> Grid
            </button>
          </Tooltip>
        </div>

        {layout === 'single' && (
          <div className="row row--xtight row--nowrap">
            <IconButton icon="chevronsLeft" label="Previous page" disabled={safeIndex === 0} onClick={() => setIndex(safeIndex - 1)} />
            <span className="micro mono nowrap">Page {safeIndex + 1} of {docs.length}</span>
            <IconButton icon="chevronsRight" label="Next page" disabled={safeIndex >= docs.length - 1} onClick={() => setIndex(safeIndex + 1)} />
          </div>
        )}

        <div className="row row--xtight row--nowrap">
          <IconButton icon="zoomOut" label="Zoom out" disabled={zoom <= 60} onClick={() => setZoom((z) => z - 20)} />
          <span className="micro mono" style={{ width: 34, textAlign: 'center' }}>{zoom}%</span>
          <IconButton icon="zoomIn" label="Zoom in" disabled={zoom >= 160} onClick={() => setZoom((z) => z + 20)} />
        </div>
      </div>

      <div className="doc-header-strip">
        <span>{active.title} · Page {safeIndex + 1}</span>
        <span>{brand.name} · Document viewer</span>
      </div>

      {markup && (
        <div className="doc-marked-bar">
          <span className="row row--xtight">
            <Badge tone="success" dot>Marked up</Badge>
            <span className="micro subtle">
              {markup.redactions.length
                ? `${markup.redactions.length} redaction${markup.redactions.length === 1 ? '' : 's'} burned in`
                : 'Annotated'} · {markup.audit.by}
            </span>
          </span>
          <span className="row row--xtight">
            <Button variant="ghost" size="sm" onClick={() => setShowOriginal((v) => !v)}>
              {showOriginal ? 'Show marked-up' : 'Show original'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon="trash"
              onClick={() => { clearMarkup(c.id, active.id); setShowOriginal(false); notify('Markup discarded. The exhibit already in the packet is unaffected.', 'success'); }}
            >
              Discard
            </Button>
          </span>
        </div>
      )}

      <div className={`doc-stage ${layout === 'grid' ? 'doc-stage--grid' : ''}`.trim()}>
        {layout === 'single' ? (
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="doc-page-wrap">
              {markup && !showOriginal
                ? <img className="doc-page doc-page--image" src={markup.dataUrl} alt={`${active.title}, marked up`} />
                : <DocPage doc={active} c={c} brand={brand} />}
              {/* Markup opens from the document itself, where the thing you
                  want to mark actually is — not from a toolbar above it. */}
              <Tooltip label="Mark up this document — black out, highlight, draw, annotate" wide>
                <button type="button" className="doc-markup-btn" onClick={() => openRedaction(active)} aria-label="Mark up this document">
                  <Icon name="edit" size={15} />
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
          docs.map((d, i) => (
            <button key={d.id} type="button" className="doc-tile" onClick={() => { setIndex(i); setLayout('single'); }}>
              <span className="doc-thumb__frame">
                <DocPage doc={d} c={c} brand={brand} thumb />
              </span>
              <span className="doc-thumb__label">{d.title}</span>
            </button>
          ))
        )}
      </div>

      <RedactionStudio
        open={Boolean(studio)}
        source={studio}
        onClose={() => setStudio(null)}
        onApply={(result) => {
          const previous = getMarkup(c.id, studio.docId);
          // Redactions accumulate across passes; the audit must list them all.
          const redactions = [...(previous?.redactions ?? []), ...result.redactions];

          // The viewer now shows this copy — applying has to be visible where
          // the analyst was looking, not only inside the packet behind a tab.
          setMarkup(c.id, studio.docId, { dataUrl: result.dataUrl, redactions, audit: result.audit });
          setShowOriginal(false);

          getPacket(c);
          addBlocks(c.id, [{
            id: `rd-${Date.now()}`,
            kind: 'screenshot',
            title: `${studio.title} (marked up)`,
            dataUrl: result.dataUrl,
            included: true,
            redactions,
            audit: result.audit,
          }]);
          setStudio(null);

          const parts = [
            result.redactions.length ? `${result.redactions.length} redaction${result.redactions.length === 1 ? '' : 's'} burned in` : null,
            result.audit.annotationCount ? `${result.audit.annotationCount} annotation${result.audit.annotationCount === 1 ? '' : 's'}` : null,
          ].filter(Boolean).join(' · ');
          notify(`${parts || 'Markup applied'} — the document now shows the marked-up copy.`, 'success');
        }}
      />

      {layout === 'single' && (
        <div className="doc-thumbs">
          {docs.map((d, i) => (
            <button
              key={d.id}
              type="button"
              className={`doc-thumb ${i === safeIndex ? 'is-active' : ''}`.trim()}
              onClick={() => setIndex(i)}
              aria-label={`${d.title}, page ${i + 1}`}
            >
              <span className="doc-thumb__frame">
                <DocPage doc={d} c={c} brand={brand} thumb />
              </span>
              <span className="doc-thumb__label">{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocViewer;
