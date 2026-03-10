import { NextRequest, NextResponse } from 'next/server';
import { searchImages } from '@/lib/api/images';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query');
  const count = parseInt(searchParams.get('count') || '4', 10);

  if (!query) {
    return NextResponse.json(
      { data: null, error: 'Query parameter required', cached: false, timestamp: Date.now() },
      { status: 400 }
    );
  }

  try {
    const images = await searchImages(query, Math.min(count, 20));
    return NextResponse.json({
      data: images,
      error: null,
      cached: false,
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json(
      { data: [], error: 'Failed to fetch images', cached: false, timestamp: Date.now() },
      { status: 500 }
    );
  }
}
