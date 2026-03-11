import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import countriesData from '@/data/countries.json';
import type { CountryBase } from '@/types/country';
import { formatCurrency, formatNumber } from '@/lib/utils';

const countries = countriesData as unknown as CountryBase[];

function getCountry(iso: string): CountryBase | undefined {
  return countries.find(
    (c) => c.iso.toLowerCase() === iso.toLowerCase()
  );
}

type Props = {
  params: Promise<{ iso: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { iso } = await params;
  const country = getCountry(iso);

  if (!country) {
    return { title: 'Country Not Found — Atelier Atlas' };
  }

  const title = `${country.flag} ${country.name} — Fashion Intelligence | Atelier Atlas`;
  const description = `Explore ${country.name}'s fashion landscape: traditional garments, textile industry ($${country.marketSize}B market), key designers, and cultural color palettes. Fashion Index: ${country.fashionIndex}/100.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Atelier Atlas',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export function generateStaticParams(): { iso: string }[] {
  return countries
    .filter((c) => c.tier === 'A' || c.tier === 'B')
    .map((c) => ({ iso: c.iso }));
}

export default async function CountryPage({ params }: Props) {
  const { iso } = await params;
  const country = getCountry(iso);

  if (!country) {
    notFound();
  }

  const stats = country.industryStats;

  return (
    <main className="min-h-screen bg-[#0A0A1A] text-[#F0F0F5]">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Country',
            name: country.name,
            identifier: country.iso,
            description: `Fashion intelligence profile for ${country.name}. Fashion Index: ${country.fashionIndex}/100, Market Size: $${country.marketSize}B.`,
            geo: {
              '@type': 'GeoCoordinates',
              latitude: country.coordinates[0],
              longitude: country.coordinates[1],
            },
          }),
        }}
      />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#F0F0F5]/60 hover:text-[#E94560] transition-colors mb-8"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          View on Interactive Globe
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-5xl">{country.flag}</span>
            <div>
              <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-bold tracking-tight">
                {country.name}
              </h1>
              <p className="text-[#F0F0F5]/60 text-lg mt-1">
                {country.subregion} &middot; {country.region}
              </p>
            </div>
          </div>
          <p className="text-[#F0F0F5]/40 text-sm mt-2">
            Capital: {country.capital} &middot; Population:{' '}
            {formatNumber(country.population)}
          </p>
        </header>

        {/* Stats Grid */}
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-6">
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Fashion Index"
              value={`${country.fashionIndex}`}
              sub="/100"
            />
            <StatCard
              label="Market Size"
              value={`$${country.marketSize}B`}
            />
            <StatCard
              label="Textile Exports"
              value={formatCurrency(country.textileExports * 1e9)}
            />
            <StatCard
              label="Sustainability"
              value={`${country.sustainabilityScore}`}
              sub="/100"
            />
            <StatCard
              label="Growth Rate"
              value={`${stats.growthRate}%`}
            />
            <StatCard
              label="Employment"
              value={`${stats.employmentMillions}M`}
              sub="workers"
            />
            <StatCard
              label="Textile Imports"
              value={formatCurrency(stats.textileImportsUSD * 1e9)}
            />
            <StatCard
              label="Sustainability Index"
              value={`${stats.sustainabilityIndex}`}
              sub="/100"
            />
          </div>
        </section>

        {/* Fashion Weeks */}
        {country.fashionWeeks.length > 0 && (
          <section className="mb-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-4">
              Fashion Weeks
            </h2>
            <div className="flex flex-wrap gap-3">
              {country.fashionWeeks.map((fw) => (
                <span
                  key={fw}
                  className="px-4 py-2 rounded-full bg-[#E94560]/10 border border-[#E94560]/30 text-[#E94560] text-sm font-medium"
                >
                  {fw}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Traditional Garments */}
        {country.traditionalGarments.length > 0 && (
          <section className="mb-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-6">
              Traditional Garments
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {country.traditionalGarments.map((g) => (
                <div
                  key={g.name}
                  className="p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <h3 className="text-lg font-semibold text-[#F0F0F5] mb-1">
                    {g.name}
                  </h3>
                  <p className="text-[#F0F0F5]/50 text-xs mb-2">
                    {g.era} &middot; {g.occasion}
                  </p>
                  <p className="text-[#F0F0F5]/70 text-sm leading-relaxed mb-3">
                    {g.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {g.materials.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded bg-[#0F3460]/50 text-[#F0F0F5]/60 text-xs"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Primary Fabrics */}
        {country.primaryFabrics.length > 0 && (
          <section className="mb-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-4">
              Primary Fabrics
            </h2>
            <div className="flex flex-wrap gap-3">
              {country.primaryFabrics.map((f) => (
                <span
                  key={f}
                  className="px-4 py-2 rounded-full bg-[#0F3460]/40 border border-[#0F3460]/60 text-[#F0F0F5]/80 text-sm"
                >
                  {f}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Color Palette */}
        {country.colorPalette.length > 0 && (
          <section className="mb-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-6">
              Cultural Color Palette
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {country.colorPalette.map((c) => (
                <div
                  key={c.hex}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div
                    className="w-full h-16 rounded-lg mb-3"
                    style={{ backgroundColor: c.hex }}
                  />
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-[#F0F0F5]/40 text-xs font-[family-name:var(--font-jetbrains)]">
                    {c.hex}
                  </p>
                  <p className="text-[#F0F0F5]/60 text-xs mt-1">
                    {c.meaning}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Designers */}
        {country.keyDesigners.length > 0 && (
          <section className="mb-12">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-6">
              Key Designers
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {country.keyDesigners.map((d) => (
                <div
                  key={d.name}
                  className="p-5 rounded-xl bg-white/5 border border-white/10"
                >
                  <h3 className="font-semibold text-[#F0F0F5]">{d.name}</h3>
                  {d.brand && (
                    <p className="text-[#E94560] text-sm">{d.brand}</p>
                  )}
                  <p className="text-[#F0F0F5]/50 text-xs mt-1">{d.era}</p>
                  <p className="text-[#F0F0F5]/70 text-sm mt-2">
                    {d.specialty}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trade Partners */}
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold mb-6">
            Trade Partners
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {stats.topExportPartners.length > 0 && (
              <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-[#F0F0F5]/60 uppercase tracking-wider mb-3">
                  Top Export Partners
                </h3>
                <ul className="space-y-2">
                  {stats.topExportPartners.map((p) => (
                    <li
                      key={p}
                      className="text-[#F0F0F5]/80 text-sm flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E94560]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {stats.topImportPartners.length > 0 && (
              <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-[#F0F0F5]/60 uppercase tracking-wider mb-3">
                  Top Import Partners
                </h3>
                <ul className="space-y-2">
                  {stats.topImportPartners.map((p) => (
                    <li
                      key={p}
                      className="text-[#F0F0F5]/80 text-sm flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F3460]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-8 text-center">
          <p className="text-[#F0F0F5]/30 text-sm">
            Atelier Atlas &mdash; Global Fashion Intelligence
          </p>
        </footer>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <p className="text-[#F0F0F5]/50 text-xs uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold font-[family-name:var(--font-jetbrains)] text-[#F0F0F5]">
        {value}
        {sub && (
          <span className="text-sm font-normal text-[#F0F0F5]/40 ml-1">
            {sub}
          </span>
        )}
      </p>
    </div>
  );
}
