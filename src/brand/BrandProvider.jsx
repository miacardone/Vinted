import { createContext, useContext, useEffect, useMemo } from 'react';
import brandConfig from '@/brand/brand.config';

const BrandContext = createContext(brandConfig);

/** camelCase -> --kebab-case, so `primaryDeep` becomes `--c-primary-deep`. */
const toVar = (key) => `--c-${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;

/**
 * Writes the tenant palette to CSS custom properties on :root.
 *
 * This is the mechanism that lets every component stay colour-free: they
 * reference var(--c-primary), never a hex code. tokens.css carries the same
 * values as static fallbacks, so nothing flashes unstyled if this effect is
 * delayed a frame.
 */
export function BrandProvider({ brand = brandConfig, children }) {
  useEffect(() => {
    const root = document.documentElement;

    Object.entries(brand.colors).forEach(([key, value]) => {
      root.style.setProperty(toVar(key), value);
    });

    // Chart series land as an indexed ramp so SVG can read them positionally.
    (brand.chartSeries ?? []).forEach((value, i) => {
      root.style.setProperty(`--c-series-${i}`, value);
    });
    root.style.setProperty('--c-series-neutral', brand.chartNeutral);

    root.dataset.tenant = brand.id;
    document.title = `${brand.name} ${brand.productName}`;
  }, [brand]);

  const value = useMemo(() => brand, [brand]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}

/** Convenience for the many call sites that only need the vocabulary. */
export function useTerms() {
  return useContext(BrandContext).terms;
}

export default BrandProvider;
