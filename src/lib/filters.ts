import type { CountryBase } from '@/types/country';

export interface FilterState {
  regionFilter: string | null;
  tierFilter: string[];
  fashionIndexRange: [number, number];
  marketSizeRange: [number, number];
  sustainabilityRange: [number, number];
  fabricFilter: string[];
  fashionWeekFilter: string[];
  climateFilter: string[];
  textileHeritage: boolean;
  colorFilter: string | null;
}

export const DEFAULT_FILTERS: FilterState = {
  regionFilter: null,
  tierFilter: [],
  fashionIndexRange: [0, 100],
  marketSizeRange: [0, 400],
  sustainabilityRange: [0, 100],
  fabricFilter: [],
  fashionWeekFilter: [],
  climateFilter: [],
  textileHeritage: false,
  colorFilter: null,
};

export const FABRIC_OPTIONS = [
  'Silk',
  'Cotton',
  'Wool',
  'Linen',
  'Denim',
  'Polyester',
  'Cashmere',
  'Leather',
] as const;

export const FASHION_WEEK_CITIES = [
  'Paris',
  'Milan',
  'New York',
  'London',
  'Tokyo',
  'Berlin',
  'Shanghai',
  'Seoul',
  'Lagos',
  'Mumbai',
  'Sydney',
  'Sao Paulo',
] as const;

export const CLIMATE_ZONES = [
  'Tropical',
  'Arid',
  'Temperate',
  'Continental',
  'Polar',
] as const;

export const TIER_OPTIONS = ['A', 'B', 'C', 'skeleton'] as const;

/**
 * Parses a hex color string into [r, g, b] components.
 * Returns null if the string is not a valid hex color.
 */
function parseHex(hex: string): [number, number, number] | null {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6 && cleaned.length !== 3) return null;
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return [r, g, b];
}

/**
 * Computes the Euclidean distance between two RGB colors.
 */
function colorDistance(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

/** Threshold for color similarity (0-441, lower = stricter). 80 is fairly permissive. */
const COLOR_DISTANCE_THRESHOLD = 80;

/**
 * Applies all active filters to the countries array and returns matching ISO codes.
 * Each filter is only applied when its value differs from the default (inactive) state.
 */
export function applyFilters(
  countries: CountryBase[],
  filters: FilterState
): string[] {
  return countries
    .filter((country) => {
      // 1. Region filter
      if (
        filters.regionFilter !== null &&
        country.region !== filters.regionFilter
      ) {
        return false;
      }

      // 2. Tier filter
      if (
        filters.tierFilter.length > 0 &&
        !filters.tierFilter.includes(country.tier)
      ) {
        return false;
      }

      // 3. Fashion Index range
      if (
        country.fashionIndex < filters.fashionIndexRange[0] ||
        country.fashionIndex > filters.fashionIndexRange[1]
      ) {
        return false;
      }

      // 4. Market Size range
      if (
        country.marketSize < filters.marketSizeRange[0] ||
        country.marketSize > filters.marketSizeRange[1]
      ) {
        return false;
      }

      // 5. Sustainability range
      if (
        country.sustainabilityScore < filters.sustainabilityRange[0] ||
        country.sustainabilityScore > filters.sustainabilityRange[1]
      ) {
        return false;
      }

      // 6. Primary Fabrics (multi-select: country must have at least one matching fabric)
      if (filters.fabricFilter.length > 0) {
        const hasMatch = filters.fabricFilter.some((fabric) =>
          country.primaryFabrics.some(
            (f) => f.toLowerCase() === fabric.toLowerCase()
          )
        );
        if (!hasMatch) return false;
      }

      // 7. Fashion Week cities (country's fashion weeks must mention at least one selected city)
      if (filters.fashionWeekFilter.length > 0) {
        const hasMatch = filters.fashionWeekFilter.some((city) =>
          country.fashionWeeks.some((fw) =>
            fw.toLowerCase().includes(city.toLowerCase())
          )
        );
        if (!hasMatch) return false;
      }

      // 8. Climate zone
      // CountryBase doesn't have climate directly, but CountryProfile does.
      // For base filtering, we skip if climateFilter is empty. When profile
      // data isn't available, we infer from subregion heuristic.
      if (filters.climateFilter.length > 0) {
        const inferred = inferClimateZone(country);
        if (!filters.climateFilter.includes(inferred)) {
          return false;
        }
      }

      // 9. Textile Heritage toggle
      if (filters.textileHeritage) {
        const hasHeritage =
          country.traditionalGarments.length > 0 ||
          country.primaryFabrics.length > 0;
        if (!hasHeritage) return false;
      }

      // 10. Color filter (hex) -- match against country's colorPalette
      if (filters.colorFilter) {
        const target = parseHex(filters.colorFilter);
        if (target && country.colorPalette.length > 0) {
          const hasClose = country.colorPalette.some((entry) => {
            const parsed = parseHex(entry.hex);
            if (!parsed) return false;
            return colorDistance(target, parsed) < COLOR_DISTANCE_THRESHOLD;
          });
          if (!hasClose) return false;
        } else if (target && country.colorPalette.length === 0) {
          // No palette data -- exclude
          return false;
        }
      }

      return true;
    })
    .map((c) => c.iso);
}

/**
 * Counts how many filters are currently active (differ from defaults).
 */
export function countActiveFilters(filters: FilterState): number {
  let count = 0;
  if (filters.regionFilter !== null) count++;
  if (filters.tierFilter.length > 0) count++;
  if (
    filters.fashionIndexRange[0] !== DEFAULT_FILTERS.fashionIndexRange[0] ||
    filters.fashionIndexRange[1] !== DEFAULT_FILTERS.fashionIndexRange[1]
  )
    count++;
  if (
    filters.marketSizeRange[0] !== DEFAULT_FILTERS.marketSizeRange[0] ||
    filters.marketSizeRange[1] !== DEFAULT_FILTERS.marketSizeRange[1]
  )
    count++;
  if (
    filters.sustainabilityRange[0] !== DEFAULT_FILTERS.sustainabilityRange[0] ||
    filters.sustainabilityRange[1] !== DEFAULT_FILTERS.sustainabilityRange[1]
  )
    count++;
  if (filters.fabricFilter.length > 0) count++;
  if (filters.fashionWeekFilter.length > 0) count++;
  if (filters.climateFilter.length > 0) count++;
  if (filters.textileHeritage) count++;
  if (filters.colorFilter !== null) count++;
  return count;
}

/**
 * Heuristic climate zone inference based on subregion and coordinates.
 * This is a rough approximation for filtering purposes when profile data
 * isn't loaded.
 */
function inferClimateZone(country: CountryBase): string {
  const lat = Math.abs(country.coordinates[0]);
  const subregion = country.subregion.toLowerCase();

  // Polar
  if (lat > 66) return 'Polar';

  // Tropical regions
  if (
    subregion.includes('caribbean') ||
    subregion.includes('central africa') ||
    subregion.includes('western africa') ||
    subregion.includes('south-eastern asia') ||
    subregion.includes('melanesia') ||
    subregion.includes('micronesia') ||
    subregion.includes('polynesia')
  ) {
    return 'Tropical';
  }
  if (lat < 23.5) return 'Tropical';

  // Arid
  if (
    subregion.includes('northern africa') ||
    subregion.includes('western asia') ||
    subregion.includes('central asia')
  ) {
    return 'Arid';
  }

  // Continental
  if (
    subregion.includes('eastern europe') ||
    subregion.includes('northern europe') ||
    subregion.includes('eastern asia')
  ) {
    return lat > 45 ? 'Continental' : 'Temperate';
  }

  // Default to temperate for mid-latitudes
  if (lat >= 23.5 && lat <= 66) return 'Temperate';

  return 'Temperate';
}
