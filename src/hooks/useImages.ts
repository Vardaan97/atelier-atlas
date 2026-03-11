'use client';

import { useState, useEffect, useRef } from 'react';
import type { ImageResult } from '@/types/api';

/** Shared client-side image cache. Exported so the prefetcher can populate it. */
export const imageClientCache = new Map<string, ImageResult[]>();

export function useImages(query: string | null, count: number = 4) {
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query) {
      setImages([]);
      return;
    }

    const cacheKey = `${query}:${count}`;
    const cached = imageClientCache.get(cacheKey);
    if (cached) {
      setImages(cached);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    fetch(`/api/images?query=${encodeURIComponent(query)}&count=${count}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        const results = data.data || [];
        imageClientCache.set(cacheKey, results);
        setImages(results);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setImages([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query, count]);

  return { images, loading };
}
