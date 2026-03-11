'use client';

import { useState, useEffect, useRef } from 'react';
import type { WBCountryEconomics } from '@/lib/api/worldbank';

/**
 * Fetches World Bank economic data for multiple countries in parallel.
 * Used in ComparisonView to show side-by-side economic indicators.
 */
export function useWorldBankComparison(isos: string[]) {
  const [data, setData] = useState<Map<string, WBCountryEconomics>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    // Abort controllers for ISOs no longer in the list
    for (const [iso, controller] of abortControllers.current) {
      if (!isos.includes(iso)) {
        controller.abort();
        abortControllers.current.delete(iso);
      }
    }

    // Clean up data for removed countries
    setData((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const key of next.keys()) {
        if (!isos.includes(key)) {
          next.delete(key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    for (const iso of isos) {
      // Already have data or already fetching
      if (data.has(iso) || abortControllers.current.has(iso)) continue;

      const controller = new AbortController();
      abortControllers.current.set(iso, controller);

      setLoading((prev) => {
        const next = new Set(prev);
        next.add(iso);
        return next;
      });

      fetch(`/api/world-bank?country=${encodeURIComponent(iso)}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((json) => {
          if (json.data) {
            setData((prev) => {
              const next = new Map(prev);
              next.set(iso, json.data);
              return next;
            });
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            // Silently ignore errors in comparison — we just show "—" for missing data
            console.warn(`World Bank data unavailable for ${iso}:`, err.message);
          }
        })
        .finally(() => {
          abortControllers.current.delete(iso);
          setLoading((prev) => {
            const next = new Set(prev);
            next.delete(iso);
            return next;
          });
        });
    }

    const controllers = abortControllers.current;
    return () => {
      for (const controller of controllers.values()) {
        controller.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isos.join(',')]);

  return { data, loading };
}
