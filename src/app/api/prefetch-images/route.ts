import { NextRequest, NextResponse } from 'next/server';
import { searchImages } from '@/lib/api/images';
import countriesData from '@/data/countries.json';
import type { CountryBase } from '@/types/country';

const countries = countriesData as unknown as CountryBase[];

// Simple delay helper
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a garment-specific query — same logic as GarmentCard's buildGarmentQuery.
 * Kept in sync so prefetch populates the same cache keys.
 */
function buildGarmentQuery(
  garment: { name: string; imageQuery?: string },
  countryName: string
): string {
  if (garment.imageQuery) return garment.imageQuery;
  return `traditional ${garment.name} ${countryName} clothing`;
}

/**
 * POST /api/prefetch-images
 * Pre-fetches and caches stock images for a country's garments.
 *
 * Body: { countryIso: string }
 *
 * Returns: { cached: number, queries: string[] }
 * Each query is returned so the client can map results into its own cache.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { countryIso } = body as { countryIso: string };

    if (!countryIso) {
      return NextResponse.json(
        { data: null, error: 'countryIso is required' },
        { status: 400 }
      );
    }

    const country = countries.find(
      (c) => c.iso.toUpperCase() === countryIso.toUpperCase()
    );

    if (!country) {
      return NextResponse.json(
        { data: null, error: `Country not found: ${countryIso}` },
        { status: 404 }
      );
    }

    const garments = country.traditionalGarments || [];
    if (garments.length === 0) {
      return NextResponse.json({
        data: { cached: 0, results: [] },
        error: null,
      });
    }

    // Limit to at most 6 garments per country to conserve rate limits
    const toFetch = garments.slice(0, 6);
    const results: { query: string; images: unknown[] }[] = [];

    for (let i = 0; i < toFetch.length; i++) {
      const garment = toFetch[i];
      const query = buildGarmentQuery(garment, country.name);

      // searchImages internally caches via getCached/setCached,
      // so subsequent calls for the same query are free
      const images = await searchImages(query, 3);
      results.push({ query, images });

      // 2-second delay between API calls to respect rate limits
      if (i < toFetch.length - 1) {
        await delay(2000);
      }
    }

    return NextResponse.json({
      data: {
        cached: results.filter((r) => r.images.length > 0).length,
        results,
      },
      error: null,
    });
  } catch (err) {
    console.error('[prefetch-images] Error:', err);
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
