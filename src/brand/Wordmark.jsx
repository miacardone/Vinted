import { useBrand } from '@/brand/BrandProvider';

/**
 * Tenant wordmark: the logo comes from a path in brand.config, plus type.
 * The asset is never imported into this component — swapping tenants swaps a
 * string, not a module graph.
 *
 * TWO SHAPES, DELIBERATELY. A tenant that supplies a real logotype
 * (`logoWordmark`) gets it rendered alone, at its own aspect ratio. The asset
 * already spells the name, so `wordmark.text` would double it, and hanging a
 * product word off the side of a client's registered logotype makes it read as
 * a lockup they never approved. The client's mark stands by itself.
 *
 * `wordmark.text`/`accent` stay in the config for that tenant even though they
 * are unused here — they are the fallback definition, so dropping
 * `logoWordmark` restores a working lockup rather than an empty rail.
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
