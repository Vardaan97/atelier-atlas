/**
 * Wikipedia API client for garment information.
 * Uses the free Wikipedia REST API and MediaWiki API.
 * No API key required.
 */

import { getCached, setCached } from '@/lib/cache';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export interface WikipediaGarmentInfo {
  title: string;
  extract: string; // First 2-3 paragraphs
  thumbnail: string | null;
  url: string;
  description: string | null;
  pageId: number;
}

/**
 * Fetch garment information from Wikipedia.
 * Tries multiple search strategies to find the best match.
 */
export async function getGarmentInfo(
  garmentName: string,
  countryName: string
): Promise<WikipediaGarmentInfo | null> {
  const cacheKey = `wiki:${garmentName}:${countryName}`;
  const cached = await getCached<WikipediaGarmentInfo>(cacheKey);
  if (cached) return cached;

  // Try multiple search strategies in order of specificity
  const searchStrategies = [
    garmentName, // exact name first
    `${garmentName} (clothing)`,
    `${garmentName} (garment)`,
    `${garmentName} ${countryName}`,
    `${garmentName} traditional clothing`,
  ];

  for (const query of searchStrategies) {
    const result = await tryPageSummary(query);
    if (result) {
      // Enhance with a longer extract from the MediaWiki API
      const fullExtract = await getFullIntroExtract(result.title);
      if (fullExtract) {
        result.extract = fullExtract;
      }
      await setCached(cacheKey, result, SEVEN_DAYS);
      return result;
    }
  }

  // Fallback: use MediaWiki search API
  const searchResult = await searchWikipedia(garmentName, countryName);
  if (searchResult) {
    await setCached(cacheKey, searchResult, SEVEN_DAYS);
    return searchResult;
  }

  return null;
}

/**
 * Try to get a page summary directly by title.
 * Uses the REST API which returns clean summaries.
 */
async function tryPageSummary(title: string): Promise<WikipediaGarmentInfo | null> {
  try {
    const encoded = encodeURIComponent(title.replace(/ /g, '_'));
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      {
        headers: { 'User-Agent': 'AtelierAtlas/1.0 (fashion dashboard)' },
        next: { revalidate: 86400 }, // Next.js fetch cache: 1 day
      }
    );

    if (!res.ok) return null;

    const data = await res.json();

    // Skip disambiguation pages and non-article types
    if (data.type === 'disambiguation' || data.type === 'no-extract') {
      return null;
    }

    // Validate that the extract is substantial enough (>50 chars)
    if (!data.extract || data.extract.length < 50) {
      return null;
    }

    return {
      title: data.title,
      extract: data.extract,
      thumbnail: data.thumbnail?.source || data.originalimage?.source || null,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encoded}`,
      description: data.description || null,
      pageId: data.pageid,
    };
  } catch {
    return null;
  }
}

/**
 * Get the full introductory section (first 2-3 paragraphs) via MediaWiki API.
 * This gives more content than the REST summary API.
 */
async function getFullIntroExtract(title: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      prop: 'extracts',
      exintro: '1',
      explaintext: '1',
      titles: title,
      format: 'json',
      origin: '*',
    });

    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?${params.toString()}`,
      {
        headers: { 'User-Agent': 'AtelierAtlas/1.0 (fashion dashboard)' },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as { extract?: string };
    if (!page?.extract || page.extract.length < 50) return null;

    // Limit to first 3 paragraphs for readability
    const paragraphs = page.extract.split('\n').filter((p: string) => p.trim().length > 0);
    return paragraphs.slice(0, 3).join('\n\n');
  } catch {
    return null;
  }
}

/**
 * Fallback: Search Wikipedia by query and return the best match.
 */
async function searchWikipedia(
  garmentName: string,
  countryName: string
): Promise<WikipediaGarmentInfo | null> {
  try {
    const query = `${garmentName} ${countryName} clothing`;
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: '3',
      format: 'json',
      origin: '*',
    });

    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?${params.toString()}`,
      {
        headers: { 'User-Agent': 'AtelierAtlas/1.0 (fashion dashboard)' },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const results = data.query?.search;
    if (!results || results.length === 0) return null;

    // Try the top search result
    const topResult = results[0];
    const summary = await tryPageSummary(topResult.title);
    if (summary) return summary;

    // Try second result if first didn't work
    if (results.length > 1) {
      const secondResult = results[1];
      return tryPageSummary(secondResult.title);
    }

    return null;
  } catch {
    return null;
  }
}
