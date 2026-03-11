'use client';

import { useState, useEffect, useRef } from 'react';
import type { WikipediaGarmentInfo } from '@/lib/wikipedia';

/** Client-side cache for garment info to avoid re-fetching. */
const garmentInfoCache = new Map<string, WikipediaGarmentInfo>();

/**
 * Lazy-loaded hook to fetch Wikipedia garment info.
 * Only fetches when both garmentName and countryName are provided.
 */
export function useGarmentInfo(
  garmentName: string | null,
  countryName: string | null
) {
  const [info, setInfo] = useState<WikipediaGarmentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!garmentName || !countryName) {
      setInfo(null);
      setError(null);
      setLoading(false);
      return;
    }

    const cacheKey = `garment-info:${garmentName}:${countryName}`;
    const cached = garmentInfoCache.get(cacheKey);
    if (cached) {
      setInfo(cached);
      setError(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      garment: garmentName,
      country: countryName,
    });

    fetch(`/api/garment-info?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Garment info API returned ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const result: WikipediaGarmentInfo | null = json.data || null;
        if (result) {
          garmentInfoCache.set(cacheKey, result);
        }
        setInfo(result);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(
            err instanceof Error ? err.message : 'Failed to load garment info'
          );
          setInfo(null);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [garmentName, countryName]);

  return { info, loading, error };
}
