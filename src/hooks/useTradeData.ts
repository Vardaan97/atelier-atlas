'use client';

import { useState, useEffect, useRef } from 'react';
import type { TradeData } from '@/types/api';

export function useTradeData(iso: string | null) {
  const [data, setData] = useState<TradeData | null>(null);
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

    fetch(`/api/trade/${iso}`, { signal: controller.signal })
      .then((res) => res.json())
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
