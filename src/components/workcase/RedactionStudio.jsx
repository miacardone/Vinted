import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge, Button, EmptyState, IconButton } from '@/components/ui/Surface';
import { SelectField, TextField } from '@/components/ui/Form';
import { Tooltip } from '@/components/ui/Overlay';
import Icon from '@/components/ui/Icon';
import { REDACTION_REASONS, getRedactionReason } from '@/data/dispute-packet';
import { CURRENT_USER } from '@/data/people';

/**
 * REDACTION STUDIO
 * ================
 * Draw regions over a pasted screenshot, then destroy the pixels underneath.
 *
 * THE ONE THING THAT MATTERS HERE: the redaction is applied to the PIXEL DATA
 * and the source image is dropped. It is not a black <div> sitting on top of
 * an intact picture, and it is not a CSS filter. Both of those are the classic
 * redaction failure — the exhibit leaves the building with the original still
 * inside it, recoverable by anyone who opens the file in an editor or reads
 * the DOM. Everything below composites onto a canvas at the image's own
 * resolution and exports a flattened PNG; the input image is never attached to
 * the packet.
 *
 * REGIONS ARE STORED NORMALISED (0-1), not in screen pixels, so a region drawn
 * on a scaled-down preview lands in exactly the right place on a 4K source and
 * survives the window being resized mid-edit.
 *
 * PIXELATION IS OFFERED BUT NOT THE DEFAULT, and the UI says why: a mosaic
 * preserves the structure of what it covers and has been reversed on short,
 * predictable strings — which is exactly what a staff ID or a name is. Solid
 * fill removes the information outright, so that is what a name gets.
 */

const MIN_REGION = 0.004; // ~0.4% of a side — below this it was a stray click.

const MODES = [
  { id: 'solid', label: 'Solid box', icon: 'lock', hint: 'Fills the region with flat black. The information is gone — this is the safe default for names, IDs and addresses.' },
  { id: 'pixelate', label: 'Pixelate', icon: 'grid', hint: 'Averages the region into blocks. Use for context you want readable as "something was here" — not for short strings like a staff ID, where the structure that survives can be enough to guess it back.' },
];

/** Reads any File/Blob into a data URL so the canvas is never tainted. */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/* ------------------------------------------------------------------ *
 * The destructive step
 * ------------------------------------------------------------------ */

/**
 * Burns `regions` into `src` and returns a new PNG data URL.
 *
 * Runs at the image's natural size, so nothing is lost to the preview scale,
 * and returns a NEW data URL — the caller replaces the original reference and
 * lets it be garbage collected.
 */
export async function applyRedactions(src, regions, mode) {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  regions.forEach((r) => {
    const x = Math.round(r.x * canvas.width);
    const y = Math.round(r.y * canvas.height);
    const w = Math.round(r.w * canvas.width);
    const h = Math.round(r.h * canvas.height);
    if (w < 1 || h < 1) return;

    if ((r.mode ?? mode) === 'pixelate') {
      // Downsample the region and blow it back up with smoothing off. The
      // original samples are overwritten in place; there is no copy kept.
      const block = Math.max(6, Math.round(Math.min(w, h) / 6));
      const tiny = document.createElement('canvas');
      tiny.width = Math.max(1, Math.ceil(w / block));
      tiny.height = Math.max(1, Math.ceil(h / block));

      const tctx = tiny.getContext('2d');
      tctx.imageSmoothingEnabled = false;
      tctx.drawImage(canvas, x, y, w, h, 0, 0, tiny.width, tiny.height);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tiny, 0, 0, tiny.width, tiny.height, x, y, w, h);
      ctx.imageSmoothingEnabled = true;
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, w, h);
    }
  });

  return canvas.toDataURL('image/png');
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

export function RedactionStudio({ open, source, onClose, onApply }) {
  const stageRef = useRef(null);
  const imgRef = useRef(null);

  const [regions, setRegions] = useState([]);
  const [mode, setMode] = useState('solid');
  const [reason, setReason] = useState('employee_name');
  const [note, setNote] = useState('');
  const [drag, setDrag] = useState(null);
  const [natural, setNatural] = useState(null);
  const [busy, setBusy] = useState(false);

  // A fresh image means a fresh set of regions — carrying them over would put
  // boxes in meaningless places on a different screenshot.
  useEffect(() => {
    if (open) {
      setRegions([]);
      setDrag(null);
      setNote('');
      setBusy(false);
    }
  }, [open, source?.id]);

  const toNormalised = useCallback((event) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return {
      x: Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1),
    };
  }, []);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const p = toNormalised(e);
    if (!p) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDrag({ from: p, to: p });
  };

  const onPointerMove = (e) => {
    if (!drag) return;
    const p = toNormalised(e);
    if (p) setDrag((d) => ({ ...d, to: p }));
  };

  const onPointerUp = () => {
    if (!drag) return;
    const rect = {
      x: Math.min(drag.from.x, drag.to.x),
      y: Math.min(drag.from.y, drag.to.y),
      w: Math.abs(drag.to.x - drag.from.x),
      h: Math.abs(drag.to.y - drag.from.y),
    };
    setDrag(null);

    if (rect.w < MIN_REGION || rect.h < MIN_REGION) return;

    setRegions((prev) => [
      ...prev,
      {
        id: `r-${prev.length + 1}-${Math.round(rect.x * 1000)}`,
        ...rect,
        mode,
        reasonId: reason,
        note: reason === 'other' ? note.trim() : '',
      },
    ]);
  };

  const preview = drag && {
    x: Math.min(drag.from.x, drag.to.x),
    y: Math.min(drag.from.y, drag.to.y),
    w: Math.abs(drag.to.x - drag.from.x),
    h: Math.abs(drag.to.y - drag.from.y),
  };

  const coverage = useMemo(
    () => Math.min(regions.reduce((s, r) => s + r.w * r.h, 0) * 100, 100),
    [regions],
  );

  const weakOnShortString = regions.some((r) => r.mode === 'pixelate' && ['employee_id', 'employee_name', 'payment_data'].includes(r.reasonId));

  const apply = async () => {
    setBusy(true);
    try {
      const flattened = await applyRedactions(source.dataUrl, regions, mode);
      onApply({
        dataUrl: flattened,
        redactions: regions.map((r) => ({
          id: r.id,
          reasonId: r.reasonId,
          reasonLabel: getRedactionReason(r.reasonId).label,
          retention: getRedactionReason(r.reasonId).retention,
          mode: r.mode,
          note: r.note,
        })),
        audit: {
          by: CURRENT_USER.email,
          at: new Date().toISOString(),
          regionCount: regions.length,
          modes: [...new Set(regions.map((r) => r.mode))],
        },
      });
    } finally {
      setBusy(false);
    }
  };

  if (!source) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Redact screenshot"
      subtitle="Drag on the image to cover anything that must not leave the building. Applying destroys the pixels underneath and discards the original."
      size="xl"
      footer={
        <>
          <span className="micro subtle" style={{ marginRight: 'auto' }}>
            {regions.length === 0
              ? 'Nothing marked yet.'
              : `${regions.length} region${regions.length === 1 ? '' : 's'} · ${coverage.toFixed(1)}% of the image · irreversible once applied`}
          </span>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="lock" disabled={!regions.length || busy} onClick={apply}>
            {busy ? 'Applying…' : `Apply ${regions.length || ''} redaction${regions.length === 1 ? '' : 's'}`}
          </Button>
        </>
      }
    >
      <div className="redact">
        <div className="redact__stage" ref={stageRef}>
          <div
            className="redact__canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            role="application"
            aria-label="Screenshot. Drag to mark a region for redaction."
          >
            <img
              ref={imgRef}
              src={source.dataUrl}
              alt=""
              draggable={false}
              onLoad={(e) => setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
            />

            {regions.map((r, i) => (
              <span
                key={r.id}
                className={`redact__box redact__box--${r.mode}`}
                style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
              >
                <span className="redact__box-tag">{i + 1}</span>
              </span>
            ))}

            {preview && (
              <span
                className="redact__box redact__box--drawing"
                style={{ left: `${preview.x * 100}%`, top: `${preview.y * 100}%`, width: `${preview.w * 100}%`, height: `${preview.h * 100}%` }}
              />
            )}
          </div>

          <p className="micro subtle" style={{ marginTop: 'var(--s-2)' }}>
            {natural ? `Source ${natural.w} × ${natural.h}px — redactions are applied at full resolution, not at preview scale.` : 'Loading image…'}
          </p>
        </div>

        <div className="redact__side stack stack--tight">
          <div className="field">
            <span className="field__label">Treatment</span>
            <div className="seg">
              {MODES.map((m) => (
                <Tooltip key={m.id} label={m.hint} wide>
                  <button
                    type="button"
                    className={`seg__btn ${mode === m.id ? 'is-active' : ''}`.trim()}
                    onClick={() => setMode(m.id)}
                  >
                    <Icon name={m.icon} size={12} /> {m.label}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>

          <SelectField
            label="Reason for the next region"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={REDACTION_REASONS.map((r) => ({ value: r.id, label: r.label }))}
            hint={getRedactionReason(reason).hint}
          />

          {reason === 'other' && (
            <TextField label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What is being covered, and why?" />
          )}

          <div className="divider" />

          <div className="row row--between">
            <span className="t-section-label">Marked regions</span>
            {regions.length > 0 && (
              <button type="button" className="micro" style={{ border: 0, background: 'transparent', color: 'var(--c-danger)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setRegions([])}>
                Clear all
              </button>
            )}
          </div>

          {regions.length === 0 ? (
            <EmptyState icon="image" title="Drag a box on the image" hint="Each region carries its own reason, so the packet can prove what was covered and why." />
          ) : (
            <div className="stack stack--xtight" style={{ maxHeight: 240, overflowY: 'auto' }}>
              {regions.map((r, i) => (
                <div key={r.id} className="row row--between row--nowrap redact__region">
                  <span className="row row--xtight row--nowrap" style={{ minWidth: 0 }}>
                    <span className="redact__region-no">{i + 1}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className="small strong truncate" style={{ display: 'block' }}>{getRedactionReason(r.reasonId).label}</span>
                      <span className="nano subtle">{r.mode === 'solid' ? 'Solid box' : 'Pixelated'} · {getRedactionReason(r.reasonId).retention}</span>
                    </span>
                  </span>
                  <IconButton icon="trash" label="Remove region" tone="danger" size={13} onClick={() => setRegions((p) => p.filter((x) => x.id !== r.id))} />
                </div>
              ))}
            </div>
          )}

          {weakOnShortString && (
            <p className="instruction instruction--warning">
              <span className={'dot dot--warning'} style={{ marginTop: 5 }} />
              <span>
                <span className="instruction__title">Pixelation is weak here.</span>{' '}
                <span className="muted">
                  A name, staff ID or card number is short and predictable, so the block structure that survives pixelation can be enough to recover it. Use a solid box for those regions.
                </span>
              </span>
            </p>
          )}

          <div className="divider" />

          <p className="micro subtle">
            <Icon name="lock" size={11} /> Applying rewrites the image at pixel level and attaches only the flattened copy.
            The original is not stored on the {"case"}, not sent with the packet, and cannot be recovered from the exhibit.
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default RedactionStudio;
