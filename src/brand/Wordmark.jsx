import { useBrand } from '@/brand/BrandProvider';

/**
 * Tenant wordmark: drawn glyph + type, no image asset. Both the glyph and the
 * text inherit currentColor, so the same component works on the dark nav rail
 * and on a white sign-in card without a second variant.
 */

const GLYPHS = {
  tag: (
    <>
      <path d="M11.5 3H20a1 1 0 0 1 1 1v8.5a1 1 0 0 1-.29.7l-8 8a1 1 0 0 1-1.42 0l-8.5-8.5a1 1 0 0 1 0-1.42l8-8a1 1 0 0 1 .71-.28z" />
      <circle cx="16.5" cy="7.5" r="1.6" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3l2.4 6.1L21 11.5l-6.6 2.4L12 21l-2.4-7.1L3 11.5l6.6-2.4z" />
    </>
  ),
};

export function Wordmark({ suffix, inverse = false, size = 20, showText = true }) {
  const brand = useBrand();
  const { text, weight, letterSpacing, glyph } = brand.wordmark;

  return (
    <span className={`wordmark ${inverse ? 'wordmark--inverse' : ''}`.trim()}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className="wordmark__glyph"
      >
        {GLYPHS[glyph] ?? GLYPHS.tag}
      </svg>

      {showText && (
        <span className="wordmark__text" style={{ fontWeight: weight, letterSpacing }}>
          {text}
        </span>
      )}

      {suffix && <span className="wordmark__suffix">{suffix}</span>}
    </span>
  );
}

export default Wordmark;
