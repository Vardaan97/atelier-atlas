import { NextRequest, NextResponse } from 'next/server';
import { fetchFashionNews, type GdeltArticle } from '@/lib/gdelt';

export interface FashionNewsResponse {
  articles: GdeltArticle[];
  country: string | null;
  cached: boolean;
  timestamp: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const country = searchParams.get('country')?.toUpperCase() || undefined;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 50) : 20;

  try {
    const articles = await fetchFashionNews(country, limit);

    const response: FashionNewsResponse = {
      articles,
      country: country || null,
      cached: false, // cache is handled internally by the gdelt client
      timestamp: Date.now(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('Fashion news API error:', err);
    return NextResponse.json(
      {
        articles: [],
        country: country || null,
        cached: false,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
