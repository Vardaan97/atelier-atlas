import { NextRequest, NextResponse } from 'next/server';
import { fetchTrendsData, type TrendsResult } from '@/lib/googletrends';
import type { CountryBase } from '@/types/country';

export interface TrendsApiResponse {
  data: TrendsResult | null;
  error: string | null;
  cached: boolean;
  timestamp: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const country = searchParams.get('country')?.toUpperCase();
  const type = searchParams.get('type') || 'all';
  const keyword = searchParams.get('keyword') || undefined;

  if (!country || country.length !== 2) {
    const response: TrendsApiResponse = {
      data: null,
      error: 'Missing or invalid "country" parameter (ISO-2 code required)',
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response, { status: 400 });
  }

  // Validate type
  const validTypes = ['fashion', 'garment', 'designers', 'all'];
  if (!validTypes.includes(type)) {
    const response: TrendsApiResponse = {
      data: null,
      error: `Invalid "type" parameter. Must be one of: ${validTypes.join(', ')}`,
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response, { status: 400 });
  }

  // Load country data for garment/designer names
  let garments: string[] = [];
  let designers: string[] = [];

  try {
    const countriesModule = await import('@/data/countries.json');
    const countries = (countriesModule.default || countriesModule) as unknown as CountryBase[];
    const countryData = countries.find(c => c.iso === country);

    if (countryData) {
      garments = countryData.traditionalGarments?.map(g => g.name) || [];
      designers = countryData.keyDesigners?.map(d => d.name) || [];
    }
  } catch {
    // Country data is optional — trends will still work
  }

  try {
    const data = await fetchTrendsData({
      country,
      type: type as 'fashion' | 'garment' | 'designers' | 'all',
      keyword,
      garments,
      designers,
    });

    const response: TrendsApiResponse = {
      data,
      error: null,
      cached: false,
      timestamp: Date.now(),
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 6 hours at CDN level
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200',
      },
    });
  } catch (err) {
    console.error('Trends API error:', err);
    const response: TrendsApiResponse = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to fetch trends data',
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
