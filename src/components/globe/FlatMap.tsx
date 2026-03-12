'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGlobeStore } from '@/store/useGlobeStore';
import { GEOJSON_URL, METRICS } from '@/lib/constants';
import { interpolateColor } from '@/lib/utils';
import type { GeoJSON, GeoFeature } from '@/types/globe';
import type { CountryBase } from '@/types/country';

// ---- helpers (shared logic with FashionGlobe) ----

const CLIMATE_COLORS: Record<string, string> = {
  tropical: 'rgb(255, 184, 0)',
  arid: 'rgb(212, 165, 116)',
  temperate: 'rgb(0, 196, 140)',
  continental: 'rgb(74, 144, 217)',
  polar: 'rgb(232, 232, 232)',
};

function inferClimateZone(lat: number, subregion: string): string {
  const absLat = Math.abs(lat);
  const sub = subregion.toLowerCase();
  if (absLat >= 66) return 'polar';
  if (
    (absLat >= 15 && absLat <= 35 &&
      (sub.includes('northern africa') || sub.includes('western asia'))) ||
    sub.includes('central asia') ||
    (sub.includes('australia') && absLat >= 20)
  ) {
    return 'arid';
  }
  if (absLat <= 23.5) return 'tropical';
  if (absLat >= 50) return 'continental';
  return 'temperate';
}

const ISO3_TO_ISO2: Record<string, string> = {
  AFG: 'AF', ALB: 'AL', DZA: 'DZ', AND: 'AD', AGO: 'AO', ATG: 'AG', ARG: 'AR',
  ARM: 'AM', AUS: 'AU', AUT: 'AT', AZE: 'AZ', BHS: 'BS', BHR: 'BH', BGD: 'BD',
  BRB: 'BB', BLR: 'BY', BEL: 'BE', BLZ: 'BZ', BEN: 'BJ', BTN: 'BT', BOL: 'BO',
  BIH: 'BA', BWA: 'BW', BRA: 'BR', BRN: 'BN', BGR: 'BG', BFA: 'BF', BDI: 'BI',
  KHM: 'KH', CMR: 'CM', CAN: 'CA', CPV: 'CV', CAF: 'CF', TCD: 'TD', CHL: 'CL',
  CHN: 'CN', COL: 'CO', COM: 'KM', COG: 'CG', COD: 'CD', CRI: 'CR', CIV: 'CI',
  HRV: 'HR', CUB: 'CU', CYP: 'CY', CZE: 'CZ', DNK: 'DK', DJI: 'DJ', DMA: 'DM',
  DOM: 'DO', ECU: 'EC', EGY: 'EG', SLV: 'SV', GNQ: 'GQ', ERI: 'ER', EST: 'EE',
  SWZ: 'SZ', ETH: 'ET', FJI: 'FJ', FIN: 'FI', FRA: 'FR', GAB: 'GA', GMB: 'GM',
  GEO: 'GE', DEU: 'DE', GHA: 'GH', GRC: 'GR', GRD: 'GD', GTM: 'GT', GIN: 'GN',
  GNB: 'GW', GUY: 'GY', HTI: 'HT', HND: 'HN', HUN: 'HU', ISL: 'IS', IND: 'IN',
  IDN: 'ID', IRN: 'IR', IRQ: 'IQ', IRL: 'IE', ISR: 'IL', ITA: 'IT', JAM: 'JM',
  JPN: 'JP', JOR: 'JO', KAZ: 'KZ', KEN: 'KE', KIR: 'KI', PRK: 'KP', KOR: 'KR',
  KWT: 'KW', KGZ: 'KG', LAO: 'LA', LVA: 'LV', LBN: 'LB', LSO: 'LS', LBR: 'LR',
  LBY: 'LY', LIE: 'LI', LTU: 'LT', LUX: 'LU', MDG: 'MG', MWI: 'MW', MYS: 'MY',
  MDV: 'MV', MLI: 'ML', MLT: 'MT', MHL: 'MH', MRT: 'MR', MUS: 'MU', MEX: 'MX',
  FSM: 'FM', MDA: 'MD', MCO: 'MC', MNG: 'MN', MNE: 'ME', MAR: 'MA', MOZ: 'MZ',
  MMR: 'MM', NAM: 'NA', NRU: 'NR', NPL: 'NP', NLD: 'NL', NZL: 'NZ', NIC: 'NI',
  NER: 'NE', NGA: 'NG', MKD: 'MK', NOR: 'NO', OMN: 'OM', PAK: 'PK', PLW: 'PW',
  PAN: 'PA', PNG: 'PG', PRY: 'PY', PER: 'PE', PHL: 'PH', POL: 'PL', PRT: 'PT',
  QAT: 'QA', ROU: 'RO', RUS: 'RU', RWA: 'RW', KNA: 'KN', LCA: 'LC', VCT: 'VC',
  WSM: 'WS', SMR: 'SM', STP: 'ST', SAU: 'SA', SEN: 'SN', SRB: 'RS', SYC: 'SC',
  SLE: 'SL', SGP: 'SG', SVK: 'SK', SVN: 'SI', SLB: 'SB', SOM: 'SO', ZAF: 'ZA',
  SSD: 'SS', ESP: 'ES', LKA: 'LK', SDN: 'SD', SUR: 'SR', SWE: 'SE', CHE: 'CH',
  SYR: 'SY', TWN: 'TW', TJK: 'TJ', TZA: 'TZ', THA: 'TH', TLS: 'TL', TGO: 'TG',
  TON: 'TO', TTO: 'TT', TUN: 'TN', TUR: 'TR', TKM: 'TM', TUV: 'TV', UGA: 'UG',
  UKR: 'UA', ARE: 'AE', GBR: 'GB', USA: 'US', URY: 'UY', UZB: 'UZ', VUT: 'VU',
  VEN: 'VE', VNM: 'VN', YEM: 'YE', ZMB: 'ZM', ZWE: 'ZW', PSE: 'PS', XKX: 'XK',
  SDS: 'SS', SOL: 'SB', CYN: 'CY', KOS: 'XK',
};

function iso3toIso2(iso3: string): string {
  return ISO3_TO_ISO2[iso3] || '';
}

// ---- Equirectangular projection helpers ----

interface ProjectionConfig {
  width: number;
  height: number;
  padding: number;
}

function projectLng(lng: number, cfg: ProjectionConfig): number {
  return cfg.padding + ((lng + 180) / 360) * (cfg.width - cfg.padding * 2);
}

function projectLat(lat: number, cfg: ProjectionConfig): number {
  return cfg.padding + ((90 - lat) / 180) * (cfg.height - cfg.padding * 2);
}

/** Convert a ring of [lng, lat] coordinate pairs to an SVG path d-string. */
function ringToPath(ring: number[][], cfg: ProjectionConfig): string {
  if (ring.length === 0) return '';
  const parts: string[] = [];
  for (let i = 0; i < ring.length; i++) {
    const x = projectLng(ring[i][0], cfg);
    const y = projectLat(ring[i][1], cfg);
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  parts.push('Z');
  return parts.join('');
}

/** Convert a GeoJSON geometry to an SVG path d-string. */
function geometryToPath(feature: GeoFeature, cfg: ProjectionConfig): string {
  const { type, coordinates } = feature.geometry;
  const paths: string[] = [];

  if (type === 'Polygon') {
    const polygonCoords = coordinates as number[][][];
    for (const ring of polygonCoords) {
      paths.push(ringToPath(ring, cfg));
    }
  } else if (type === 'MultiPolygon') {
    const multiCoords = coordinates as number[][][][];
    for (const polygon of multiCoords) {
      for (const ring of polygon) {
        paths.push(ringToPath(ring, cfg));
      }
    }
  }

  return paths.join(' ');
}

// ---- Tooltip state ----
interface MapTooltip {
  name: string;
  flag: string;
  x: number;
  y: number;
}

// ---- Component ----

export function FlatMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 0, height: 0 };
  });
  const [localTooltip, setLocalTooltip] = useState<MapTooltip | null>(null);

  const countries = useGlobeStore((s) => s.countries);
  const selectedCountry = useGlobeStore((s) => s.selectedCountry);
  const activeMetric = useGlobeStore((s) => s.activeMetric);
  const selectCountry = useGlobeStore((s) => s.selectCountry);
  const setGlobeReady = useGlobeStore((s) => s.setGlobeReady);
  const getFilteredCountries = useGlobeStore((s) => s.getFilteredCountries);
  const searchResults = useGlobeStore((s) => s.searchResults);
  const overlayMode = useGlobeStore((s) => s.overlayMode);

  // Filtered & search-highlighted ISOs
  const highlightedIsos = useMemo(() => {
    const filtered = new Set(getFilteredCountries());
    if (searchResults.length > 0) {
      return new Set(searchResults.filter((iso) => filtered.has(iso)));
    }
    return filtered;
  }, [getFilteredCountries, searchResults]);

  const hasActiveFilters = useMemo(
    () => highlightedIsos.size < countries.length,
    [highlightedIsos, countries.length]
  );

  // Country lookup
  const countryMap = useMemo(() => {
    const map = new Map<string, CountryBase>();
    countries.forEach((c) => map.set(c.iso, c));
    return map;
  }, [countries]);

  // Metric range
  const metricRange = useMemo(() => {
    if (countries.length === 0) return { min: 0, max: 100 };
    const values = countries.map((c) => {
      const val = c[activeMetric];
      return typeof val === 'number' ? val : 0;
    });
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [countries, activeMetric]);

  // Fetch GeoJSON
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    fetch(GEOJSON_URL, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: GeoJSON) => {
        setGeoData(data);
        setGlobeReady(true);
      })
      .catch((err) => {
        console.error('GeoJSON fetch failed:', err);
        setFetchError(err.message);
        setGlobeReady(true);
      });

    return () => { clearTimeout(timeout); controller.abort(); };
  }, [setGlobeReady]);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Projection config
  const projCfg = useMemo<ProjectionConfig>(
    () => ({ width: dimensions.width, height: dimensions.height, padding: 8 }),
    [dimensions]
  );

  // Pre-compute paths and colors
  const featureData = useMemo(() => {
    if (!geoData || dimensions.width === 0) return [];

    return geoData.features
      .filter((f) => {
        const iso2 = f.properties?.ISO_A2;
        return iso2 && iso2 !== '-99';
      })
      .map((feature) => {
        const iso3 = feature.properties.ISO_A3;
        const iso2 = feature.properties.ISO_A2 !== '-99'
          ? feature.properties.ISO_A2
          : iso3toIso2(iso3);

        if (!iso2 || iso2 === '-99') return null;

        const d = geometryToPath(feature, projCfg);
        if (!d) return null;

        return { feature, iso2, d, name: feature.properties.NAME };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [geoData, dimensions, projCfg]);

  // Compute fill color for a country
  const getFillColor = useCallback(
    (iso2: string): string => {
      const country = countryMap.get(iso2);
      if (!country) return 'rgba(15, 22, 41, 0.6)';

      if (iso2 === selectedCountry) return 'rgba(233, 69, 96, 0.85)';

      if (hasActiveFilters && !highlightedIsos.has(iso2)) {
        return 'rgba(15, 22, 41, 0.3)';
      }

      switch (overlayMode) {
        case 'sustainability': {
          const score = country.sustainabilityScore ?? 0;
          return interpolateColor(score, 0, 100, [255, 71, 87], [0, 196, 140]);
        }
        case 'climate': {
          const lat = country.coordinates[0];
          const zone = inferClimateZone(lat, country.subregion);
          return CLIMATE_COLORS[zone] || 'rgba(15, 22, 41, 0.6)';
        }
        case 'fashionWeek': {
          if (country.fashionWeeks && country.fashionWeeks.length > 0) {
            return 'rgba(233, 69, 96, 0.85)';
          }
          return 'rgba(15, 22, 41, 0.4)';
        }
        case 'metric':
        default: {
          const value = typeof country[activeMetric] === 'number'
            ? (country[activeMetric] as number)
            : 0;
          return interpolateColor(
            value,
            metricRange.min,
            metricRange.max,
            [15, 52, 96],
            [233, 69, 96]
          );
        }
      }
    },
    [countryMap, activeMetric, metricRange, selectedCountry, hasActiveFilters, highlightedIsos, overlayMode]
  );

  const handleClick = useCallback(
    (iso2: string) => {
      if (iso2 === selectedCountry) {
        selectCountry(null);
      } else {
        selectCountry(iso2);
      }
    },
    [selectedCountry, selectCountry]
  );

  // Detect touch device to skip hover-only interactions
  const isTouchRef = useRef(false);
  useEffect(() => {
    isTouchRef.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const handlePointerEnter = useCallback(
    (iso2: string, name: string, e: React.PointerEvent) => {
      // Skip hover tooltip on touch — tooltip shows on tap via handleClick
      if (isTouchRef.current) return;

      const country = countryMap.get(iso2);
      const flag = country?.flag ?? '';
      setLocalTooltip({ name, flag, x: e.clientX, y: e.clientY });

      // Also set store tooltip for consistency
      if (country) {
        const metricLabel = METRICS.find((m) => m.key === activeMetric)?.label || activeMetric;
        const value = typeof country[activeMetric] === 'number'
          ? (country[activeMetric] as number)
          : 0;
        useGlobeStore.getState().setTooltip({
          iso: iso2,
          name: country.name,
          flag: country.flag,
          value,
          metric: metricLabel,
          x: e.clientX,
          y: e.clientY,
        });
      }
    },
    [countryMap, activeMetric]
  );

  const handlePointerLeave = useCallback(() => {
    if (isTouchRef.current) return;
    setLocalTooltip(null);
    useGlobeStore.getState().setTooltip(null);
  }, []);

  const handlePointerMove = useCallback(
    (name: string, flag: string, e: React.PointerEvent) => {
      if (isTouchRef.current) return;
      setLocalTooltip({ name, flag, x: e.clientX, y: e.clientY });
    },
    []
  );

  if (fetchError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted text-sm">Map data failed to load</p>
          <button
            onClick={() => window.location.reload()}
            className="text-accent text-xs mt-2 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!geoData) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-muted text-sm font-mono">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="block"
        style={{ background: '#0A0A1A' }}
      >
        {/* Grid lines for visual reference */}
        <g opacity={0.08} stroke="#F0F0F5" strokeWidth={0.5} fill="none">
          {/* Latitude lines */}
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = projectLat(lat, projCfg);
            return (
              <line
                key={`lat-${lat}`}
                x1={projCfg.padding}
                y1={y}
                x2={dimensions.width - projCfg.padding}
                y2={y}
              />
            );
          })}
          {/* Longitude lines */}
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lng) => {
            const x = projectLng(lng, projCfg);
            return (
              <line
                key={`lng-${lng}`}
                x1={x}
                y1={projCfg.padding}
                x2={x}
                y2={dimensions.height - projCfg.padding}
              />
            );
          })}
        </g>

        {/* Country polygons */}
        {featureData.map(({ iso2, d, name }) => {
          const country = countryMap.get(iso2);
          const flag = country?.flag ?? '';
          return (
            <path
              key={iso2}
              d={d}
              fill={getFillColor(iso2)}
              stroke="rgba(240, 240, 245, 0.2)"
              strokeWidth={iso2 === selectedCountry ? 1.5 : 0.5}
              className="transition-colors duration-200 cursor-pointer"
              style={{ touchAction: 'manipulation' }}
              onClick={() => handleClick(iso2)}
              onPointerEnter={(e) => handlePointerEnter(iso2, name, e)}
              onPointerLeave={handlePointerLeave}
              onPointerMove={(e) => handlePointerMove(name, flag, e)}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {localTooltip && (
        <div
          className="fixed z-50 pointer-events-none glass-panel rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap"
          style={{
            left: localTooltip.x + 12,
            top: localTooltip.y - 30,
          }}
        >
          <span className="mr-1.5">{localTooltip.flag}</span>
          {localTooltip.name}
        </div>
      )}
    </div>
  );
}
