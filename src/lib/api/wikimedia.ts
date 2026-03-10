import type { ImageResult } from '@/types/api';

const WIKI_API = 'https://commons.wikimedia.org/w/api.php';

export async function searchWikimedia(
  query: string,
  count: number = 4
): Promise<ImageResult[]> {
  try {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrnamespace: '6',
      gsrsearch: query,
      gsrlimit: Math.min(count + 4, 20).toString(), // fetch extra to filter
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|size',
      iiurlwidth: '800',
      format: 'json',
      origin: '*',
    });

    const res = await fetch(`${WIKI_API}?${params}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];

    return Object.values(pages)
      .filter((page: unknown) => {
        const p = page as Record<string, unknown>;
        const title = (p.title as string) || '';
        const info = (p.imageinfo as Record<string, unknown>[])?.[0];
        if (!info) return false;
        // Filter out non-raster images
        const url = (info.url as string) || '';
        if (url.endsWith('.svg') || url.endsWith('.pdf') || url.endsWith('.tif') || url.endsWith('.tiff')) return false;
        // Filter out tiny icons
        if (title.toLowerCase().includes('icon') || title.toLowerCase().includes('logo')) return false;
        return true;
      })
      .slice(0, count)
      .map((page: unknown) => {
        const p = page as Record<string, unknown>;
        const info = (p.imageinfo as Record<string, unknown>[])[0];
        const meta = (info.extmetadata as Record<string, Record<string, string>>) || {};
        const artist = meta.Artist?.value?.replace(/<[^>]*>/g, '') || 'Wikimedia Commons';
        return {
          id: (p.pageid as number).toString(),
          url: (info.thumburl as string) || (info.url as string),
          thumbnailUrl: (info.thumburl as string) || (info.url as string),
          alt: (meta.ObjectName?.value || query).replace(/<[^>]*>/g, '').trim(),
          photographer: artist.length > 60 ? artist.slice(0, 57) + '...' : artist,
          source: 'wikimedia' as const,
          width: (info.thumbwidth as number) || (info.width as number) || 800,
          height: (info.thumbheight as number) || (info.height as number) || 600,
        };
      });
  } catch {
    return [];
  }
}
