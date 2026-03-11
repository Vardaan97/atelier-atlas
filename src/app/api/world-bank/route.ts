import { NextRequest, NextResponse } from 'next/server';
import { fetchCountryEconomics } from '@/lib/api/worldbank';
import { getCached, setCached } from '@/lib/cache';
import type { WBCountryEconomics } from '@/lib/api/worldbank';

// 24-hour cache (World Bank data is updated annually)
const WORLD_BANK_TTL = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get('country');

  if (!country || country.length < 2) {
    return NextResponse.json(
      { data: null, error: 'Missing or invalid country parameter (ISO2 code)' },
      { status: 400 }
    );
  }

  const iso = country.toUpperCase();
  const cacheKey = `worldbank:${iso}`;

  // 1. Check in-memory cache
  const cached = await getCached<WBCountryEconomics>(cacheKey);
  if (cached) {
    return NextResponse.json({
      data: cached,
      error: null,
      cached: true,
      timestamp: Date.now(),
    });
  }

  // 2. Fetch from World Bank API
  try {
    const economics = await fetchCountryEconomics(iso);

    // Only cache if we got at least some data
    const hasData = Object.values(economics).some(
      (v) => v !== null && typeof v === 'object' && 'value' in v && v.value !== null
    );

    if (hasData) {
      await setCached(cacheKey, economics, WORLD_BANK_TTL);
    }

    return NextResponse.json({
      data: economics,
      error: null,
      cached: false,
      timestamp: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch World Bank data';
    return NextResponse.json(
      { data: null, error: message, cached: false, timestamp: Date.now() },
      { status: 500 }
    );
  }
}
