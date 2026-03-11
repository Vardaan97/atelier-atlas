import { NextRequest, NextResponse } from 'next/server';
import { getMuseumGarments, getMuseumEraItems } from '@/lib/metmuseum';

/**
 * GET /api/museum-garments?country=India&garment=Sari&limit=5
 * GET /api/museum-garments?country=India&era=Mughal&limit=2
 *
 * Returns items from the Met Museum's Costume Institute.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const country = searchParams.get('country');
  const garment = searchParams.get('garment') || undefined;
  const era = searchParams.get('era') || undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 10);

  if (!country) {
    return NextResponse.json(
      { items: [], error: 'country parameter is required' },
      { status: 400 },
    );
  }

  try {
    let items;
    if (era) {
      items = await getMuseumEraItems(era, country, limit);
    } else {
      items = await getMuseumGarments(country, garment, limit);
    }

    return NextResponse.json({ items, error: null });
  } catch (err) {
    console.error('[museum-garments]', err);
    return NextResponse.json(
      { items: [], error: 'Failed to fetch museum data' },
      { status: 500 },
    );
  }
}
