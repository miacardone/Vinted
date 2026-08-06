import { useBrand } from '@/brand/BrandProvider';

/**
 * Tenant wordmark: logo served from a path in brand.config, plus type.
 * The asset is never imported into this component — swapping tenants swaps a
 * string, not a module graph.
 */
export function Wordmark({ inverse = false, showText = true, size = 26 }) {
  const brand = useBrand();

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
