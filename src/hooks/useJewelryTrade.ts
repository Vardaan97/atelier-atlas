'use client';

import { useState, useEffect, useRef } from 'react';
import type { JewelryTradeData } from '@/types/jewelry';

export function useJewelryTrade(iso: string | null) {
  const [data, setData] = useState<JewelryTradeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!iso) {
      setData(null);
      setError(null);
      setLoading(false);
      isoRef.current = null;
      return;
    }

    // Avoid re-fetching same country
    if (isoRef.current === iso && data) return;
    isoRef.current = iso;

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetch(`/api/jewelry-trade/${iso}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Jewelry trade API returned ${res.status}`);
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
  }, [iso]);

  return { data, loading, error };
}
