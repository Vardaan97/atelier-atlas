export interface CountryBase {
  iso: string;
  name: string;
  region: string;
  subregion: string;
  capital: string;
  population: number;
  coordinates: [number, number]; // [lat, lng]
  flag: string; // emoji
  tier: 'A' | 'B' | 'C' | 'skeleton';
  fashionIndex: number; // 0-100 composite score
  marketSize: number; // USD billions
  textileExports: number; // USD billions
  sustainabilityScore: number; // 0-100
  fashionWeeks: string[];
  primaryFabrics: string[];
  colorPalette: ColorEntry[];
  traditionalGarments: Garment[];
  keyDesigners: Designer[];
  industryStats: IndustryStats;
}

export interface ColorEntry {
  name: string;
  hex: string;
  meaning: string;
  pantone?: string;
}

export interface Garment {
  name: string;
  description: string;
  era: string;
  occasion: string;
  materials: string[];
  imageQuery?: string;
}

export interface Designer {
  name: string;
  brand?: string;
  era: string;
  specialty: string;
}

export interface IndustryStats {
  marketSizeUSD: number;
  growthRate: number;
  employmentMillions: number;
  textileExportsUSD: number;
  textileImportsUSD: number;
  topExportPartners: string[];
  topImportPartners: string[];
  fashionWeekCity?: string;
  sustainabilityIndex: number;
}

export interface FashionEra {
  id: string;
  name: string;
  yearRange: [number, number];
  description: string;
  keyGarments: string[];
  aiImagePrompt?: string;
  imageUrl?: string;
}

export interface CountryProfile extends CountryBase {
  fashionDNA: FashionDNA;
  eras: FashionEra[];
  textiles: Textile[];
  climate: ClimateInfo;
  culturalInfluences: string[];
  contemporaryScene: ContemporaryScene;
  aiGenerated?: boolean;
}

export interface FashionDNA {
  traditionalism: number; // 0-100
  innovation: number;
  sustainability: number;
  luxuryIndex: number;
  streetwearInfluence: number;
  craftsmanship: number;
  globalInfluence: number;
}

export interface Textile {
  name: string;
  type: string;
  description: string;
  origin: string;
  technique: string;
  imageQuery?: string;
}

export interface ClimateInfo {
  zone: string;
  avgTemp: number;
  humidity: string;
  fashionImplication: string;
}

export interface ContemporaryScene {
  fashionWeeks: FashionWeekInfo[];
  emergingTrends: string[];
  digitalPresence: number; // 0-100
  ecommercePenetration: number; // percentage
  notableEvents: string[];
}

export interface FashionWeekInfo {
  name: string;
  city: string;
  month: string;
  tier: 'Big Four' | 'Major' | 'Emerging';
}

export type MetricKey =
  | 'fashionIndex'
  | 'marketSize'
  | 'textileExports'
  | 'sustainabilityScore'
  | 'population';
