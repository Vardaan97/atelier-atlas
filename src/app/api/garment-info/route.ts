import { NextRequest, NextResponse } from 'next/server';
import { getGarmentInfo } from '@/lib/wikipedia';

/**
 * GET /api/garment-info?garment=Sari&country=India
 *
 * Returns Wikipedia summary and metadata for a traditional garment.
 * Cached for 7 days (Wikipedia content rarely changes).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const garment = searchParams.get('garment');
  const country = searchParams.get('country');

  if (!garment || !country) {
    return NextResponse.json(
      {
        data: null,
        error: 'Both "garment" and "country" query parameters are required',
        cached: false,
        timestamp: Date.now(),
      },
      { status: 400 }
    );
  }

  try {
    const info = await getGarmentInfo(garment, country);

    return NextResponse.json(
      {
        data: info,
        error: null,
        cached: false,
        timestamp: Date.now(),
      },
      {
        headers: {
          // Browser-level cache: 7 days
          'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err) {
    console.error('[garment-info]', err);
    return NextResponse.json(
      {
        data: null,
        error: 'Failed to fetch garment info',
        cached: false,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
