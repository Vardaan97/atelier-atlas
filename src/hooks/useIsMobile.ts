'use client';

import { useBreakpoint } from './useBreakpoint';

/**
 * Returns `undefined` during SSR, then resolves to boolean on client.
 * Mobile = xs or sm (< 768px). Built on top of useBreakpoint().
 */
export function useIsMobile(): boolean | undefined {
  const bp = useBreakpoint();
  if (bp === undefined) return undefined;
  return bp === 'xs' || bp === 'sm';
}
