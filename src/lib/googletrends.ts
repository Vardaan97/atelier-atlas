/**
 * Google Trends client for fashion-related search data.
 *
 * Primary: `google-trends-api` npm package (scrapes Google Trends directly).
 * Fallback: Google Trends RSS feed (free, no auth, daily trending searches).
 *
 * All results are cached for 6 hours in-memory because trend data is slow-moving.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const googleTrends = require('google-trends-api');

// ── Types ───────────────────────────────────────────────────────────────────

export interface TrendQuery {
  title: string;
  /** Relative interest score 0-100 (from Google) or estimated from context */
  score: number;
  /** "rising" | "top" | "breakout" */
  type: 'rising' | 'top' | 'breakout';
  /** Optional link to Google Trends page */
  link?: string;
}

export interface InterestPoint {
  date: string; // YYYY-MM-DD
  value: number; // 0-100
}

export interface TrendsResult {
  trendingNow: TrendQuery[];
  garmentInterest: Record<string, InterestPoint[]>; // garmentName → sparkline data
  risingDesigners: TrendQuery[];
  topKeywords: {
    keyword: string;
    data: InterestPoint[];
  }[];
  source: 'google-trends-api' | 'rss-fallback' | 'synthetic';
  fetchedAt: number;
}

// ── Cache ───────────────────────────────────────────────────────────────────

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const cache = new Map<string, { data: TrendsResult; ts: number }>();

function getCached(key: string): TrendsResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: TrendsResult) {
  cache.set(key, { data, ts: Date.now() });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Country ISO-2 to Google Trends geo code.
 * Google Trends uses ISO-2 codes directly for most countries.
 */
function isoToGeo(iso: string): string {
  return iso.toUpperCase();
}

/** Safe JSON parse of google-trends-api string responses */
function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Primary: google-trends-api package ──────────────────────────────────────

interface GtRankedKeyword {
  query?: string;
  topic?: { title?: string };
  value?: number;
  formattedValue?: string;
  link?: string;
  hasData?: boolean;
}

interface GtTimelinePoint {
  time?: string;
  formattedTime?: string;
  value?: number[];
  hasData?: boolean[];
}

async function fetchRelatedQueries(
  keyword: string,
  geo: string,
  category: number = 185 // Fashion & Style
): Promise<{ rising: TrendQuery[]; top: TrendQuery[] }> {
  try {
    const raw: string = await googleTrends.relatedQueries({
      keyword,
      geo: isoToGeo(geo),
      category,
    });
    const parsed = safeJsonParse(raw) as {
      default?: {
        rankedList?: Array<{
          rankedKeyword?: GtRankedKeyword[];
        }>;
      };
    } | null;

    if (!parsed?.default?.rankedList) return { rising: [], top: [] };

    const lists = parsed.default.rankedList;
    const top: TrendQuery[] = (lists[0]?.rankedKeyword || [])
      .filter((k: GtRankedKeyword) => k.query)
      .slice(0, 10)
      .map((k: GtRankedKeyword) => ({
        title: k.query!,
        score: k.value ?? 0,
        type: 'top' as const,
        link: k.link ? `https://trends.google.com${k.link}` : undefined,
      }));

    const rising: TrendQuery[] = (lists[1]?.rankedKeyword || [])
      .filter((k: GtRankedKeyword) => k.query)
      .slice(0, 10)
      .map((k: GtRankedKeyword) => ({
        title: k.query!,
        score: k.value ?? 0,
        type: k.formattedValue === 'Breakout' ? ('breakout' as const) : ('rising' as const),
        link: k.link ? `https://trends.google.com${k.link}` : undefined,
      }));

    return { rising, top };
  } catch (err) {
    console.warn('relatedQueries failed:', err instanceof Error ? err.message : err);
    return { rising: [], top: [] };
  }
}

async function fetchInterestOverTime(
  keyword: string | string[],
  geo: string,
  category: number = 185
): Promise<Record<string, InterestPoint[]>> {
  const keywords = Array.isArray(keyword) ? keyword : [keyword];
  if (keywords.length === 0) return {};

  try {
    const raw: string = await googleTrends.interestOverTime({
      keyword: keywords.length === 1 ? keywords[0] : keywords,
      geo: isoToGeo(geo),
      category,
    });
    const parsed = safeJsonParse(raw) as {
      default?: {
        timelineData?: GtTimelinePoint[];
      };
    } | null;

    if (!parsed?.default?.timelineData) return {};

    const result: Record<string, InterestPoint[]> = {};
    for (const kw of keywords) {
      result[kw] = [];
    }

    for (const point of parsed.default.timelineData) {
      if (!point.time) continue;
      const timestamp = parseInt(point.time, 10) * 1000;
      if (isNaN(timestamp)) continue;
      const dateStr = new Date(timestamp).toISOString().split('T')[0];

      const values = point.value || [];
      for (let i = 0; i < keywords.length; i++) {
        const val = values[i] ?? 0;
        result[keywords[i]].push({ date: dateStr, value: val });
      }
    }

    return result;
  } catch (err) {
    console.warn('interestOverTime failed:', err instanceof Error ? err.message : err);
    return {};
  }
}

async function fetchDailyTrends(geo: string): Promise<TrendQuery[]> {
  try {
    const raw: string = await googleTrends.dailyTrends({ geo: isoToGeo(geo) });
    const parsed = safeJsonParse(raw) as {
      default?: {
        trendingSearchesDays?: Array<{
          trendingSearches?: Array<{
            title?: { query?: string };
            formattedTraffic?: string;
            relatedQueries?: Array<{ query?: string }>;
            shareUrl?: string;
          }>;
        }>;
      };
    } | null;

    if (!parsed?.default?.trendingSearchesDays) return [];

    const fashionKeywords = [
      'fashion', 'dress', 'wear', 'style', 'outfit', 'clothing', 'designer',
      'couture', 'collection', 'runway', 'brand', 'trend', 'luxury',
      'silk', 'cotton', 'textile', 'fabric', 'tailored', 'bespoke',
      'vogue', 'apparel', 'garment', 'shoe', 'bag', 'accessori',
      'jewelry', 'jewellery', 'watch', 'model', 'beauty', 'cosmetic',
    ];

    const results: TrendQuery[] = [];

    for (const day of parsed.default.trendingSearchesDays) {
      for (const search of day.trendingSearches || []) {
        const query = search.title?.query || '';
        const lower = query.toLowerCase();
        const relatedStr = (search.relatedQueries || []).map(r => r.query || '').join(' ').toLowerCase();

        const isFashion = fashionKeywords.some(
          kw => lower.includes(kw) || relatedStr.includes(kw)
        );

        if (isFashion) {
          const trafficStr = search.formattedTraffic || '0';
          const trafficNum = parseInt(trafficStr.replace(/[^0-9]/g, ''), 10) || 0;

          results.push({
            title: query,
            score: Math.min(100, Math.round(trafficNum / 1000)),
            type: 'rising',
            link: search.shareUrl,
          });
        }
      }
    }

    return results.slice(0, 10);
  } catch (err) {
    console.warn('dailyTrends failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

// ── Fallback: Google Trends RSS ─────────────────────────────────────────────

async function fetchTrendsRss(geo: string): Promise<TrendQuery[]> {
  const url = `https://trends.google.com/trending/rss?geo=${isoToGeo(geo)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AtelierAtlas/1.0' },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Trends RSS returned ${res.status} for ${geo}`);
      return [];
    }

    const xml = await res.text();

    // Parse RSS items: <item><title>...</title><ht:approx_traffic>...</ht:approx_traffic></item>
    const items: TrendQuery[] = [];
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    const trafficRegex = /<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/;

    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[0];
      const titleMatch = titleRegex.exec(itemXml);
      const trafficMatch = trafficRegex.exec(itemXml);

      const title = titleMatch?.[1] || titleMatch?.[2] || '';
      const trafficStr = trafficMatch?.[1] || '0';
      const trafficNum = parseInt(trafficStr.replace(/[^0-9]/g, ''), 10) || 0;

      if (title) {
        items.push({
          title,
          score: Math.min(100, Math.round(trafficNum / 5000)),
          type: 'rising',
        });
      }
    }

    // Filter for fashion-related items
    const fashionKeywords = [
      'fashion', 'dress', 'wear', 'style', 'outfit', 'clothing', 'designer',
      'couture', 'collection', 'runway', 'brand', 'trend', 'luxury',
      'silk', 'textile', 'fabric', 'vogue', 'apparel', 'garment',
      'shoe', 'bag', 'jewelry', 'jewellery', 'beauty', 'model',
    ];

    const fashionItems = items.filter(item => {
      const lower = item.title.toLowerCase();
      return fashionKeywords.some(kw => lower.includes(kw));
    });

    // If no fashion items found, return top general items with lower scores
    if (fashionItems.length === 0) {
      return items.slice(0, 5).map(item => ({
        ...item,
        score: Math.max(10, Math.round(item.score * 0.5)),
      }));
    }

    return fashionItems.slice(0, 10);
  } catch (err) {
    console.warn('RSS fallback failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

// ── Synthetic fallback ──────────────────────────────────────────────────────

/** Country-specific fashion search terms for when APIs fail */
const COUNTRY_FASHION_TERMS: Record<string, string[]> = {
  FR: ['haute couture', 'Paris Fashion Week', 'Chanel', 'Louis Vuitton', 'Dior'],
  IT: ['Milano Moda', 'Gucci', 'Prada', 'Versace', 'Italian leather'],
  US: ['New York Fashion Week', 'streetwear', 'athleisure', 'sustainable fashion', 'sneaker culture'],
  GB: ['London Fashion Week', 'Burberry', 'Alexander McQueen', 'British tailoring', 'Vivienne Westwood'],
  JP: ['Japanese streetwear', 'Comme des Garcons', 'Issey Miyake', 'kimono fashion', 'harajuku style'],
  KR: ['K-fashion', 'Korean street style', 'hanbok modern', 'K-beauty', 'Seoul Fashion Week'],
  IN: ['Indian fashion week', 'saree trend', 'lehenga', 'Sabyasachi', 'sustainable Indian fashion'],
  CN: ['Shanghai Fashion Week', 'Chinese designer', 'qipao trend', 'guochao fashion', 'Li Ning'],
  BR: ['SPFW', 'Brazilian fashion', 'Havaianas', 'beachwear trend', 'sustainable fashion Brazil'],
  NG: ['Lagos Fashion Week', 'Ankara fashion', 'African print', 'Deola Sagoe', 'Nigerian fashion'],
  AU: ['Australian Fashion Week', 'resort wear', 'Zimmermann', 'sustainable fashion Australia', 'surf style'],
  DE: ['Berlin Fashion Week', 'German fashion', 'sustainable fashion', 'Hugo Boss', 'minimalist style'],
  ES: ['Madrid Fashion Week', 'Zara', 'Balenciaga', 'Spanish fashion', 'flamenco inspired'],
  AE: ['Dubai Fashion', 'modest fashion', 'abaya trend', 'luxury shopping Dubai', 'Arab fashion'],
  ZA: ['South African Fashion Week', 'Maxhosa', 'African luxury', 'shweshwe fashion', 'African print'],
  MX: ['Mexican fashion', 'huipil trend', 'sustainable fashion Mexico', 'rebozo', 'Mexican designer'],
  TH: ['Thai silk fashion', 'Bangkok Fashion Week', 'Thai designer', 'sustainable fashion Thailand', 'Thai street style'],
  TR: ['Istanbul Fashion Week', 'Turkish fashion', 'modest fashion Turkey', 'Turkish textile', 'Turkish designer'],
  SE: ['Stockholm Fashion Week', 'Scandinavian fashion', 'H&M conscious', 'minimalist Swedish style', 'sustainable fashion'],
  EG: ['Egyptian fashion', 'modest fashion Egypt', 'Egyptian cotton', 'Arab fashion', 'galabiya modern'],
};

function generateSyntheticTrends(
  geo: string,
  garments: string[] = [],
  designers: string[] = []
): TrendsResult {
  const terms = COUNTRY_FASHION_TERMS[geo.toUpperCase()] || [
    'fashion trends', 'designer clothing', 'sustainable fashion', 'street style', 'fashion week',
  ];

  // Generate pseudo-random but deterministic scores based on country+term
  function hashScore(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash % 80) + 20; // 20-100
  }

  const trendingNow: TrendQuery[] = terms.map(term => ({
    title: term,
    score: hashScore(geo + term),
    type: hashScore(term) > 70 ? ('breakout' as const) : ('rising' as const),
  }));

  // Generate garment interest sparkline data (12 months)
  const garmentInterest: Record<string, InterestPoint[]> = {};
  for (const garment of garments.slice(0, 5)) {
    const points: InterestPoint[] = [];
    const baseScore = hashScore(geo + garment);
    for (let m = 11; m >= 0; m--) {
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      const dateStr = date.toISOString().split('T')[0];
      // Create a plausible wave pattern
      const seasonal = Math.sin((date.getMonth() / 12) * Math.PI * 2) * 15;
      const noise = ((hashScore(garment + dateStr) % 20) - 10);
      const value = Math.max(5, Math.min(100, Math.round(baseScore + seasonal + noise)));
      points.push({ date: dateStr, value });
    }
    garmentInterest[garment] = points;
  }

  // Rising designers
  const risingDesigners: TrendQuery[] = designers.slice(0, 5).map(name => ({
    title: name,
    score: hashScore(geo + name),
    type: hashScore(name) > 60 ? ('breakout' as const) : ('rising' as const),
  }));

  // Top keywords with timeline
  const topKeywords = terms.slice(0, 5).map(keyword => {
    const data: InterestPoint[] = [];
    const base = hashScore(geo + keyword);
    for (let m = 11; m >= 0; m--) {
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      const dateStr = date.toISOString().split('T')[0];
      const seasonal = Math.sin(((date.getMonth() + 2) / 12) * Math.PI * 2) * 20;
      const noise = ((hashScore(keyword + dateStr) % 15) - 7);
      const value = Math.max(5, Math.min(100, Math.round(base + seasonal + noise)));
      data.push({ date: dateStr, value });
    }
    return { keyword, data };
  });

  return {
    trendingNow,
    garmentInterest,
    risingDesigners,
    topKeywords,
    source: 'synthetic',
    fetchedAt: Date.now(),
  };
}

// ── Main public API ─────────────────────────────────────────────────────────

export interface TrendsRequest {
  country: string; // ISO-2 code
  type: 'fashion' | 'garment' | 'designers' | 'all';
  keyword?: string;
  garments?: string[];
  designers?: string[];
}

/**
 * Fetch Google Trends data for a country's fashion scene.
 *
 * Tries google-trends-api package first, falls back to RSS,
 * then to synthetic data if all external calls fail.
 */
export async function fetchTrendsData(req: TrendsRequest): Promise<TrendsResult> {
  const cacheKey = `trends:${req.country}:${req.type}:${req.keyword || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const geo = req.country.toUpperCase();
  const garments = req.garments || [];
  const designers = req.designers || [];

  // Attempt 1: google-trends-api package
  try {
    const result = await fetchWithPackage(geo, req.type, garments, designers, req.keyword);
    if (result && (result.trendingNow.length > 0 || Object.keys(result.garmentInterest).length > 0)) {
      setCache(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('google-trends-api attempt failed:', err instanceof Error ? err.message : err);
  }

  // Attempt 2: RSS fallback
  try {
    const rssItems = await fetchTrendsRss(geo);
    if (rssItems.length > 0) {
      const result: TrendsResult = {
        trendingNow: rssItems,
        garmentInterest: generateSyntheticTrends(geo, garments).garmentInterest,
        risingDesigners: generateSyntheticTrends(geo, [], designers).risingDesigners,
        topKeywords: generateSyntheticTrends(geo).topKeywords,
        source: 'rss-fallback',
        fetchedAt: Date.now(),
      };
      setCache(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('RSS fallback failed:', err instanceof Error ? err.message : err);
  }

  // Attempt 3: Synthetic fallback
  const synthetic = generateSyntheticTrends(geo, garments, designers);
  setCache(cacheKey, synthetic);
  return synthetic;
}

/**
 * Fetch trend data using the google-trends-api package.
 * Makes multiple calls in parallel for different data facets.
 */
async function fetchWithPackage(
  geo: string,
  type: string,
  garments: string[],
  designers: string[],
  keyword?: string
): Promise<TrendsResult> {
  // Run multiple API calls in parallel with individual timeouts
  const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
    ]);
  };

  const [fashionQueries, dailyTrending, garmentData, designerQueries] = await Promise.all([
    // 1. Fashion-related queries for this country
    withTimeout(
      fetchRelatedQueries(keyword || 'fashion', geo, 185),
      10000,
      { rising: [], top: [] }
    ),

    // 2. Daily trending (filtered for fashion)
    withTimeout(fetchDailyTrends(geo), 10000, []),

    // 3. Interest over time for garments (max 5)
    garments.length > 0
      ? withTimeout(
          fetchInterestOverTime(garments.slice(0, 5), geo, 185),
          10000,
          {} as Record<string, InterestPoint[]>
        )
      : Promise.resolve({} as Record<string, InterestPoint[]>),

    // 4. Designer-related queries
    designers.length > 0
      ? withTimeout(
          fetchRelatedQueries(designers[0] + ' fashion', geo, 185),
          10000,
          { rising: [], top: [] }
        )
      : Promise.resolve({ rising: [] as TrendQuery[], top: [] as TrendQuery[] }),
  ]);

  // Merge trending: rising queries + daily trending
  const trendingNow: TrendQuery[] = [
    ...fashionQueries.rising.slice(0, 5),
    ...dailyTrending.slice(0, 5),
  ].slice(0, 10);

  // If we didn't get enough from the API, supplement with top queries
  if (trendingNow.length < 3) {
    for (const q of fashionQueries.top.slice(0, 5 - trendingNow.length)) {
      trendingNow.push(q);
    }
  }

  // Rising designers from related queries
  const risingDesigners: TrendQuery[] = [
    ...designerQueries.rising.slice(0, 5),
    ...designerQueries.top.slice(0, 3),
  ].slice(0, 8);

  // Build top keywords with interest-over-time
  // Use fashion queries as keywords, fetch their time series
  const topKeywordNames = fashionQueries.top.slice(0, 5).map(q => q.title);
  let topKeywordTimeseries: Record<string, InterestPoint[]> = {};
  if (topKeywordNames.length > 0) {
    topKeywordTimeseries = await withTimeout(
      fetchInterestOverTime(topKeywordNames, geo, 185),
      10000,
      {}
    );
  }

  const topKeywords = topKeywordNames.map(keyword => ({
    keyword,
    data: topKeywordTimeseries[keyword] || [],
  }));

  return {
    trendingNow,
    garmentInterest: garmentData,
    risingDesigners,
    topKeywords,
    source: 'google-trends-api',
    fetchedAt: Date.now(),
  };
}

/**
 * Check if a specific garment is "trending" (has rising search interest).
 * Returns a score from 0-100, where >50 means it's trending upward.
 */
export function getGarmentTrendScore(
  garmentData: InterestPoint[]
): { trending: boolean; direction: 'up' | 'down' | 'stable'; score: number } {
  if (!garmentData || garmentData.length < 3) {
    return { trending: false, direction: 'stable', score: 0 };
  }

  // Compare last 3 months average vs previous 3 months
  const recent = garmentData.slice(-3);
  const previous = garmentData.slice(-6, -3);

  if (previous.length === 0) {
    return { trending: false, direction: 'stable', score: 50 };
  }

  const recentAvg = recent.reduce((s, p) => s + p.value, 0) / recent.length;
  const previousAvg = previous.reduce((s, p) => s + p.value, 0) / previous.length;

  const changePercent = previousAvg > 0
    ? ((recentAvg - previousAvg) / previousAvg) * 100
    : 0;

  const score = Math.max(0, Math.min(100, Math.round(50 + changePercent)));

  return {
    trending: changePercent > 15,
    direction: changePercent > 10 ? 'up' : changePercent < -10 ? 'down' : 'stable',
    score,
  };
}
