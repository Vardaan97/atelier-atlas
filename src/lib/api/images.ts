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

  // Fetch from ALL sources in parallel for better coverage and quality
  const [unsplash, pexels, wiki] = await Promise.allSettled([
    searchUnsplash(query, count),
    searchPexels(query, count),
    searchWikimedia(query, Math.ceil(count / 2)),
  ]);

  const unsplashResults =
    unsplash.status === 'fulfilled' ? unsplash.value : [];
  const pexelsResults =
    pexels.status === 'fulfilled' ? pexels.value : [];
  const wikiResults =
    wiki.status === 'fulfilled' ? wiki.value : [];

  // Interleave results from all sources for diversity
  // Take 1 from each source alternating: U, P, W, U, P, W, ...
  const allResults: ImageResult[] = [];
  const maxLen = Math.max(
    unsplashResults.length,
    pexelsResults.length,
    wikiResults.length
  );

  for (let i = 0; i < maxLen; i++) {
    if (i < unsplashResults.length) allResults.push(unsplashResults[i]);
    if (i < pexelsResults.length) allResults.push(pexelsResults[i]);
    if (i < wikiResults.length) allResults.push(wikiResults[i]);
  }

  const results = allResults.slice(0, count);

  if (results.length > 0) {
    await setCached(cacheKey, results, CACHE_TTL.stockImage);
  }

  return results;
}
