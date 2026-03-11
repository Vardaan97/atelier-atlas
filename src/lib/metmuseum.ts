/**
 * Metropolitan Museum of Art Collection API client.
 * Focuses on the Costume Institute (department 21).
 * Free API, no key required.
 *
 * Docs: https://metmuseum.github.io/
 */

import { getCached, setCached } from '@/lib/cache';

const BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';
const COSTUME_DEPT = 21;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetObject {
  objectID: number;
  title: string;
  primaryImage: string;
  primaryImageSmall: string;
  culture: string;
  period: string;
  dynasty: string;
  objectDate: string;
  medium: string;
  dimensions: string;
  creditLine: string;
  country: string;
  department: string;
  objectURL: string;
  isPublicDomain: boolean;
}

export interface MuseumItem {
  id: number;
  title: string;
  image: string;
  imageSmall: string;
  culture: string;
  period: string;
  date: string;
  medium: string;
  creditLine: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Met API ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

function toMuseumItem(obj: MetObject): MuseumItem {
  return {
    id: obj.objectID,
    title: obj.title,
    image: obj.primaryImage,
    imageSmall: obj.primaryImageSmall,
    culture: obj.culture || '',
    period: obj.period || '',
    date: obj.objectDate || '',
    medium: obj.medium || '',
    creditLine: obj.creditLine || '',
    url: `https://www.metmuseum.org/art/collection/search/${obj.objectID}`,
  };
}

// ---------------------------------------------------------------------------
// Core API methods
// ---------------------------------------------------------------------------

/** Search the Costume Institute for object IDs matching `query`. */
export async function searchGarments(
  query: string,
  limit: number = 5,
): Promise<number[]> {
  const cacheKey = `met:search:${query}:${limit}`;
  const cached = await getCached<number[]>(cacheKey);
  if (cached) return cached;

  const url = `${BASE}/search?q=${encodeURIComponent(query)}&departmentId=${COSTUME_DEPT}&hasImages=true`;
  const data = await fetchJSON<{ total: number; objectIDs: number[] | null }>(url);

  const ids = (data.objectIDs || []).slice(0, limit);
  await setCached(cacheKey, ids, CACHE_TTL);
  return ids;
}

/** Fetch full object details by ID. */
export async function getObject(objectId: number): Promise<MetObject | null> {
  const cacheKey = `met:obj:${objectId}`;
  const cached = await getCached<MetObject>(cacheKey);
  if (cached) return cached;

  try {
    const obj = await fetchJSON<MetObject>(`${BASE}/objects/${objectId}`);
    await setCached(cacheKey, obj, CACHE_TTL);
    return obj;
  } catch {
    return null;
  }
}

/** Batch-fetch objects, filtering to those with images. */
async function batchFetchObjects(ids: number[]): Promise<MuseumItem[]> {
  const results = await Promise.all(ids.map((id) => getObject(id)));
  return results
    .filter((obj): obj is MetObject => obj !== null && !!obj.primaryImageSmall)
    .map(toMuseumItem);
}

// ---------------------------------------------------------------------------
// High-level queries
// ---------------------------------------------------------------------------

/**
 * Get museum garment items for a country.
 * Tries several search strategies and deduplicates.
 */
export async function getMuseumGarments(
  countryName: string,
  garmentName?: string,
  limit: number = 5,
): Promise<MuseumItem[]> {
  const cacheKey = `met:garments:${countryName}:${garmentName || ''}:${limit}`;
  const cached = await getCached<MuseumItem[]>(cacheKey);
  if (cached) return cached;

  // Build queries — specific garment first, then broader
  const queries: string[] = [];
  if (garmentName) {
    queries.push(`${garmentName} ${countryName}`);
  }
  queries.push(`traditional clothing ${countryName}`);
  queries.push(`costume ${countryName}`);

  const seenIds = new Set<number>();
  const items: MuseumItem[] = [];

  for (const query of queries) {
    if (items.length >= limit) break;
    const remaining = limit - items.length;
    // Fetch more IDs than needed so we have room after filtering
    const ids = await searchGarments(query, remaining + 5);
    const newIds = ids.filter((id) => !seenIds.has(id));
    newIds.forEach((id) => seenIds.add(id));
    const fetched = await batchFetchObjects(newIds.slice(0, remaining));
    items.push(...fetched);
  }

  const result = items.slice(0, limit);
  await setCached(cacheKey, result, CACHE_TTL);
  return result;
}

/**
 * Get museum items for a specific era + country (for timeline).
 * Lighter query — max 2 items.
 */
export async function getMuseumEraItems(
  eraName: string,
  countryName: string,
  limit: number = 2,
): Promise<MuseumItem[]> {
  const cacheKey = `met:era:${eraName}:${countryName}:${limit}`;
  const cached = await getCached<MuseumItem[]>(cacheKey);
  if (cached) return cached;

  const query = `${eraName} ${countryName} clothing`;
  const ids = await searchGarments(query, limit + 3);
  const items = await batchFetchObjects(ids.slice(0, limit + 3));
  const result = items.slice(0, limit);

  await setCached(cacheKey, result, CACHE_TTL);
  return result;
}
