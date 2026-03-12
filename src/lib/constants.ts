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
  polygonSideColor: 'rgba(233, 69, 96, 0.25)',
  polygonStrokeColor: 'rgba(140, 160, 220, 0.35)',
  atmosphereColor: '#1a5a9a',
  atmosphereAltitude: 0.3,
  animationDuration: 1000,
} as const;

export const FASHION_CAPITALS = [
  { city: 'Paris', lat: 48.8566, lng: 2.3522, country: 'FR', tier: 'A' as const },
  { city: 'Milan', lat: 45.4642, lng: 9.19, country: 'IT', tier: 'A' as const },
  { city: 'New York', lat: 40.7128, lng: -74.006, country: 'US', tier: 'A' as const },
  { city: 'London', lat: 51.5074, lng: -0.1278, country: 'GB', tier: 'A' as const },
  { city: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'JP', tier: 'A' as const },
  { city: 'Shanghai', lat: 31.2304, lng: 121.4737, country: 'CN', tier: 'B' as const },
  { city: 'São Paulo', lat: -23.5505, lng: -46.6333, country: 'BR', tier: 'B' as const },
  { city: 'Berlin', lat: 52.52, lng: 13.405, country: 'DE', tier: 'B' as const },
  { city: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'AU', tier: 'B' as const },
  { city: 'Lagos', lat: 6.5244, lng: 3.3792, country: 'NG', tier: 'B' as const },
  { city: 'Mumbai', lat: 19.076, lng: 72.8777, country: 'IN', tier: 'B' as const },
  { city: 'Seoul', lat: 37.5665, lng: 126.978, country: 'KR', tier: 'B' as const },
];

export const FASHION_ARCS = [
  { start: 'Paris', end: 'Milan' },
  { start: 'Paris', end: 'London' },
  { start: 'New York', end: 'Paris' },
  { start: 'New York', end: 'London' },
  { start: 'Tokyo', end: 'Shanghai' },
  { start: 'Tokyo', end: 'Seoul' },
  { start: 'Mumbai', end: 'Paris' },
  { start: 'São Paulo', end: 'New York' },
  { start: 'Lagos', end: 'London' },
  { start: 'Sydney', end: 'Tokyo' },
];

export const CACHE_TTL = {
  aiProfile: 30 * 24 * 60 * 60 * 1000, // 30 days
  aiImage: 30 * 24 * 60 * 60 * 1000,
  stockImage: 7 * 24 * 60 * 60 * 1000, // 7 days
  tradeData: 30 * 24 * 60 * 60 * 1000,
  search: 24 * 60 * 60 * 1000, // 1 day
  fashionNews: 30 * 60 * 1000, // 30 minutes
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
  { id: 'timeline', label: 'Timeline' },
  { id: 'industry', label: 'Industry' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'culture', label: 'Culture' },
  { id: 'contemporary', label: 'Modern' },
  { id: 'ai-studio', label: 'AI Studio' },
] as const;

export const GEOJSON_URL = '/data/ne_110m_admin_0_countries.geojson';
