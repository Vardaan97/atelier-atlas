'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GdeltArticle } from '@/lib/gdelt';

interface UseFashionNewsReturn {
  articles: GdeltArticle[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Client-side cache to avoid refetching on tab switches */
const clientCache = new Map<string, { articles: GdeltArticle[]; ts: number }>();
const CLIENT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function useFashionNews(countryIso?: string, limit = 20): UseFashionNewsReturn {
  const [articles, setArticles] = useState<GdeltArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef(0);

  const fetchNews = useCallback(
    (signal?: AbortSignal) => {
      const cacheKey = `news:${countryIso || 'global'}:${limit}`;

      // Check client cache first
      const cached = clientCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < CLIENT_CACHE_TTL) {
        setArticles(cached.articles);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (countryIso) params.set('country', countryIso);
      params.set('limit', String(limit));

      const id = ++fetchIdRef.current;

      fetch(`/api/fashion-news?${params.toString()}`, { signal })
        .then(async (res) => {
          if (!res.ok) throw new Error(`API returned ${res.status}`);
          return res.json();
        })
        .then((json) => {
          // Only update if this is still the latest request
          if (fetchIdRef.current !== id) return;

          const fetched: GdeltArticle[] = json.articles || [];
          setArticles(fetched);
          setError(null);

          // Update client cache
          clientCache.set(cacheKey, { articles: fetched, ts: Date.now() });
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          if (fetchIdRef.current !== id) return;
          setError(err instanceof Error ? err.message : 'Failed to load news');
        })
        .finally(() => {
          if (fetchIdRef.current === id) setLoading(false);
        });
    },
    [countryIso, limit]
  );

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetchNews(controller.signal);

    return () => controller.abort();
  }, [fetchNews]);

  const refetch = useCallback(() => {
    // Clear cache for this key so we get fresh data
    const cacheKey = `news:${countryIso || 'global'}:${limit}`;
    clientCache.delete(cacheKey);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetchNews(controller.signal);
  }, [countryIso, limit, fetchNews]);

  return { articles, loading, error, refetch };
}
