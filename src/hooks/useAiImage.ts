'use client';

import { useState, useEffect, useRef } from 'react';

const aiImageCache = new Map<string, string>();

/**
 * Hook to generate an AI image from a prompt via /api/ai-image.
 * Returns { imageUrl, loading, error }.
 * Caches results in memory to avoid re-generating.
 */
export function useAiImage(prompt: string | null | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const promptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!prompt) {
      setImageUrl(null);
      setError(null);
      setLoading(false);
      promptRef.current = null;
      return;
    }

    // Avoid re-fetching same prompt
    if (promptRef.current === prompt && imageUrl) return;
    promptRef.current = prompt;

    // Check client-side cache
    const cached = aiImageCache.get(prompt);
    if (cached) {
      setImageUrl(cached);
      setError(null);
      setLoading(false);
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetch('/api/ai-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, cacheKey: `ai-image:${prompt.slice(0, 100)}` }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`AI image API returned ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.data?.url) {
          aiImageCache.set(prompt, json.data.url);
          setImageUrl(json.data.url);
          setError(null);
        } else if (json.error) {
          setError(json.error);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Failed to generate image');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  return { imageUrl, loading, error };
}
