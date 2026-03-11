/**
 * World Bank Open Data API client.
 * Completely free, no API key required.
 * Data is updated annually; we cache for 24 hours.
 */

const WB_BASE = 'https://api.worldbank.org/v2';

// ---------------------------------------------------------------------------
// Indicator codes relevant to fashion/textile industry
// ---------------------------------------------------------------------------

export const WB_INDICATORS = {
  gdp: 'NY.GDP.MKTP.CD',                    // GDP (current US$)
  population: 'SP.POP.TOTL',                 // Total population
  manufacturingPct: 'NV.IND.MANF.ZS',        // Manufacturing value added (% of GDP)
  industryPct: 'NV.IND.TOTL.ZS',             // Industry value added (% of GDP)
  industryEmploymentPct: 'SL.IND.EMPL.ZS',   // Employment in industry (% of total)
  manufacturesExportsPct: 'TX.VAL.MANF.ZS.UN',// Manufactures exports (% of merch exports)
  manufacturesImportsPct: 'TM.VAL.MANF.ZS.UN',// Manufactures imports (% of merch imports)
  exportsGoodsPct: 'NE.EXP.GNFS.ZS',         // Exports of goods & services (% of GDP)
  laborForce: 'SL.TLF.TOTL.IN',              // Labor force total
} as const;

export type IndicatorKey = keyof typeof WB_INDICATORS;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WBIndicatorValue {
  indicator: string;
  indicatorName: string;
  value: number | null;
  year: number;
  country: string;
  countryName: string;
}

export interface WBCountryEconomics {
  countryIso: string;
  countryName: string;
  gdp: WBIndicatorValue | null;
  population: WBIndicatorValue | null;
  manufacturingPct: WBIndicatorValue | null;
  industryPct: WBIndicatorValue | null;
  industryEmploymentPct: WBIndicatorValue | null;
  manufacturesExportsPct: WBIndicatorValue | null;
  manufacturesImportsPct: WBIndicatorValue | null;
  exportsGoodsPct: WBIndicatorValue | null;
  laborForce: WBIndicatorValue | null;
}

// ---------------------------------------------------------------------------
// World Bank response format: [metadata, data[]]
// ---------------------------------------------------------------------------

interface WBApiRecord {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

// ---------------------------------------------------------------------------
// Fetch a single indicator
// ---------------------------------------------------------------------------

export async function fetchIndicator(
  countryIso: string,
  indicatorCode: string
): Promise<WBIndicatorValue | null> {
  const url = `${WB_BASE}/country/${countryIso}/indicator/${indicatorCode}?format=json&date=2015:2024&per_page=20`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const json = await response.json();

    // World Bank returns [metadata, data[]] or [{message: ...}] on error
    if (!Array.isArray(json) || json.length < 2) return null;

    const data = json[1] as WBApiRecord[] | null;
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    // Find the most recent non-null value
    const sorted = data
      .filter((d) => d.value !== null)
      .sort((a, b) => parseInt(b.date) - parseInt(a.date));

    if (sorted.length === 0) return null;

    const latest = sorted[0];
    return {
      indicator: latest.indicator.id,
      indicatorName: latest.indicator.value,
      value: latest.value,
      year: parseInt(latest.date),
      country: latest.country.id,
      countryName: latest.country.value,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fetch all relevant indicators for a country in parallel
// ---------------------------------------------------------------------------

export async function fetchCountryEconomics(
  countryIso: string
): Promise<WBCountryEconomics> {
  const keys = Object.keys(WB_INDICATORS) as IndicatorKey[];

  const results = await Promise.allSettled(
    keys.map((key) => fetchIndicator(countryIso, WB_INDICATORS[key]))
  );

  const economics: WBCountryEconomics = {
    countryIso: countryIso.toUpperCase(),
    countryName: '',
    gdp: null,
    population: null,
    manufacturingPct: null,
    industryPct: null,
    industryEmploymentPct: null,
    manufacturesExportsPct: null,
    manufacturesImportsPct: null,
    exportsGoodsPct: null,
    laborForce: null,
  };

  keys.forEach((key, i) => {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) {
      economics[key] = result.value;
      // Capture country name from any successful response
      if (!economics.countryName && result.value.countryName) {
        economics.countryName = result.value.countryName;
      }
    }
  });

  return economics;
}
