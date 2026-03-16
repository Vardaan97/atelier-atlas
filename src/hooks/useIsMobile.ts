'use client';

import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Returns `undefined` during SSR, then resolves to boolean on client.
 * Prevents hydration mismatch and avoids mounting heavy 3D globe on mobile.
 */
export function useIsMobile(): boolean | undefined {
  // Always start as undefined to match SSR output and prevent hydration mismatch (React #418)
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Set initial value
    handleChange(mql);

    mql.addEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
    return () => {
      mql.removeEventListener('change', handleChange as (e: MediaQueryListEvent) => void);
    };
  }, []);

  return isMobile;
}
