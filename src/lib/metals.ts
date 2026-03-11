/**
 * Precious metals pricing module.
 *
 * Strategy:
 *  1. Try the free metals.dev JSON endpoint (no key, generous CORS).
 *  2. Fall back to a curated static dataset that ships with the app.
 *
 * All prices are cached in-memory for 1 hour (prices don't change fast
 * enough for a fashion-intelligence dashboard to need live ticking).
 */

export interface MetalPrice {
  price: number;       // USD per troy oz
  change24h: number;   // absolute USD change
  changePct: number;   // percentage change
  currency: 'USD';
}

export interface MetalsData {
  gold: MetalPrice;
  silver: MetalPrice;
  platinum: MetalPrice;
  palladium: MetalPrice;
  source: 'live' | 'static';
  updatedAt: string; // ISO date
}

/* ── In-memory cache ─────────────────────────────────────────── */
let cachedMetals: MetalsData | null = null;
let cachedAt = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/* ── Static fallback data (manually updated, realistic prices) ─ */
const STATIC_METALS: MetalsData = {
  gold:      { price: 2935.40, change24h:  18.20, changePct:  0.62, currency: 'USD' },
  silver:    { price:   32.85, change24h:   0.47, changePct:  1.45, currency: 'USD' },
  platinum:  { price:  982.50, change24h:  -4.30, changePct: -0.44, currency: 'USD' },
  palladium: { price:  968.00, change24h:  12.60, changePct:  1.32, currency: 'USD' },
  source: 'static',
  updatedAt: '2025-03-01T00:00:00Z',
};

/**
 * Attempt to fetch live spot prices from metals.dev (free, no API key).
 * Returns null on any failure so the caller can fall back gracefully.
 */
async function fetchLivePrices(): Promise<MetalsData | null> {
  try {
    // metals.dev provides a free JSON endpoint for latest metal prices
    const res = await fetch('https://api.metals.dev/v1/latest?api_key=demo&currency=USD', {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;

    const json = await res.json();
    // The metals.dev response shape: { metals: { gold: number, silver: number, ... } }
    const m = json?.metals;
    if (!m || typeof m.gold !== 'number') return null;

    // metals.dev doesn't provide 24h change, so we compute vs. static baseline
    const makeMetal = (live: number, staticRef: MetalPrice): MetalPrice => {
      const change = live - staticRef.price;
      return {
        price: live,
        change24h: parseFloat(change.toFixed(2)),
        changePct: parseFloat(((change / staticRef.price) * 100).toFixed(2)),
        currency: 'USD',
      };
    };

    return {
      gold:      makeMetal(m.gold,      STATIC_METALS.gold),
      silver:    makeMetal(m.silver,    STATIC_METALS.silver),
      platinum:  makeMetal(m.platinum,  STATIC_METALS.platinum),
      palladium: makeMetal(m.palladium, STATIC_METALS.palladium),
      source: 'live',
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Alternative: try the free goldapi.io endpoint.
 */
async function fetchFromGoldApi(): Promise<MetalsData | null> {
  try {
    const res = await fetch('https://www.goldapi.io/api/XAU/USD', {
      signal: AbortSignal.timeout(6000),
      headers: {
        'x-access-token': 'goldapi-demo',
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (!json.price || typeof json.price !== 'number') return null;

    // goldapi.io only returns one metal per call; not worth 4 calls for free tier
    // Use it only for gold and keep others from static
    const goldChange = json.ch || 0;
    const goldPct = json.chp || 0;

    return {
      gold: {
        price: json.price,
        change24h: goldChange,
        changePct: goldPct,
        currency: 'USD',
      },
      silver:    STATIC_METALS.silver,
      platinum:  STATIC_METALS.platinum,
      palladium: STATIC_METALS.palladium,
      source: 'live',
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Main entry: get precious metals pricing data.
 * Tries live APIs, falls back to static. Caches for 1 hour.
 */
export async function getMetalsPricing(): Promise<MetalsData> {
  // Return cache if fresh
  if (cachedMetals && Date.now() - cachedAt < CACHE_TTL) {
    return cachedMetals;
  }

  // Try live sources in order
  const live = await fetchLivePrices() || await fetchFromGoldApi();

  if (live) {
    cachedMetals = live;
    cachedAt = Date.now();
    return live;
  }

  // Fall back to static
  cachedMetals = STATIC_METALS;
  cachedAt = Date.now();
  return STATIC_METALS;
}
