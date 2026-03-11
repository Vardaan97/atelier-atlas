'use client';

import { useState, useEffect } from 'react';
import type { MetalsData } from '@/lib/metals';

export function useMetals() {
  const [data, setData] = useState<MetalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/metals', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Metals API returned ${res.status}`);
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
  }, []);

  return { data, loading, error };
}
