'use client';

import { useEffect, useState } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  return 'xl';
}

/**
 * Returns the current Tailwind breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'.
 * Returns `undefined` during SSR to prevent hydration mismatch (React #418).
 */
export function useBreakpoint(): Breakpoint | undefined {
  const [bp, setBp] = useState<Breakpoint | undefined>(undefined);

  useEffect(() => {
    const update = () => setBp(getBreakpoint(window.innerWidth));
    update();

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return bp;
}
