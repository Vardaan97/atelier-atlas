'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useGlobeStore } from '@/store/useGlobeStore';
import { useFashionNews } from '@/hooks/useFashionNews';
import { Clock, BarChart3, Newspaper } from 'lucide-react';
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

function articleToTickerItem(article: GdeltArticle): { text: string; url: string; source: string; time: string } {
  const sourceName = article.source.replace(/\.com$|\.co\.uk$|\.org$/, '');
  return {
    text: article.title,
    url: article.url,
    source: sourceName.toUpperCase(),
    time: timeAgo(article.date),
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
    const items: { text: string; url: string | null; source: string | null; time: string | null; isNews: boolean }[] = [];

    // Add country-specific news first (if panel open and we have articles)
    if (panelOpen && selectedCountry && countryArticles.length > 0) {
      for (const article of countryArticles.slice(0, 5)) {
        const item = articleToTickerItem(article);
        items.push({ ...item, isNews: true });
      }
    }

    // Add global news articles
    for (const article of globalArticles.slice(0, 15)) {
      const item = articleToTickerItem(article);
      items.push({ ...item, isNews: true });
    }

    // Fill remaining space with static facts (as fallback / variety)
    for (const fact of staticFacts.slice(0, 10)) {
      items.push({ text: fact, url: null, source: null, time: null, isNews: false });
    }

    return items;
  }, [globalArticles, countryArticles, panelOpen, selectedCountry]);

  const hasLiveNews = tickerItems.some((item) => item.isNews);

  // Duration scales with content
  const duration = Math.max(60, tickerItems.length * 3);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-20 overflow-hidden h-10',
        'bg-[#0A0A1A]/95 backdrop-blur-xl',
        'hidden md:block',
        className
      )}
    >
      {/* Top border gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      {/* LIVE indicator - fixed on left */}
      {hasLiveNews && (
        <div className="absolute left-0 top-0 bottom-0 z-30 flex items-center gap-1.5 pl-3 pr-4 bg-[#0A0A1A]/95">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-bold font-mono tracking-wider text-emerald-400">
            LIVE
          </span>
          <div className="ml-2 w-px h-4 bg-white/10" />
        </div>
      )}

      {/* Left gradient fade mask */}
      <div
        className="absolute left-0 top-0 bottom-0 z-20 pointer-events-none"
        style={{
          width: hasLiveNews ? '5.5rem' : '3rem',
          background: 'linear-gradient(to right, #0A0A1A 30%, transparent)',
        }}
      />

      {/* Right gradient fade mask */}
      <div
        className="absolute right-0 top-0 bottom-0 z-20 w-12 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, #0A0A1A 10%, transparent)',
        }}
      />

      {/* Scrolling content */}
      <div
        className="flex whitespace-nowrap animate-ticker-scroll hover:[animation-play-state:paused] group"
        style={{
          animationDuration: `${duration}s`,
          paddingLeft: hasLiveNews ? '5.5rem' : '1rem',
        }}
      >
        {/* Duplicate content for seamless loop */}
        {[0, 1].map((copy) => (
          <span
            key={copy}
            className="inline-flex items-center text-[11px] font-mono text-white/60 py-2 px-4 ticker-content"
          >
            {tickerItems.map((item, i) => (
              <span key={`${copy}-${i}`} className="inline-flex items-center">
                <TickerItemEl
                  text={item.text}
                  url={item.url}
                  source={item.source}
                  time={item.time}
                  isNews={item.isNews}
                />
                <span className="text-accent/40 mx-3 text-[8px]">{'\u25C6'}</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Renders a ticker item with source badge, type icon, clickable URL, and number highlighting */
function TickerItemEl({
  text,
  url,
  source,
  time,
  isNews,
}: {
  text: string;
  url: string | null;
  source: string | null;
  time: string | null;
  isNews: boolean;
}) {
  const content = (
    <span className="inline-flex items-center gap-1.5">
      {/* Type icon */}
      {isNews ? (
        <Newspaper className="w-3 h-3 text-accent/50 flex-shrink-0" />
      ) : (
        <BarChart3 className="w-3 h-3 text-white/30 flex-shrink-0" />
      )}

      {/* Source badge for news items */}
      {source && (
        <span className="text-accent font-semibold text-[10px] tracking-wide mr-0.5">
          {source}
        </span>
      )}

      {/* Headline text with number highlighting */}
      <TickerText text={text} />

      {/* Time badge for news items */}
      {time && (
        <span className="inline-flex items-center gap-0.5 text-white/30 ml-1">
          <Clock className="w-2.5 h-2.5" />
          <span className="text-[9px]">{time}</span>
        </span>
      )}
    </span>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-white/90 hover:brightness-110 transition-all cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    );
  }

  return content;
}

/** Highlights numbers, currencies, and percentages in ticker text */
function TickerText({ text }: { text: string }) {
  // Split on patterns that look like numbers/currency/percentages
  const parts = text.split(/(\$[\d.]+[BMK]?|\d+(?:\.\d+)?%|\d+(?:\.\d+)?[BMK]|\b\d{2,}\b)/g);

  return (
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
}
