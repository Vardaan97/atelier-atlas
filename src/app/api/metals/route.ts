import { NextResponse } from 'next/server';
import { getMetalsPricing, type MetalsData } from '@/lib/metals';
import type { ApiResponse } from '@/types/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metals = await getMetalsPricing();

    const response: ApiResponse<MetalsData> = {
      data: metals,
      error: null,
      cached: metals.source === 'static',
      timestamp: Date.now(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch metals data';
    const response: ApiResponse<MetalsData> = {
      data: null,
      error: message,
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
