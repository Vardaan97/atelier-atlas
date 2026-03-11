import type { ImageResult } from '@/types/api';

const PEXELS_API = 'https://api.pexels.com/v1';

export async function searchPexels(
  query: string,
  count: number = 4
): Promise<ImageResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      query,
      per_page: count.toString(),
    });

    const res = await fetch(`${PEXELS_API}/search?${params}`, {
      headers: { Authorization: apiKey },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.photos || []).map((photo: Record<string, unknown>) => {
      const src = photo.src as Record<string, string>;
      return {
        id: (photo.id as number).toString(),
        url: src.large,
        thumbnailUrl: src.medium,
        alt: (photo.alt as string) || query,
        photographer: photo.photographer as string,
        source: 'pexels' as const,
        width: photo.width as number,
        height: photo.height as number,
      };
    });
  } catch {
    return [];
  }
}
