'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useGlobeStore } from '@/store/useGlobeStore';
import { GLOBE, GEOJSON_URL, METRICS, FASHION_CAPITALS, FASHION_ARCS } from '@/lib/constants';
import { interpolateColor } from '@/lib/utils';
import type { GeoJSON, GeoFeature } from '@/types/globe';
import type { CountryBase } from '@/types/country';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

// Climate zone colors — fully opaque so they pop against dark globe
const CLIMATE_COLORS: Record<string, string> = {
  tropical: 'rgb(255, 184, 0)',
  arid: 'rgb(212, 165, 116)',
  temperate: 'rgb(0, 196, 140)',
  continental: 'rgb(74, 144, 217)',
  polar: 'rgb(220, 220, 235)',
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

// ISO A3 → A2 mapping
function iso3toIso2(iso3: string): string {
  const map: Record<string, string> = {
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
  return map[iso3] || '';
}

export function FashionGlobe() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const countries = useGlobeStore((s) => s.countries);
  const selectedCountry = useGlobeStore((s) => s.selectedCountry);
  const activeMetric = useGlobeStore((s) => s.activeMetric);
  const selectCountry = useGlobeStore((s) => s.selectCountry);
  const setTooltip = useGlobeStore((s) => s.setTooltip);
  const setGlobeReady = useGlobeStore((s) => s.setGlobeReady);
  const panelOpen = useGlobeStore((s) => s.panelOpen);
  const setPanelOpen = useGlobeStore((s) => s.setPanelOpen);
  const getFilteredCountries = useGlobeStore((s) => s.getFilteredCountries);
  const searchResults = useGlobeStore((s) => s.searchResults);
  const overlayMode = useGlobeStore((s) => s.overlayMode);

  // Filtered & search-highlighted country ISOs
  const highlightedIsos = useMemo(() => {
    const filtered = new Set(getFilteredCountries());
    if (searchResults.length > 0) {
      return new Set(searchResults.filter((iso) => filtered.has(iso)));
    }
    return filtered;
  }, [getFilteredCountries, searchResults]);

  const hasActiveFilters = useMemo(() => {
    return highlightedIsos.size < countries.length;
  }, [highlightedIsos, countries.length]);

  // Country lookup map
  const countryMap = useMemo(() => {
    const map = new Map<string, CountryBase>();
    countries.forEach((c) => map.set(c.iso, c));
    return map;
  }, [countries]);

  // Metric range for color interpolation
  const metricRange = useMemo(() => {
    if (countries.length === 0) return { min: 0, max: 100 };
    const values = countries.map((c) => {
      const val = c[activeMetric];
      return typeof val === 'number' ? val : 0;
    });
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [countries, activeMetric]);

  // Fashion week city points — shown in fashionWeek overlay mode
  const fashionWeekPoints = useMemo(() => {
    if (overlayMode !== 'fashionWeek') return [];
    return FASHION_CAPITALS.map((cap) => ({
      lat: cap.lat,
      lng: cap.lng,
      city: cap.city,
      color: cap.tier === 'A' ? '#E94560' : '#FF5A7A',
      altitude: cap.tier === 'A' ? 0.12 : 0.08,
      radius: cap.tier === 'A' ? 0.5 : 0.35,
    }));
  }, [overlayMode]);

  // Fashion arcs connecting capitals — shown in fashionWeek overlay mode
  const fashionArcData = useMemo(() => {
    if (overlayMode !== 'fashionWeek') return [];
    return FASHION_ARCS.map((arc) => {
      const start = FASHION_CAPITALS.find((c) => c.city === arc.start);
      const end = FASHION_CAPITALS.find((c) => c.city === arc.end);
      if (!start || !end) return null;
      return {
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        color: ['rgba(233, 69, 96, 0.5)', 'rgba(233, 69, 96, 0.08)'],
      };
    }).filter((arc): arc is NonNullable<typeof arc> => arc !== null);
  }, [overlayMode]);

  // Ring pulse on selected country
  const ringsData = useMemo(() => {
    if (!selectedCountry) return [];
    const country = countryMap.get(selectedCountry);
    if (!country) return [];
    return [{
      lat: country.coordinates[0],
      lng: country.coordinates[1],
      maxR: 4,
      propagationSpeed: 2,
      repeatPeriod: 1200,
    }];
  }, [selectedCountry, countryMap]);

  // Fetch GeoJSON
  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((data: GeoJSON) => {
        setGeoData(data);
        setGlobeReady(true);
      })
      .catch(console.error);
  }, [setGlobeReady]);

  // Handle window resize
  useEffect(() => {
    const update = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Zoom to selected country
  useEffect(() => {
    if (!selectedCountry || !globeRef.current) return;
    const country = countryMap.get(selectedCountry);
    if (!country) return;

    const globe = globeRef.current as {
      pointOfView: (pov: { lat: number; lng: number; altitude: number }, ms: number) => void;
    };
    globe.pointOfView(
      {
        lat: country.coordinates[0],
        lng: country.coordinates[1],
        altitude: GLOBE.zoomAltitude,
      },
      GLOBE.animationDuration
    );
  }, [selectedCountry, countryMap]);

  const getPolygonColor = useCallback(
    (feat: object) => {
      const feature = feat as GeoFeature;
      const iso3 = feature.properties?.ISO_A3;
      if (!iso3 || iso3 === '-99') return 'rgb(18, 25, 50)';
      const iso2 = iso3toIso2(iso3);
      const country = countryMap.get(iso2);
      if (!country) return 'rgb(18, 25, 50)';

      // Selected country — bright accent
      if (iso2 === selectedCountry) return 'rgb(233, 69, 96)';

      // Dim non-matching countries when filters/search active
      if (hasActiveFilters && !highlightedIsos.has(iso2)) {
        return 'rgb(12, 18, 35)';
      }

      switch (overlayMode) {
        case 'sustainability': {
          const score = country.sustainabilityScore ?? 0;
          return interpolateColor(
            score, 0, 100,
            [200, 60, 70],   // low = red
            [0, 220, 160]    // high = green
          );
        }

        case 'climate': {
          const lat = country.coordinates[0];
          const zone = inferClimateZone(lat, country.subregion);
          return CLIMATE_COLORS[zone] || 'rgb(18, 25, 50)';
        }

        case 'fashionWeek': {
          if (country.fashionWeeks && country.fashionWeeks.length > 0) {
            return 'rgb(233, 69, 96)';
          }
          return 'rgb(20, 30, 55)';
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
            [40, 80, 180],   // low = vivid blue
            [233, 69, 96]    // high = accent red
          );
        }
      }
    },
    [countryMap, activeMetric, metricRange, selectedCountry, hasActiveFilters, highlightedIsos, overlayMode]
  );

  const handlePolygonClick = useCallback(
    (feat: object) => {
      const feature = feat as GeoFeature;
      const iso3 = feature.properties?.ISO_A3;
      if (!iso3 || iso3 === '-99') return;
      const iso2 = iso3toIso2(iso3);
      if (!iso2) return;
      if (iso2 === selectedCountry) {
        selectCountry(null);
      } else {
        selectCountry(iso2);
      }
    },
    [selectedCountry, selectCountry]
  );

  // Track mouse position for tooltip
  const mousePos = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const handlePolygonHover = useCallback(
    (feat: object | null) => {
      if (!feat) {
        setTooltip(null);
        return;
      }
      const feature = feat as GeoFeature;
      const iso3 = feature.properties?.ISO_A3;
      if (!iso3 || iso3 === '-99') {
        setTooltip(null);
        return;
      }
      const iso2 = iso3toIso2(iso3);
      const country = countryMap.get(iso2);
      if (!country) {
        setTooltip(null);
        return;
      }

      const metricLabel = METRICS.find((m) => m.key === activeMetric)?.label || activeMetric;
      const value = typeof country[activeMetric] === 'number'
        ? (country[activeMetric] as number)
        : 0;

      setTooltip({
        iso: iso2,
        name: country.name,
        flag: country.flag,
        value,
        metric: metricLabel,
        x: mousePos.current.x,
        y: mousePos.current.y,
      });
    },
    [countryMap, activeMetric, setTooltip]
  );

  // Panel is lg:w-[50%] (1024px+), below that it's full width overlay
  const isLargeScreen = dimensions.width >= 1024;
  const globeWidth = panelOpen && isLargeScreen ? dimensions.width * 0.5 : dimensions.width;

  if (!geoData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-muted text-sm font-mono">Loading globe data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative transition-all duration-500" style={{ width: globeWidth, height: dimensions.height }}>
      <Globe
        ref={globeRef}
        width={globeWidth}
        height={dimensions.height}
        // No globe texture — clean dark sphere so polygon colors pop
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={geoData.features}
        polygonCapColor={getPolygonColor}
        polygonSideColor={() => GLOBE.polygonSideColor}
        polygonStrokeColor={() => GLOBE.polygonStrokeColor}
        polygonAltitude={(d: object) => {
          const feat = d as GeoFeature;
          const iso3 = feat.properties?.ISO_A3;
          const iso2 = iso3 ? iso3toIso2(iso3) : '';
          return iso2 === selectedCountry ? 0.06 : 0.008;
        }}
        onGlobeClick={() => { if (panelOpen) setPanelOpen(false); }}
        onPolygonClick={handlePolygonClick}
        onPolygonHover={handlePolygonHover}
        polygonsTransitionDuration={400}
        atmosphereColor={GLOBE.atmosphereColor}
        atmosphereAltitude={GLOBE.atmosphereAltitude}
        animateIn={true}
        enablePointerInteraction={true}
        // Fashion week city markers
        pointsData={fashionWeekPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude="altitude"
        pointRadius="radius"
        pointsMerge={false}
        // Fashion capital connection arcs
        arcsData={fashionArcData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcStroke={0.5}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={3000}
        // Selected country ring pulse
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => '#E94560'}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
      />
    </div>
  );
}
