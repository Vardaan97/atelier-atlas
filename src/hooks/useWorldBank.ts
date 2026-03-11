'use client';

import { useState, useEffect, useRef } from 'react';
import type { WBCountryEconomics } from '@/lib/api/worldbank';

export function useWorldBank(countryIso: string | null) {
  const [data, setData] = useState<WBCountryEconomics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!countryIso) {
      setData(null);
      setError(null);
      setLoading(false);
      isoRef.current = null;
      return;
    }

    // Avoid re-fetching same country
    if (isoRef.current === countryIso && data) return;
    isoRef.current = countryIso;

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetch(`/api/world-bank?country=${encodeURIComponent(countryIso)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`World Bank API returned ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          setData(json.data);
          setError(null);
        } else if (json.error) {
          setError(json.error);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Network error');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIso]);

  return { data, loading, error };
}
