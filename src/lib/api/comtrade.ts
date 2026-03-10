import type { IndustryStats } from '@/types/country';
import type { TradeData, TradeProduct, YearlyTrade } from '@/types/api';

const COMTRADE_BASE = 'https://comtradeapi.un.org/data/v1/get/C/A/HS';

// Textile HS codes: chapters 50-63
const TEXTILE_HS_CODES = [
  { code: '61', name: 'Apparel (Knitted)' },
  { code: '62', name: 'Apparel (Woven)' },
  { code: '63', name: 'Textile Articles' },
  { code: '52', name: 'Cotton' },
  { code: '54', name: 'Synthetic Filaments' },
  { code: '55', name: 'Synthetic Staple Fibres' },
  { code: '60', name: 'Knitted Fabrics' },
  { code: '50', name: 'Silk' },
  { code: '51', name: 'Wool & Animal Hair' },
  { code: '53', name: 'Vegetable Fibres' },
  { code: '56', name: 'Wadding & Nonwovens' },
  { code: '57', name: 'Carpets' },
  { code: '58', name: 'Special Woven Fabrics' },
  { code: '59', name: 'Coated Textiles' },
];

// Broader product categories for the synthetic breakdown
const PRODUCT_CATEGORIES: { name: string; hsCode: string; exportShare: number; importShare: number }[] = [
  { name: 'Apparel', hsCode: '61-62', exportShare: 0.42, importShare: 0.38 },
  { name: 'Textiles & Fabrics', hsCode: '50-55', exportShare: 0.25, importShare: 0.28 },
  { name: 'Footwear', hsCode: '64', exportShare: 0.15, importShare: 0.16 },
  { name: 'Leather Goods', hsCode: '42', exportShare: 0.10, importShare: 0.10 },
  { name: 'Accessories', hsCode: '65-67', exportShare: 0.08, importShare: 0.08 },
];

/**
 * Attempt to fetch real trade data from UN Comtrade API.
 * Returns null if unavailable (no API key, rate limited, etc.).
 */
async function fetchFromComtrade(iso: string): Promise<TradeData | null> {
  const apiKey = process.env.COMTRADE_API_KEY;
  if (!apiKey) return null;

  try {
    const currentYear = new Date().getFullYear() - 1; // Latest full year
    const hsCodes = TEXTILE_HS_CODES.map(h => h.code).join(',');

    const url = new URL(COMTRADE_BASE);
    url.searchParams.set('reporterCode', iso);
    url.searchParams.set('period', String(currentYear));
    url.searchParams.set('cmdCode', hsCodes);
    url.searchParams.set('flowCode', 'X,M'); // exports + imports
    url.searchParams.set('partnerCode', '0'); // world
    url.searchParams.set('subscription-key', apiKey);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const json = await response.json();
    if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
      return null;
    }

    // Parse real Comtrade response
    let totalExports = 0;
    let totalImports = 0;
    const productMap = new Map<string, { exports: number; imports: number }>();

    for (const record of json.data) {
      const value = record.primaryValue || 0;
      const flow = record.flowCode; // X = export, M = import
      const hsCode = String(record.cmdCode || '').slice(0, 2);
      const hsEntry = TEXTILE_HS_CODES.find(h => h.code === hsCode);
      const productName = hsEntry?.name || `HS ${hsCode}`;

      if (!productMap.has(productName)) {
        productMap.set(productName, { exports: 0, imports: 0 });
      }
      const entry = productMap.get(productName)!;

      if (flow === 'X') {
        totalExports += value;
        entry.exports += value;
      } else if (flow === 'M') {
        totalImports += value;
        entry.imports += value;
      }
    }

    const topProducts: TradeProduct[] = Array.from(productMap.entries())
      .map(([name, vals]) => ({
        name,
        hsCode: TEXTILE_HS_CODES.find(h => h.name === name)?.code || '00',
        exports: vals.exports,
        imports: vals.imports,
      }))
      .sort((a, b) => (b.exports + b.imports) - (a.exports + a.imports))
      .slice(0, 8);

    return {
      year: currentYear,
      totalExports,
      totalImports,
      tradeBalance: totalExports - totalImports,
      topProducts,
      yearlyTrend: generateYearlyTrend(totalExports, totalImports, currentYear),
    };
  } catch {
    return null;
  }
}

/**
 * Generate synthetic but realistic trade data from existing industryStats.
 * This provides meaningful data when the Comtrade API is unavailable.
 */
function generateSyntheticData(stats: IndustryStats): TradeData {
  const currentYear = new Date().getFullYear() - 1;
  const exportsUSD = stats.textileExportsUSD * 1e9;
  const importsUSD = stats.textileImportsUSD * 1e9;

  // Distribute exports/imports across product categories with some variance
  const seededRandom = createSeededRandom(
    Math.round(exportsUSD / 1e6) + Math.round(importsUSD / 1e6)
  );

  const topProducts: TradeProduct[] = PRODUCT_CATEGORIES.map((cat) => {
    const exportVariance = 0.8 + seededRandom() * 0.4; // 0.8-1.2
    const importVariance = 0.8 + seededRandom() * 0.4;
    return {
      name: cat.name,
      hsCode: cat.hsCode,
      exports: Math.round(exportsUSD * cat.exportShare * exportVariance),
      imports: Math.round(importsUSD * cat.importShare * importVariance),
    };
  }).sort((a, b) => (b.exports + b.imports) - (a.exports + a.imports));

  // Normalize so totals match
  const rawExportTotal = topProducts.reduce((s, p) => s + p.exports, 0);
  const rawImportTotal = topProducts.reduce((s, p) => s + p.imports, 0);
  for (const p of topProducts) {
    p.exports = Math.round(p.exports * (exportsUSD / rawExportTotal));
    p.imports = Math.round(p.imports * (importsUSD / rawImportTotal));
  }

  return {
    year: currentYear,
    totalExports: exportsUSD,
    totalImports: importsUSD,
    tradeBalance: exportsUSD - importsUSD,
    topProducts,
    yearlyTrend: generateYearlyTrend(exportsUSD, importsUSD, currentYear),
  };
}

/**
 * Generate a 5-year trend with realistic growth patterns.
 */
function generateYearlyTrend(
  currentExports: number,
  currentImports: number,
  currentYear: number
): YearlyTrade[] {
  const trend: YearlyTrade[] = [];
  const seed = createSeededRandom(
    Math.round(currentExports / 1e8) * 7 + Math.round(currentImports / 1e8) * 3
  );

  for (let i = 4; i >= 0; i--) {
    const yearOffset = i;
    // Work backwards: slight decline each year going back
    const exportDecay = 1 - yearOffset * (0.03 + seed() * 0.04);
    const importDecay = 1 - yearOffset * (0.02 + seed() * 0.05);
    // Add a COVID dip for 2020 if in range
    const year = currentYear - yearOffset;
    const covidFactor = year === 2020 ? 0.78 + seed() * 0.1 : 1;

    trend.push({
      year,
      exports: Math.round(currentExports * exportDecay * covidFactor),
      imports: Math.round(currentImports * importDecay * covidFactor),
    });
  }

  return trend;
}

/**
 * Simple seeded pseudo-random number generator for deterministic output.
 */
function createSeededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Main entry: fetch trade data for a country ISO code.
 * Tries Comtrade API first, falls back to synthetic data.
 */
export async function fetchTradeData(
  iso: string,
  stats: IndustryStats
): Promise<TradeData> {
  // Try real API first
  const real = await fetchFromComtrade(iso);
  if (real) return real;

  // Fall back to synthetic data derived from industry stats
  return generateSyntheticData(stats);
}
