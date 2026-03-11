import type { ImageResult } from '@/types/api';

const UNSPLASH_API = 'https://api.unsplash.com';

export async function searchUnsplash(
  query: string,
  count: number = 4
): Promise<ImageResult[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];

  try {
    const params = new URLSearchParams({
      query,
      per_page: count.toString(),
      content_filter: 'high',
    });

    const res = await fetch(`${UNSPLASH_API}/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      next: { revalidate: 86400 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || []).map((photo: Record<string, unknown>) => {
      const urls = photo.urls as Record<string, string>;
      const user = photo.user as Record<string, string>;
      return {
        id: photo.id as string,
        url: urls.regular,
        thumbnailUrl: urls.small,
        alt: (photo.alt_description as string) || query,
        photographer: user.name,
        source: 'unsplash' as const,
        width: photo.width as number,
        height: photo.height as number,
      };
    });
  } catch {
    return [];
  }
}
