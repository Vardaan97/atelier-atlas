'use client';

import { useState, useEffect, useRef } from 'react';
import type { FashionEvent } from '@/types/api';

export function useEvents(countryIso?: string | null) {
  const [events, setEvents] = useState<FashionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastIsoRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Avoid re-fetching same country
    if (lastIsoRef.current === countryIso && events.length > 0) return;
    lastIsoRef.current = countryIso;

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (countryIso) params.set('country', countryIso);

    fetch(`/api/fashion-events?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Fashion events API returned ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          setEvents(json.data);
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

  return { events, loading, error };
}
