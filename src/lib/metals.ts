/**
 * Precious metals pricing module.
 *
 * Strategy:
 *  1. Try Swissquote forex feed (free, no key, live prices).
 *  2. Fall back to a curated static dataset that ships with the app.
 *
 * All prices are cached in-memory for 30 minutes.
 */

export interface MetalPrice {
  price: number;       // USD per troy oz
  pricePerGram: number; // USD per gram
  change24h: number;   // absolute USD change
  changePct: number;   // percentage change
  currency: 'USD';
}

export interface MetalsData {
  gold: MetalPrice;
  silver: MetalPrice;
  platinum: MetalPrice;
  palladium: MetalPrice;
  usdInr: number;      // USD to INR exchange rate
  goldIndiaRetail10g: number; // Indian retail gold price per 10g (includes ~6% duty/GST estimate)
  source: 'live' | 'static';
  updatedAt: string; // ISO date
}

// 1 troy ounce = 31.1035 grams
const TROY_OZ_TO_GRAMS = 31.1035;

// Indian gold retail premium over international spot (~6% import duty + 3% GST ≈ 6% net effective)
const INDIA_GOLD_PREMIUM = 1.06;

/* ── In-memory cache ─────────────────────────────────────────── */
let cachedMetals: MetalsData | null = null;
let cachedAt = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/* ── Static fallback data (updated March 2026) ─────────────── */
const STATIC_USD_INR = 92.04;

function makeMetalPrice(pricePerOz: number, change24h = 0, changePct = 0): MetalPrice {
  return {
    price: pricePerOz,
    pricePerGram: pricePerOz / TROY_OZ_TO_GRAMS,
    change24h,
    changePct,
    currency: 'USD',
  };
}

const STATIC_METALS: MetalsData = {
  gold:      makeMetalPrice(5184, 32.50, 0.63),
  silver:    makeMetalPrice(86.71, 1.22, 1.43),
  platinum:  makeMetalPrice(2175, -8.50, -0.39),
  palladium: makeMetalPrice(1656, 14.80, 0.90),
  usdInr: STATIC_USD_INR,
  goldIndiaRetail10g: Math.round((5184 / TROY_OZ_TO_GRAMS) * 10 * STATIC_USD_INR * INDIA_GOLD_PREMIUM),
  source: 'static',
  updatedAt: '2026-03-11T00:00:00Z',
};

/**
 * Fetch USD/INR exchange rate from a free API.
 */
async function fetchUsdInr(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return STATIC_USD_INR;
    const json = await res.json();
    const rate = json?.rates?.INR;
    return typeof rate === 'number' ? rate : STATIC_USD_INR;
  } catch {
    return STATIC_USD_INR;
  }
}

/**
 * Fetch a single metal price from Swissquote forex feed.
 * Symbols: XAU (gold), XAG (silver), XPT (platinum), XPD (palladium).
 * Returns mid price (average of bid/ask) or null on failure.
 */
async function fetchSwissquotePrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/${symbol}/USD`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const prices = json?.[0]?.spreadProfilePrices;
    if (!Array.isArray(prices) || prices.length === 0) return null;
    const p = prices[0];
    if (typeof p.bid !== 'number' || typeof p.ask !== 'number') return null;
    return (p.bid + p.ask) / 2;
  } catch {
    return null;
  }
}

/**
 * Fetch all precious metal prices from Swissquote (free, no API key).
 * Makes 4 parallel requests for gold, silver, platinum, palladium.
 */
async function fetchLivePrices(usdInr: number): Promise<MetalsData | null> {
  try {
    const [goldPrice, silverPrice, platPrice, palPrice] = await Promise.all([
      fetchSwissquotePrice('XAU'),
      fetchSwissquotePrice('XAG'),
      fetchSwissquotePrice('XPT'),
      fetchSwissquotePrice('XPD'),
    ]);

    // At minimum we need gold to succeed
    if (goldPrice === null) return null;

    const makeLive = (live: number | null, staticRef: MetalPrice): MetalPrice => {
      if (live === null) return staticRef;
      const change = live - staticRef.price;
      return {
        price: parseFloat(live.toFixed(2)),
        pricePerGram: parseFloat((live / TROY_OZ_TO_GRAMS).toFixed(2)),
        change24h: parseFloat(change.toFixed(2)),
        changePct: parseFloat(((change / staticRef.price) * 100).toFixed(2)),
        currency: 'USD',
      };
    };

    const gold = makeLive(goldPrice, STATIC_METALS.gold);

    return {
      gold,
      silver:    makeLive(silverPrice, STATIC_METALS.silver),
      platinum:  makeLive(platPrice,   STATIC_METALS.platinum),
      palladium: makeLive(palPrice,    STATIC_METALS.palladium),
      usdInr,
      goldIndiaRetail10g: Math.round(gold.pricePerGram * 10 * usdInr * INDIA_GOLD_PREMIUM),
      source: 'live',
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Main entry: get precious metals pricing data.
 * Tries Swissquote live API, falls back to static. Caches for 30 min.
 */
export async function getMetalsPricing(): Promise<MetalsData> {
  // Return cache if fresh
  if (cachedMetals && Date.now() - cachedAt < CACHE_TTL) {
    return cachedMetals;
  }

  // Fetch USD/INR rate in parallel with metals
  const usdInr = await fetchUsdInr();

  // Try live Swissquote feed
  const live = await fetchLivePrices(usdInr);

  if (live) {
    cachedMetals = live;
    cachedAt = Date.now();
    return live;
  }

  // Fall back to static (update INR rate if we got a live one)
  const fallback = {
    ...STATIC_METALS,
    usdInr,
    goldIndiaRetail10g: Math.round((STATIC_METALS.gold.pricePerGram) * 10 * usdInr * INDIA_GOLD_PREMIUM),
  };
  cachedMetals = fallback;
  cachedAt = Date.now();
  return fallback;
}
