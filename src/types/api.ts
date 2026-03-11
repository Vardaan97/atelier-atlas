import type { CountryProfile } from './country';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  cached: boolean;
  timestamp: number;
}

export interface ImageResult {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  photographer: string;
  source: 'unsplash' | 'pexels' | 'wikimedia' | 'ai';
  width: number;
  height: number;
}

export interface ImageSearchParams {
  iso: string;
  query: string;
  category: 'traditional' | 'textile' | 'fashion' | 'street' | 'landscape';
  count?: number;
}

export interface AiProfileRequest {
  iso: string;
  countryName: string;
  force?: boolean;
}

export interface AiImageRequest {
  iso: string;
  countryName: string;
  garmentName: string;
  era: string;
  style?: string;
}

export interface SearchRequest {
  query: string;
  filters?: {
    region?: string;
    metric?: string;
    era?: string;
  };
}

export interface SearchResult {
  countries: string[]; // ISO codes
  explanation: string;
  confidence: number;
}

export interface TradeData {
  year: number;
  totalExports: number;
  totalImports: number;
  tradeBalance: number;
  topProducts: TradeProduct[];
  yearlyTrend: YearlyTrade[];
}

export interface TradeProduct {
  name: string;
  hsCode: string;
  exports: number;
  imports: number;
}

export interface YearlyTrade {
  year: number;
  exports: number;
  imports: number;
}

export interface FashionEvent {
  name: string;
  city: string;
  country: string; // ISO 2-letter code
  lat: number;
  lng: number;
  type: 'fashion-week' | 'trade-show' | 'jewelry-show';
  tier: 'A' | 'B' | 'C';
  months: string[];
  description: string;
  designers: number;
  attendance: number;
  established: number;
}

export type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

export type { CountryProfile };
