import type { CacheEntry } from '@/types/api';

const memoryCache = new Map<string, CacheEntry<unknown>>();

export async function getCached<T>(key: string): Promise<T | null> {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

export async function setCached<T>(
  key: string,
  data: T,
  ttl: number
): Promise<void> {
  memoryCache.set(key, { data, timestamp: Date.now(), ttl });
}

export async function deleteCached(key: string): Promise<void> {
  memoryCache.delete(key);
}

export function getCacheStats() {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}
