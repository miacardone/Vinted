import { useBrand } from '@/brand/BrandProvider';

/**
 * Tenant wordmark: the logo comes from a path in brand.config, plus type.
 * The asset is never imported into this component — swapping tenants swaps a
 * string, not a module graph.
 *
 * TWO SHAPES, DELIBERATELY. A tenant that supplies a real logotype
 * (`logoWordmark`) gets it rendered at its own aspect ratio, and the
 * `wordmark.text` is dropped — the asset already spells the name, so drawing
 * both gives "Vinted Vinted Console". Only the product accent stays, which is
 * the correct lockup for a white-label console: the client's mark, our
 * product name.
 *
 * A tenant with no logotype falls back to the square mark plus type, which is
 * what every tenant did before and what PriceLine still does.
 *
 * The logotype is painted as a MASK over `currentColor` rather than dropped
 * into an <img>. The supplied asset is a single flat colour, and it has to
 * read white on the dark nav rail and teal on a light surface; a mask lets one
 * file serve both instead of shipping two colour variants that can drift.
 */
export function Wordmark({ inverse = false, showText = true, size = 26 }) {
  const brand = useBrand();

  if (brand.logoWordmark) {
    return (
      <span className={`wordmark ${inverse ? 'wordmark--inverse' : ''}`.trim()}>
        <span
          className="wordmark__mark"
          role="img"
          aria-label={brand.name}
          style={{
            height: size,
            aspectRatio: brand.logoWordmarkAspect ?? undefined,
            WebkitMaskImage: `url(${brand.logoWordmark})`,
            maskImage: `url(${brand.logoWordmark})`,
          }}
        />
        {showText && <span className="wordmark__accent wordmark__accent--solo">{brand.wordmark.accent}</span>}
      </span>
    );
  }

  return (
    <span className={`wordmark ${inverse ? 'wordmark--inverse' : ''}`.trim()}>
      <img
        src={brand.logo}
        alt=""
        width={size}
        height={size}
        className="wordmark__logo"
        aria-hidden="true"
      />
      {showText && (
        <span className="wordmark__text" style={{ fontWeight: brand.wordmark.weight }}>
          {brand.wordmark.text}
          <span className="wordmark__accent">{brand.wordmark.accent}</span>
        </span>
      )}
    </span>
  );
}

export default Wordmark;
