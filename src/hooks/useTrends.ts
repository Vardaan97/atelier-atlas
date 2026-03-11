'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TrendsResult } from '@/lib/googletrends';

interface UseTrendsReturn {
  data: TrendsResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Client-side cache to avoid refetching on tab switches */
const clientCache = new Map<string, { data: TrendsResult; ts: number }>();
const CLIENT_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export function useTrends(
  countryIso: string | null,
  type: 'fashion' | 'garment' | 'designers' | 'all' = 'all',
  keyword?: string
): UseTrendsReturn {
  const [data, setData] = useState<TrendsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef(0);

  const fetchTrends = useCallback(
    (signal?: AbortSignal) => {
      if (!countryIso) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      const cacheKey = `trends:${countryIso}:${type}:${keyword || ''}`;

      // Check client cache first
      const cached = clientCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CLIENT_CACHE_TTL) {
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('country', countryIso);
      params.set('type', type);
      if (keyword) params.set('keyword', keyword);

      const id = ++fetchIdRef.current;

      fetch(`/api/trends?${params.toString()}`, { signal })
        .then(async (res) => {
          if (!res.ok) throw new Error(`Trends API returned ${res.status}`);
          return res.json();
        })
        .then((json) => {
          if (fetchIdRef.current !== id) return;

          if (json.data) {
            setData(json.data);
            setError(null);
            clientCache.set(cacheKey, { data: json.data, ts: Date.now() });
          } else if (json.error) {
            setError(json.error);
          }
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          if (fetchIdRef.current !== id) return;
          setError(err instanceof Error ? err.message : 'Failed to load trends');
        })
        .finally(() => {
          if (fetchIdRef.current === id) setLoading(false);
        });
    },
    [countryIso, type, keyword]
  );

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetchTrends(controller.signal);

    return () => controller.abort();
  }, [fetchTrends]);

  const refetch = useCallback(() => {
    if (!countryIso) return;
    const cacheKey = `trends:${countryIso}:${type}:${keyword || ''}`;
    clientCache.delete(cacheKey);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchTrends(controller.signal);
  }, [countryIso, type, keyword, fetchTrends]);

  return { data, loading, error, refetch };
}
