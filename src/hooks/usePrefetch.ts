'use client';

import { useEffect, useRef } from 'react';
import { imageClientCache } from '@/hooks/useImages';
import type { ImageResult } from '@/types/api';

/**
 * Priority countries for background image pre-fetching.
 * Ordered by likely user interest (fashion capitals first).
 */
const PRIORITY_COUNTRIES = [
  'IN', 'JP', 'FR', 'IT', 'CN',
  'NG', 'US', 'GB', 'KR', 'BR',
  'DE', 'ES', 'MA', 'MX', 'TH',
];

/** localStorage key for tracking prefetch state */
const STORAGE_KEY = 'atelier_prefetch_state';

/**
 * Bump this version when image queries change significantly.
 * When the stored version doesn't match, all prefetch state is cleared
 * so new queries get fetched instead of serving stale cached images.
 */
const PREFETCH_VERSION = 2;
const VERSION_KEY = 'atelier_prefetch_version';

/** How long before a country's prefetch is considered stale (3 days — shorter to pick up improved queries faster) */
const PREFETCH_TTL = 3 * 24 * 60 * 60 * 1000;

/** Delay between countries (30 seconds) */
const COUNTRY_GAP_MS = 30_000;

/** Initial delay before starting prefetch (10 seconds after globe loads) */
const INITIAL_DELAY_MS = 10_000;

interface PrefetchState {
  [iso: string]: number; // timestamp of last prefetch
}

function getPrefetchState(): PrefetchState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored) as PrefetchState;
  } catch {
    return {};
  }
}

function setPrefetchState(state: PrefetchState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable
  }
}

function isStale(iso: string, state: PrefetchState): boolean {
  const ts = state[iso];
  if (!ts) return true;
  return Date.now() - ts > PREFETCH_TTL;
}

/**
 * Prefetch a single country's garment images.
 * Calls the /api/prefetch-images endpoint and populates the client-side cache.
 */
async function prefetchCountry(iso: string): Promise<boolean> {
  try {
    const res = await fetch('/api/prefetch-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countryIso: iso }),
    });

    if (!res.ok) return false;

    const json = await res.json();
    const results = json.data?.results as
      | { query: string; images: ImageResult[] }[]
      | undefined;

    if (!results) return false;

    // Populate client cache with the same keys useImages would use (count=3 now)
    for (const { query, images } of results) {
      if (images.length > 0) {
        const cacheKey = `${query}:3`;
        imageClientCache.set(cacheKey, images);
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Background image prefetcher hook.
 *
 * After the globe renders, silently pre-fetches garment images for the top 15
 * countries so they load instantly when a user opens a country panel.
 *
 * Behaviour:
 * - Waits 10 seconds after mount before starting
 * - Fetches one country at a time with 30-second gaps
 * - Skips countries already pre-fetched within the last 3 days
 * - Clears all caches when query version is bumped (PREFETCH_VERSION)
 * - Uses requestIdleCallback (with setTimeout fallback) to avoid blocking UI
 * - Tracks state in localStorage so progress survives page refreshes
 * - Stops if the component unmounts
 */
export function usePrefetch(enabled: boolean = true) {
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    cancelledRef.current = false;

    const scheduleIdle = (fn: () => void) => {
      if (typeof requestIdleCallback !== 'undefined') {
        return requestIdleCallback(fn);
      }
      return setTimeout(fn, 50) as unknown as number;
    };

    const cancelIdle = (id: number) => {
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
    };

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      // Wait for initial delay
      await new Promise<void>((resolve) => {
        timeoutId = setTimeout(resolve, INITIAL_DELAY_MS);
      });

      if (cancelledRef.current) return;

      // Check if queries have been updated — if so, clear old prefetch state
      // and client cache so the new, better image queries are used
      try {
        const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
        if (storedVersion < PREFETCH_VERSION) {
          // Clear all old prefetch state
          localStorage.removeItem(STORAGE_KEY);
          localStorage.setItem(VERSION_KEY, PREFETCH_VERSION.toString());
          // Clear client-side image cache to force re-fetch with new queries
          imageClientCache.clear();
        }
      } catch {
        // localStorage may be unavailable
      }

      const state = getPrefetchState();

      // Filter to countries that need prefetching
      const toPrefetch = PRIORITY_COUNTRIES.filter((iso) =>
        isStale(iso, state)
      );

      if (toPrefetch.length === 0) return;

      for (let i = 0; i < toPrefetch.length; i++) {
        if (cancelledRef.current) return;

        const iso = toPrefetch[i];

        // Use requestIdleCallback to avoid blocking user interactions
        await new Promise<void>((resolve) => {
          idleId = scheduleIdle(() => {
            resolve();
          });
        });

        if (cancelledRef.current) return;

        const success = await prefetchCountry(iso);

        if (success) {
          const updated = getPrefetchState();
          updated[iso] = Date.now();
          setPrefetchState(updated);
        }

        // Wait between countries (unless this is the last one)
        if (i < toPrefetch.length - 1 && !cancelledRef.current) {
          await new Promise<void>((resolve) => {
            timeoutId = setTimeout(resolve, COUNTRY_GAP_MS);
          });
        }
      }
    }

    run();

    return () => {
      cancelledRef.current = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (idleId) cancelIdle(idleId);
    };
  }, [enabled]);
}
