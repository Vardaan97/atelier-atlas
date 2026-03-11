import { NextRequest, NextResponse } from 'next/server';
import { fetchJewelryTradeData } from '@/lib/api/jewelry-comtrade';
import { getCached, setCached } from '@/lib/cache';
import { CACHE_TTL } from '@/lib/constants';
import type { CountryBase } from '@/types/country';
import type { ApiResponse } from '@/types/api';
import type { JewelryTradeData } from '@/types/jewelry';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'src', 'data', 'jewelry-cache');
const IS_VERCEL = !!process.env.VERCEL;

async function getFileCached(iso: string): Promise<JewelryTradeData | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${iso}.json`);
    const data = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    if (parsed.cachedAt && Date.now() - parsed.cachedAt < CACHE_TTL.tradeData) {
      return parsed.data as JewelryTradeData;
    }
    return null;
  } catch {
    return null;
  }
}

async function setFileCached(iso: string, data: JewelryTradeData): Promise<void> {
  if (IS_VERCEL) return;
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    const filePath = path.join(CACHE_DIR, `${iso}.json`);
    await writeFile(
      filePath,
      JSON.stringify({ data, cachedAt: Date.now() }, null, 2)
    );
  } catch (err) {
    console.error('Failed to save jewelry trade data to file cache:', err);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ iso: string }> }
) {
  const { iso } = await params;
  const upperIso = iso.toUpperCase();

  // 1. In-memory cache
  const cacheKey = `jewelry-trade:${upperIso}`;
  const memCached = await getCached<JewelryTradeData>(cacheKey);
  if (memCached) {
    const response: ApiResponse<JewelryTradeData> = {
      data: memCached,
      error: null,
      cached: true,
      timestamp: Date.now(),
    };
    return NextResponse.json(response);
  }

  // 2. File cache
  const fileCached = await getFileCached(upperIso);
  if (fileCached) {
    await setCached(cacheKey, fileCached, CACHE_TTL.tradeData);
    const response: ApiResponse<JewelryTradeData> = {
      data: fileCached,
      error: null,
      cached: true,
      timestamp: Date.now(),
    };
    return NextResponse.json(response);
  }

  // 3. Load country data for synthetic fallback
  let country: CountryBase | null = null;
  try {
    const countriesModule = await import('@/data/countries.json');
    const countries = (countriesModule.default || countriesModule) as unknown as CountryBase[];
    country = countries.find((c) => c.iso === upperIso) || null;
  } catch {
    const response: ApiResponse<JewelryTradeData> = {
      data: null,
      error: 'Failed to load country data',
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response, { status: 500 });
  }

  if (!country || !country.industryStats) {
    const response: ApiResponse<JewelryTradeData> = {
      data: null,
      error: 'Country not found or no industry data available',
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response, { status: 404 });
  }

  // 4. Fetch or generate
  try {
    const tradeData = await fetchJewelryTradeData(upperIso, country.industryStats);

    await setCached(cacheKey, tradeData, CACHE_TTL.tradeData);
    await setFileCached(upperIso, tradeData);

    const response: ApiResponse<JewelryTradeData> = {
      data: tradeData,
      error: null,
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch jewelry trade data';
    const response: ApiResponse<JewelryTradeData> = {
      data: null,
      error: message,
      cached: false,
      timestamp: Date.now(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
