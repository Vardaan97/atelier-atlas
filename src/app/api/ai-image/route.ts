import { NextRequest, NextResponse } from 'next/server';
import { generateImageOpenRouter } from '@/lib/api/openrouter';
import { generateImageXAI } from '@/lib/api/xai';
import { getActiveImageModel } from '@/lib/image-models';
import { getCached, setCached } from '@/lib/cache';
import { getFileCachedImage, setFileCachedImage } from '@/lib/file-cache';
import { CACHE_TTL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { prompt, cacheKey: clientCacheKey } = body as {
    prompt?: string;
    cacheKey?: string;
  };

  if (!prompt) {
    return NextResponse.json(
      { data: null, error: 'Prompt required', cached: false, timestamp: Date.now() },
      { status: 400 }
    );
  }

  const cacheKey = clientCacheKey || `ai-image:${prompt.slice(0, 100)}`;

  // 1. Check in-memory cache
  const memCached = await getCached<string>(cacheKey);
  if (memCached) {
    return NextResponse.json({
      data: { url: memCached },
      error: null,
      cached: true,
      timestamp: Date.now(),
    });
  }

  // 2. Check persistent file cache (survives server restarts)
  const fileCached = await getFileCachedImage(cacheKey);
  if (fileCached) {
    await setCached(cacheKey, fileCached, CACHE_TTL.aiImage);
    return NextResponse.json({
      data: { url: fileCached },
      error: null,
      cached: true,
      timestamp: Date.now(),
    });
  }

  // 3. Generate via active model
  try {
    const model = getActiveImageModel();
    let imageUrl: string | null = null;

    if (model.provider === 'xai') {
      imageUrl = await generateImageXAI(prompt, model.modelId);
    } else {
      imageUrl = await generateImageOpenRouter(prompt, model.modelId, model.imageOnly);
    }

    if (!imageUrl) {
      return NextResponse.json(
        { data: null, error: 'Image generation failed', cached: false, timestamp: Date.now() },
        { status: 500 }
      );
    }

    // Save to both caches
    await setCached(cacheKey, imageUrl, CACHE_TTL.aiImage);
    await setFileCachedImage(cacheKey, imageUrl, prompt);

    return NextResponse.json({
      data: { url: imageUrl, model: model.name },
      error: null,
      cached: false,
      timestamp: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    return NextResponse.json(
      { data: null, error: message, cached: false, timestamp: Date.now() },
      { status: 500 }
    );
  }
}
