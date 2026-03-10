'use client';

import { useState, useEffect, useRef } from 'react';
import { useGlobeStore } from '@/store/useGlobeStore';
import type { CountryBase, CountryProfile } from '@/types/country';

export function useAiProfile(country: CountryBase | null) {
  const cacheProfile = useGlobeStore(s => s.cacheProfile);
  const getCachedProfile = useGlobeStore(s => s.getCachedProfile);

  const [profile, setProfile] = useState<CountryProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isoRef = useRef<string | null>(null);

  useEffect(() => {
    const iso = country?.iso ?? null;

    if (!iso || !country) {
      setProfile(null);
      setError(null);
      setLoading(false);
      isoRef.current = null;
      return;
    }

    // Avoid re-fetching same country
    if (isoRef.current === iso && profile) return;
    isoRef.current = iso;

    // Check Zustand cache first
    const cached = getCachedProfile(iso);
    if (cached) {
      setProfile(cached);
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

    fetch(`/api/ai-profile/${iso}`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          const fullProfile: CountryProfile = {
            ...country,
            ...data.data,
            aiGenerated: true,
          };
          cacheProfile(iso, fullProfile);
          setProfile(fullProfile);
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err instanceof Error ? err.message : 'Network error');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country?.iso]);

  return { profile, loading, error };
}
