import type { MetadataRoute } from 'next';
import countriesData from '@/data/countries.json';
import type { CountryBase } from '@/types/country';

export default function sitemap(): MetadataRoute.Sitemap {
  const countries = countriesData as unknown as CountryBase[];
  const base = 'https://atelier-atlas.vercel.app';

  return [
    { url: base, lastModified: new Date(), priority: 1.0 },
    ...countries
      .filter((c) => c.tier === 'A' || c.tier === 'B')
      .map((c) => ({
        url: `${base}/country/${c.iso}`,
        lastModified: new Date(),
        priority: c.tier === 'A' ? 0.8 : 0.6,
      })),
  ];
}
