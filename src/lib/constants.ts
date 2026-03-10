export const THEME = {
  bg: '#0A0A1A',
  bgSecondary: '#0F1629',
  text: '#F0F0F5',
  textMuted: '#8B8FA3',
  accent: '#E94560',
  accentHover: '#FF5A7A',
  secondary: '#0F3460',
  secondaryLight: '#1A4A80',
  border: 'rgba(255, 255, 255, 0.1)',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassHover: 'rgba(255, 255, 255, 0.08)',
  success: '#00C48C',
  warning: '#FFB800',
  error: '#FF4757',
} as const;

export const GLOBE = {
  autoRotateSpeed: 0.3,
  zoomAltitude: 1.5,
  defaultAltitude: 2.5,
  polygonSideColor: 'rgba(233, 69, 96, 0.15)',
  polygonStrokeColor: 'rgba(240, 240, 245, 0.2)',
  atmosphereColor: '#0F3460',
  atmosphereAltitude: 0.25,
  animationDuration: 1000,
} as const;

export const CACHE_TTL = {
  aiProfile: 30 * 24 * 60 * 60 * 1000, // 30 days
  aiImage: 30 * 24 * 60 * 60 * 1000,
  stockImage: 7 * 24 * 60 * 60 * 1000, // 7 days
  tradeData: 30 * 24 * 60 * 60 * 1000,
  search: 24 * 60 * 60 * 1000, // 1 day
} as const;

export const REGIONS = [
  'Africa',
  'Americas',
  'Asia',
  'Europe',
  'Oceania',
] as const;

export const METRICS = [
  { key: 'fashionIndex', label: 'Fashion Index', unit: '' },
  { key: 'marketSize', label: 'Market Size', unit: 'USD B' },
  { key: 'textileExports', label: 'Textile Exports', unit: 'USD B' },
  { key: 'sustainabilityScore', label: 'Sustainability', unit: '' },
  { key: 'population', label: 'Population', unit: '' },
] as const;

export const FASHION_DNA_AXES = [
  'traditionalism',
  'innovation',
  'sustainability',
  'luxuryIndex',
  'streetwearInfluence',
  'craftsmanship',
  'globalInfluence',
] as const;

export const PANEL_TABS = [
  { id: 'traditional', label: 'Traditional' },
  { id: 'colors', label: 'Colors & Textiles' },
  { id: 'timeline', label: 'Fashion Timeline' },
  { id: 'industry', label: 'Industry' },
  { id: 'culture', label: 'Culture & Climate' },
  { id: 'contemporary', label: 'Contemporary' },
] as const;

export const GEOJSON_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
