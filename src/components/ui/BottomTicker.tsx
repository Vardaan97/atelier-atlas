'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useGlobeStore } from '@/store/useGlobeStore';
import { useFashionNews } from '@/hooks/useFashionNews';
import countriesData from '@/data/countries.json';
import type { CountryBase } from '@/types/country';
import type { GdeltArticle } from '@/lib/gdelt';

interface BottomTickerProps {
  className?: string;
}

function formatMarketSize(value: number): string {
  if (value >= 1) return `$${value.toFixed(1)}B`;
  return `$${(value * 1000).toFixed(0)}M`;
}

function generateFacts(countries: CountryBase[]): string[] {
  const facts: string[] = [];
  const shuffled = [...countries].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 40);

  for (const c of selected) {
    if (c.fashionIndex > 0 && c.marketSize > 0) {
      facts.push(
        `${c.flag} ${c.name} — Fashion Index: ${c.fashionIndex} — ${formatMarketSize(c.marketSize)} Market`
      );
    }
    if (c.primaryFabrics.length > 0 && c.fashionWeeks.length > 0) {
      const fabrics = c.primaryFabrics.slice(0, 3).join(', ');
      facts.push(
        `${c.flag} ${c.name} — Known for: ${fabrics} — ${c.fashionWeeks[0]}`
      );
    }
    if (c.sustainabilityScore > 0 && c.traditionalGarments.length > 0) {
      const garments = c.traditionalGarments
        .slice(0, 2)
        .map((g) => g.name)
        .join(', ');
      facts.push(
        `${c.flag} ${c.name} — Sustainability: ${c.sustainabilityScore}% — ${garments}`
      );
    }
    if (c.textileExports > 0 && c.primaryFabrics.length >= 2) {
      const fabrics = c.primaryFabrics.slice(0, 3).join(', ');
      facts.push(
        `${c.flag} ${c.name} — Textile Exports: ${formatMarketSize(c.textileExports)} — ${fabrics}`
      );
    }
    if (c.industryStats?.growthRate > 0 && c.industryStats?.employmentMillions > 0) {
      facts.push(
        `${c.flag} ${c.name} — Growth: ${c.industryStats.growthRate}% YoY — ${c.industryStats.employmentMillions}M Employed`
      );
    }
    if (c.keyDesigners.length > 0) {
      const designer = c.keyDesigners[0];
      const brand = designer.brand ? ` (${designer.brand})` : '';
      facts.push(
        `${c.flag} ${c.name} — ${designer.name}${brand} — ${designer.specialty}`
      );
    }
  }
  return facts.sort(() => Math.random() - 0.5).slice(0, 15);
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function articleToTickerItem(article: GdeltArticle): { text: string; url: string } {
  const sourceName = article.source.replace(/\.com$|\.co\.uk$|\.org$/, '');
  return {
    text: `${sourceName.toUpperCase()} — ${article.title}  [${timeAgo(article.date)}]`,
    url: article.url,
  };
}

export function BottomTicker({ className }: BottomTickerProps) {
  const selectedCountry = useGlobeStore((s) => s.selectedCountry);
  const panelOpen = useGlobeStore((s) => s.panelOpen);

  // Fetch global fashion news
  const { articles: globalArticles } = useFashionNews(undefined, 25);
  // Fetch country-specific news when a country panel is open
  const { articles: countryArticles } = useFashionNews(
    panelOpen && selectedCountry ? selectedCountry : undefined,
    10
  );

  // Build ticker items: mix news articles with static data facts
  const tickerItems = useMemo(() => {
    const staticFacts = generateFacts(countriesData as unknown as CountryBase[]);
    const items: { text: string; url: string | null }[] = [];

    // Add country-specific news first (if panel open and we have articles)
    if (panelOpen && selectedCountry && countryArticles.length > 0) {
      for (const article of countryArticles.slice(0, 5)) {
        const item = articleToTickerItem(article);
        items.push(item);
      }
    }

    // Add global news articles
    for (const article of globalArticles.slice(0, 15)) {
      const item = articleToTickerItem(article);
      items.push(item);
    }

    // Fill remaining space with static facts (as fallback / variety)
    for (const fact of staticFacts.slice(0, 10)) {
      items.push({ text: fact, url: null });
    }

    return items;
  }, [globalArticles, countryArticles, panelOpen, selectedCountry]);

  // Duration scales with content
  const duration = Math.max(60, tickerItems.length * 3);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-20 overflow-hidden h-10',
        'bg-white/5 backdrop-blur-xl border-t border-white/10',
        'hidden md:block',
        className
      )}
    >
      <div
        className="flex whitespace-nowrap animate-ticker-scroll hover:[animation-play-state:paused]"
        style={{
          animationDuration: `${duration}s`,
        }}
      >
        {/* Duplicate content for seamless loop */}
        <span className="inline-block text-[11px] font-mono text-muted py-2 px-4 ticker-content">
          {tickerItems.map((item, i) => (
            <span key={`a-${i}`}>
              <TickerItem text={item.text} url={item.url} />
              <span className="text-accent/60 mx-3">{'\u25C6'}</span>
            </span>
          ))}
        </span>
        <span className="inline-block text-[11px] font-mono text-muted py-2 px-4 ticker-content">
          {tickerItems.map((item, i) => (
            <span key={`b-${i}`}>
              <TickerItem text={item.text} url={item.url} />
              <span className="text-accent/60 mx-3">{'\u25C6'}</span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/** Renders a ticker item — clickable if it has a URL, highlights numbers */
function TickerItem({ text, url }: { text: string; url: string | null }) {
  // Split on patterns that look like numbers/currency/percentages
  const parts = text.split(/(\$[\d.]+[BMK]?|\d+(?:\.\d+)?%|\d+(?:\.\d+)?[BMK]|\b\d{2,}\b)/g);

  const content = (
    <>
      {parts.map((part, i) => {
        const isHighlight = /^\$|^\d+.*[%BMK]$|^\d{2,}$/.test(part);
        return (
          <span
            key={i}
            className={isHighlight ? 'text-accent font-semibold' : undefined}
          >
            {part}
          </span>
        );
      })}
    </>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-accent/90 transition-colors cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    );
  }

  return content;
}
