'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useGlobeStore } from '@/store/useGlobeStore';
import { GLOBE, GEOJSON_URL, METRICS, FASHION_CAPITALS, FASHION_ARCS } from '@/lib/constants';
import { interpolateColor } from '@/lib/utils';
import { addSpaceBackground } from './spaceBackground';
import fashionEventsData from '@/data/fashion-events.json';
import type { GeoJSON, GeoFeature } from '@/types/globe';
import type { CountryBase } from '@/types/country';
import type { FashionEvent } from '@/types/api';

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

  // Fashion events cast to typed array
  const fashionEvents = useMemo(() => fashionEventsData as FashionEvent[], []);

  // Build a lookup: city -> events for tooltip enrichment
  const cityEventsMap = useMemo(() => {
    const map = new Map<string, FashionEvent[]>();
    for (const event of fashionEvents) {
      const key = event.city.toLowerCase();
      const existing = map.get(key) || [];
      existing.push(event);
      map.set(key, existing);
    }
    return map;
  }, [fashionEvents]);

  // Deduplicated city points from events data — shown in fashionWeek overlay mode
  const fashionWeekPoints = useMemo(() => {
    if (overlayMode !== 'fashionWeek') return [];

    // Deduplicate by city (use the highest-tier event per city)
    const cityMap = new Map<string, { lat: number; lng: number; city: string; tier: string; eventCount: number; topEvent: FashionEvent }>();

    for (const event of fashionEvents) {
      const key = event.city.toLowerCase();
      const existing = cityMap.get(key);
      const tierOrder: Record<string, number> = { A: 0, B: 1, C: 2 };

      if (!existing || (tierOrder[event.tier] ?? 3) < (tierOrder[existing.tier] ?? 3)) {
        cityMap.set(key, {
          lat: event.lat,
          lng: event.lng,
          city: event.city,
          tier: event.tier,
          eventCount: (existing?.eventCount ?? 0) + 1,
          topEvent: event,
        });
      } else {
        existing.eventCount += 1;
      }
    }

    return Array.from(cityMap.values()).map((pt) => ({
      lat: pt.lat,
      lng: pt.lng,
      city: pt.city,
      tier: pt.tier,
      eventCount: pt.eventCount,
      topEventName: pt.topEvent.name,
      topEventType: pt.topEvent.type,
      color: pt.tier === 'A' ? '#E94560' : pt.tier === 'B' ? '#FF5A7A' : '#FF8A9E',
      altitude: pt.tier === 'A' ? 0.12 : pt.tier === 'B' ? 0.08 : 0.05,
      radius: pt.tier === 'A' ? 0.5 : pt.tier === 'B' ? 0.35 : 0.25,
    }));
  }, [overlayMode, fashionEvents]);

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

  // Create a new features array reference when coloring dependencies change.
  // react-globe.gl caches polygon colors and won't re-evaluate them when only
  // the callback reference changes.  A new array reference forces a full
  // re-color pass.
  const polygonsData = useMemo(() => {
    if (!geoData) return [];
    return [...geoData.features];
  }, [geoData, overlayMode, activeMetric, selectedCountry, highlightedIsos]);

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

  // Add space background (planets + nebula) once the globe scene is available
  useEffect(() => {
    if (!globeRef.current) return;

    // react-globe.gl exposes .scene() and .camera() on its ref
    const globe = globeRef.current;
    const scene = globe.scene();
    const camera = globe.camera();
    if (!scene || !camera) return;

    // Enable BG_LAYER on the camera so it can render the space objects.
    // react-globe.gl's camera is NOT in the scene tree, so we must
    // patch it directly via the ref rather than traversing the scene.
    camera.layers.enable(2); // BG_LAYER = 2

    // Extend the far clipping plane so distant planets are not culled
    if (camera.far < 5000) {
      camera.far = 5000;
      camera.updateProjectionMatrix();
    }

    const { dispose } = addSpaceBackground(scene);
    return () => dispose();
  }, [geoData]); // geoData triggers once globe is mounted & ready

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

  // Build rich HTML tooltip for fashion event points
  const getPointLabel = useCallback(
    (d: object) => {
      const point = d as { city: string; tier: string; topEventName: string; topEventType: string; eventCount: number };
      const cityKey = point.city.toLowerCase();
      const cityEvents = cityEventsMap.get(cityKey) || [];

      const typeColors: Record<string, string> = {
        'fashion-week': '#E94560',
        'trade-show': '#4A90D9',
        'jewelry-show': '#FFB800',
      };
      const typeLabels: Record<string, string> = {
        'fashion-week': 'Fashion Week',
        'trade-show': 'Trade Show',
        'jewelry-show': 'Jewelry',
      };

      const tierBg: Record<string, string> = {
        A: 'rgba(233,69,96,0.25)',
        B: 'rgba(15,52,96,0.5)',
        C: 'rgba(255,255,255,0.1)',
      };

      const eventsHtml = cityEvents.slice(0, 4).map((e) => {
        const color = typeColors[e.type] || '#fff';
        const label = typeLabels[e.type] || e.type;
        return `<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
          <span style="width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0;"></span>
          <span style="font-size:11px;color:#ddd;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.name}</span>
          <span style="font-size:9px;color:${color};background:${color}22;padding:1px 5px;border-radius:4px;white-space:nowrap;">${label}</span>
        </div>`;
      }).join('');

      const moreHtml = cityEvents.length > 4
        ? `<div style="font-size:10px;color:#8B8FA3;margin-top:4px;">+${cityEvents.length - 4} more events</div>`
        : '';

      return `<div style="background:rgba(10,10,26,0.95);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:12px 14px;min-width:200px;max-width:280px;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="font-size:14px;font-weight:700;color:#F0F0F5;">${point.city}</span>
          <span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:${tierBg[point.tier] || tierBg.C};color:#F0F0F5;">Tier ${point.tier}</span>
        </div>
        <div style="font-size:10px;color:#8B8FA3;margin-bottom:6px;">${cityEvents.length} fashion event${cityEvents.length !== 1 ? 's' : ''}</div>
        ${eventsHtml}
        ${moreHtml}
      </div>`;
    },
    [cityEventsMap]
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
        polygonsData={polygonsData}
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
        pointLabel={getPointLabel}
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
