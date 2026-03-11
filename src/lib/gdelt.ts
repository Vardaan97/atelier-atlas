/**
 * GDELT DOC 2.0 API client for fashion news
 *
 * Free API, no key required.
 * Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-v2-developer-documentation/
 */

const GDELT_ENDPOINT =
  'https://api.gdeltproject.org/api/v2/doc/doc';

const FASHION_QUERY =
  'fashion OR runway OR textile OR designer OR couture OR "fashion week" OR garment';

/** 30-minute in-memory cache */
const cache = new Map<string, { data: GdeltArticle[]; ts: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export interface GdeltArticle {
  title: string;
  url: string;
  date: string; // ISO string
  image: string | null;
  source: string; // domain
  country: string; // source country code
  language: string;
}

interface GdeltRawArticle {
  title?: string;
  url?: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  sourcecountry?: string;
  language?: string;
}

interface GdeltResponse {
  articles?: GdeltRawArticle[];
}

function buildQuery(countryIso?: string): string {
  let query = FASHION_QUERY;
  if (countryIso) {
    // GDELT uses FIPS country codes for sourcecountry, but also supports
    // the filter as a broader matching mechanism. We use both the sourcecountry
    // filter and add the country as a context term.
    query += ` sourcecountry:${countryIso.toUpperCase()}`;
  }
  return query;
}

function parseDateString(seendate: string): string {
  // GDELT date format: "20260311T120000Z" or similar
  try {
    const cleaned = seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/, '$1-$2-$3T$4:$5:$6Z');
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function parseArticles(raw: GdeltRawArticle[]): GdeltArticle[] {
  return raw
    .filter((a) => a.title && a.url)
    .map((a) => ({
      title: (a.title || '').trim(),
      url: a.url || '',
      date: a.seendate ? parseDateString(a.seendate) : new Date().toISOString(),
      image: a.socialimage || null,
      source: (a.domain || '').replace(/^www\./, ''),
      country: (a.sourcecountry || '').toUpperCase(),
      language: (a.language || 'English').trim(),
    }));
}

export async function fetchFashionNews(
  countryIso?: string,
  limit = 25
): Promise<GdeltArticle[]> {
  const cacheKey = `gdelt:${countryIso || 'global'}:${limit}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const query = buildQuery(countryIso);
  const maxRecords = Math.min(limit * 2, 75); // fetch extra to filter dupes

  const url = new URL(GDELT_ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('mode', 'ArtList');
  url.searchParams.set('maxrecords', String(maxRecords));
  url.searchParams.set('format', 'json');
  url.searchParams.set('sort', 'DateDesc');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'AtelierAtlas/1.0' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`GDELT API returned ${res.status}`);
      return cache.get(cacheKey)?.data ?? [];
    }

    const json: GdeltResponse = await res.json();
    const articles = parseArticles(json.articles || []);

    // Deduplicate by title similarity
    const seen = new Set<string>();
    const unique = articles.filter((a) => {
      const key = a.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const result = unique.slice(0, limit);

    // Update cache
    cache.set(cacheKey, { data: result, ts: Date.now() });

    return result;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('GDELT request timed out');
    } else {
      console.error('GDELT fetch error:', err);
    }
    // Return stale cache if available
    return cache.get(cacheKey)?.data ?? [];
  }
}
