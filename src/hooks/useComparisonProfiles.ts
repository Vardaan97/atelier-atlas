'use client';

import { useState, useEffect, useRef } from 'react';
import { useGlobeStore } from '@/store/useGlobeStore';
import type { CountryBase, CountryProfile } from '@/types/country';

interface ComparisonProfilesResult {
  profiles: Map<string, CountryProfile>;
  loading: Set<string>;
  errors: Map<string, string>;
}

export function useComparisonProfiles(isos: string[]): ComparisonProfilesResult {
  const countries = useGlobeStore((s) => s.countries);
  const cacheProfile = useGlobeStore((s) => s.cacheProfile);
  const getCachedProfile = useGlobeStore((s) => s.getCachedProfile);

  const [profiles, setProfiles] = useState<Map<string, CountryProfile>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    // Abort any controllers for ISOs no longer in the list
    for (const [iso, controller] of abortControllers.current) {
      if (!isos.includes(iso)) {
        controller.abort();
        abortControllers.current.delete(iso);
      }
    }

    // Clean up profiles for removed countries
    setProfiles((prev) => {
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

    // Fetch profiles for each ISO
    for (const iso of isos) {
      // Already have it
      const cached = getCachedProfile(iso);
      if (cached) {
        setProfiles((prev) => {
          if (prev.get(iso) === cached) return prev;
          const next = new Map(prev);
          next.set(iso, cached);
          return next;
        });
        continue;
      }

      // Already fetching
      if (abortControllers.current.has(iso)) continue;

      const country = countries.find((c) => c.iso === iso);
      if (!country) continue;

      const controller = new AbortController();
      abortControllers.current.set(iso, controller);

      setLoading((prev) => {
        const next = new Set(prev);
        next.add(iso);
        return next;
      });

      fetchProfile(iso, country, controller.signal)
        .then((profile) => {
          if (profile) {
            cacheProfile(iso, profile);
            setProfiles((prev) => {
              const next = new Map(prev);
              next.set(iso, profile);
              return next;
            });
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setErrors((prev) => {
              const next = new Map(prev);
              next.set(iso, err instanceof Error ? err.message : 'Failed to load');
              return next;
            });
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

  return { profiles, loading, errors };
}

async function fetchProfile(
  iso: string,
  country: CountryBase,
  signal: AbortSignal
): Promise<CountryProfile | null> {
  const res = await fetch(`/api/ai-profile/${iso}`, { signal });
  const data = await res.json();

  if (data.data) {
    return {
      ...country,
      ...data.data,
      aiGenerated: true,
    };
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return null;
}
