import { searchUnsplash } from './unsplash';
import { searchPexels } from './pexels';
import { searchWikimedia } from './wikimedia';
import { getCached, setCached } from '@/lib/cache';
import { CACHE_TTL } from '@/lib/constants';
import type { ImageResult } from '@/types/api';

export async function searchImages(
  query: string,
  count: number = 4
): Promise<ImageResult[]> {
  const cacheKey = `images:${query}:${count}`;
  const cached = await getCached<ImageResult[]>(cacheKey);
  if (cached) return cached;

  let results: ImageResult[] = [];

  // Try sources in priority order: Unsplash (highest quality) → Pexels → Wikimedia (always available)
  const unsplash = await searchUnsplash(query, count);
  results.push(...unsplash);

  if (results.length < count) {
    const pexels = await searchPexels(query, count - results.length);
    results.push(...pexels);
  }

  if (results.length < count) {
    const wiki = await searchWikimedia(query, count - results.length);
    results.push(...wiki);
  }

  results = results.slice(0, count);

  if (results.length > 0) {
    await setCached(cacheKey, results, CACHE_TTL.stockImage);
  }

  return results;
}
