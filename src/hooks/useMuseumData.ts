'use client';

import { useState, useEffect, useRef } from 'react';
import type { MuseumItem } from '@/lib/metmuseum';

/** Client-side cache for museum data. */
const museumCache = new Map<string, MuseumItem[]>();

/**
 * Fetch Met Museum garment items for a country (and optional garment or era).
 *
 * @param countryName  e.g. "India"
 * @param garmentName  e.g. "Sari"   (optional — for TraditionalTab)
 * @param eraName      e.g. "Mughal" (optional — for TimelineTab)
 * @param limit        max items (default 5 for garments, 2 for eras)
 */
export function useMuseumData(
  countryName: string | null,
  options?: { garment?: string; era?: string; limit?: number },
) {
  const { garment, era, limit } = options || {};
  const [items, setItems] = useState<MuseumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!countryName) {
      setItems([]);
      return;
    }

    const cacheKey = `museum:${countryName}:${garment || ''}:${era || ''}:${limit || ''}`;
    const cached = museumCache.get(cacheKey);
    if (cached) {
      setItems(cached);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ country: countryName });
    if (garment) params.set('garment', garment);
    if (era) params.set('era', era);
    if (limit) params.set('limit', String(limit));

    fetch(`/api/museum-garments?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Museum API returned ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const results: MuseumItem[] = json.items || [];
        museumCache.set(cacheKey, results);
        setItems(results);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Failed to load museum data');
          setItems([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [countryName, garment, era, limit]);

  return { items, loading, error };
}
