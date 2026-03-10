import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/api/openrouter';
import { buildProfilePrompt } from '@/lib/prompts';
import { getCached, setCached } from '@/lib/cache';
import { getFileCachedProfile, setFileCachedProfile } from '@/lib/file-cache';
import { CACHE_TTL } from '@/lib/constants';
import type { CountryBase } from '@/types/country';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ iso: string }> }
) {
  const { iso } = await params;

  // 1. Check in-memory cache
  const cacheKey = `ai-profile:${iso}`;
  const memCached = await getCached(cacheKey);
  if (memCached) {
    return NextResponse.json({
      data: memCached,
      error: null,
      cached: true,
      timestamp: Date.now(),
    });
  }

  // 2. Check persistent file cache (pre-generated or previously generated)
  const fileCached = await getFileCachedProfile(iso);
  if (fileCached) {
    await setCached(cacheKey, fileCached, CACHE_TTL.aiProfile);
    return NextResponse.json({
      data: fileCached,
      error: null,
      cached: true,
      timestamp: Date.now(),
    });
  }

  // 3. Load country data for prompt building
  let country: CountryBase | null = null;
  try {
    const countriesModule = await import('@/data/countries.json');
    const countries = (countriesModule.default || countriesModule) as unknown as CountryBase[];
    country = countries.find(c => c.iso === iso) || null;
  } catch {
    return NextResponse.json(
      { data: null, error: 'Failed to load country data', cached: false, timestamp: Date.now() },
      { status: 500 }
    );
  }

  if (!country) {
    return NextResponse.json(
      { data: null, error: 'Country not found', cached: false, timestamp: Date.now() },
      { status: 404 }
    );
  }

  // 4. Generate via OpenRouter
  try {
    const { system, user } = buildProfilePrompt(country);
    const response = await generateText(
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { jsonMode: true, maxTokens: 4096, temperature: 0.7 }
    );

    const profile = JSON.parse(response);

    // Save to both caches (memory + persistent file)
    await setCached(cacheKey, profile, CACHE_TTL.aiProfile);
    await setFileCachedProfile(iso, profile);

    return NextResponse.json({
      data: profile,
      error: null,
      cached: false,
      timestamp: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json(
      { data: null, error: message, cached: false, timestamp: Date.now() },
      { status: 500 }
    );
  }
}
