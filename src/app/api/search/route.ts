import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/api/openrouter';
import { getCached, setCached } from '@/lib/cache';
import { CACHE_TTL } from '@/lib/constants';
import type { CountryBase } from '@/types/country';

interface AiSearchResult {
  iso: string;
  reason: string;
  score: number;
}

function buildCountryList(countries: CountryBase[]): string {
  return countries
    .map((c) => {
      const parts = [c.iso, c.name, c.region];
      if (c.primaryFabrics?.length) parts.push(`fabrics: ${c.primaryFabrics.join(', ')}`);
      if (c.keyDesigners?.length)
        parts.push(`designers: ${c.keyDesigners.map((d) => d.name).join(', ')}`);
      if (c.fashionWeeks?.length) parts.push(`fashion weeks: ${c.fashionWeeks.join(', ')}`);
      if (c.traditionalGarments?.length)
        parts.push(`garments: ${c.traditionalGarments.map((g) => g.name).join(', ')}`);
      return parts.join(' | ');
    })
    .join('\n');
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json(
      { data: null, error: 'Missing query parameter "q"', cached: false, timestamp: Date.now() },
      { status: 400 }
    );
  }

  // 1. Check cache
  const cacheKey = `search:${q.toLowerCase()}`;
  const cached = await getCached<{ results: AiSearchResult[] }>(cacheKey);
  if (cached) {
    return NextResponse.json({
      data: cached,
      error: null,
      cached: true,
      timestamp: Date.now(),
    });
  }

  // 2. Load country data
  let countries: CountryBase[];
  try {
    const countriesModule = await import('@/data/countries.json');
    countries = (countriesModule.default || countriesModule) as unknown as CountryBase[];
  } catch {
    return NextResponse.json(
      { data: null, error: 'Failed to load country data', cached: false, timestamp: Date.now() },
      { status: 500 }
    );
  }

  const countryList = buildCountryList(countries);

  // 3. Build AI prompt
  const systemPrompt = `You are a fashion intelligence search engine for Atelier Atlas, a global fashion data platform.
You have access to the following countries and their fashion data:

${countryList}

When a user asks a question about fashion, textiles, designers, garments, or countries, identify the most relevant countries from this dataset.

RULES:
- Return ONLY countries that exist in the dataset above (use exact ISO codes).
- Return between 1 and 8 results, ordered by relevance.
- Each result must have an ISO code, a brief reason explaining the relevance, and a confidence score between 0 and 1.
- Be specific in your reasons — reference actual fabrics, designers, garments, or fashion characteristics.
- If the query doesn't relate to any country in the dataset, return an empty results array.

Respond ONLY with valid JSON in this exact format:
{
  "results": [
    { "iso": "XX", "reason": "Brief explanation", "score": 0.95 }
  ]
}`;

  const userPrompt = `Find countries relevant to: "${q}"`;

  // 4. Call AI
  try {
    const response = await generateText(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { jsonMode: true, maxTokens: 1024, temperature: 0.3 }
    );

    let parsed: { results: AiSearchResult[] };
    try {
      parsed = JSON.parse(response);
    } catch {
      // Try to extract JSON from response if wrapped in markdown
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    // Validate and filter results to only include known countries
    const validIsos = new Set(countries.map((c) => c.iso));
    const results: AiSearchResult[] = (parsed.results || [])
      .filter(
        (r): r is AiSearchResult =>
          typeof r.iso === 'string' &&
          validIsos.has(r.iso) &&
          typeof r.reason === 'string' &&
          typeof r.score === 'number'
      )
      .map((r) => ({
        iso: r.iso,
        reason: r.reason,
        score: Math.max(0, Math.min(1, r.score)),
      }))
      .slice(0, 8);

    const data = { results };

    // 5. Cache for 24 hours
    await setCached(cacheKey, data, CACHE_TTL.search);

    return NextResponse.json({
      data,
      error: null,
      cached: false,
      timestamp: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI search failed';
    return NextResponse.json(
      { data: null, error: message, cached: false, timestamp: Date.now() },
      { status: 500 }
    );
  }
}
