import { NextRequest, NextResponse } from 'next/server';
import { fetchTradeData } from '@/lib/api/comtrade';
import { getCached, setCached } from '@/lib/cache';
import { CACHE_TTL } from '@/lib/constants';
import type { CountryBase } from '@/types/country';
import type { ApiResponse, TradeData } from '@/types/api';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const TRADE_CACHE_DIR = path.join(process.cwd(), 'src', 'data', 'trade-cache');

async function getFileCachedTrade(iso: string): Promise<TradeData | null> {
  try {
    const filePath = path.join(TRADE_CACHE_DIR, `${iso}.json`);
    const data = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    // Check if file cache is still valid (30 days)
    if (parsed.cachedAt && Date.now() - parsed.cachedAt < CACHE_TTL.tradeData) {
      return parsed.data as TradeData;
    }
    return null;
  } catch {
    return null;
  }
}

async function setFileCachedTrade(iso: string, data: TradeData): Promise<void> {
  try {
    await mkdir(TRADE_CACHE_DIR, { recursive: true });
    const filePath = path.join(TRADE_CACHE_DIR, `${iso}.json`);
    await writeFile(
      filePath,
      JSON.stringify({ data, cachedAt: Date.now() }, null, 2)
    );
  } catch (err) {
    console.error('Failed to save trade data to file cache:', err);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ iso: string }> }
) {
  const { iso } = await params;
  const upperIso = iso.toUpperCase();

  // 1. Check in-memory cache
  const cacheKey = `trade:${upperIso}`;
  const memCached = await getCached<TradeData>(cacheKey);
  if (memCached) {
    const response: ApiResponse<TradeData> = {
      data: memCached,
      error: null,
      cached: true,
      timestamp: Date.now(),
    };
    return NextResponse.json(response);
  }

  // 2. Check persistent file cache
  const fileCached = await getFileCachedTrade(upperIso);
  if (fileCached) {
    await setCached(cacheKey, fileCached, CACHE_TTL.tradeData);
    const response: ApiResponse<TradeData> = {
      data: fileCached,
      error: null,
      cached: true,
      timestamp: Date.now(),
    };
    return NextResponse.json(response);
  }

  // 3. Load country data to get industryStats for synthetic fallback
  let country: CountryBase | null = null;
  try {
    const countriesModule = await import('@/data/countries.json');
    const countries = (countriesModule.default || countriesModule) as unknown as CountryBase[];
    country = countries.find((c) => c.iso === upperIso) || null;
  } catch {
    const response: ApiResponse<TradeData> = {
      data: null,
      error: 'Failed to load country data',
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response, { status: 500 });
  }

  if (!country || !country.industryStats) {
    const response: ApiResponse<TradeData> = {
      data: null,
      error: 'Country not found or no industry data available',
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response, { status: 404 });
  }

  // 4. Fetch from Comtrade API or generate synthetic data
  try {
    const tradeData = await fetchTradeData(upperIso, country.industryStats);

    // Save to both caches
    await setCached(cacheKey, tradeData, CACHE_TTL.tradeData);
    await setFileCachedTrade(upperIso, tradeData);

    const response: ApiResponse<TradeData> = {
      data: tradeData,
      error: null,
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch trade data';
    const response: ApiResponse<TradeData> = {
      data: null,
      error: message,
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
