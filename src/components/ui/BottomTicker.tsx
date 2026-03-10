'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import countriesData from '@/data/countries.json';
import type { CountryBase } from '@/types/country';

interface BottomTickerProps {
  className?: string;
}

function formatMarketSize(value: number): string {
  if (value >= 1) return `$${value.toFixed(1)}B`;
  return `$${(value * 1000).toFixed(0)}M`;
}

function generateFacts(countries: CountryBase[]): string[] {
  const facts: string[] = [];

  // Shuffle and pick a diverse set
  const shuffled = [...countries].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 40);

  for (const c of selected) {
    // Template 1: Fashion Index + Market
    if (c.fashionIndex > 0 && c.marketSize > 0) {
      facts.push(
        `${c.flag} ${c.name} — Fashion Index: ${c.fashionIndex} — ${formatMarketSize(c.marketSize)} Market`
      );
    }

    // Template 2: Fabrics + Fashion Week (only for countries with fashion weeks)
    if (c.primaryFabrics.length > 0 && c.fashionWeeks.length > 0) {
      const fabrics = c.primaryFabrics.slice(0, 3).join(', ');
      facts.push(
        `${c.flag} ${c.name} — Known for: ${fabrics} — ${c.fashionWeeks[0]}`
      );
    }

    // Template 3: Sustainability + Traditional Garments
    if (c.sustainabilityScore > 0 && c.traditionalGarments.length > 0) {
      const garments = c.traditionalGarments
        .slice(0, 2)
        .map((g) => g.name)
        .join(', ');
      facts.push(
        `${c.flag} ${c.name} — Sustainability: ${c.sustainabilityScore}% — ${garments}`
      );
    }

    // Template 4: Textile Exports + Fabrics
    if (c.textileExports > 0 && c.primaryFabrics.length >= 2) {
      const fabrics = c.primaryFabrics.slice(0, 3).join(', ');
      facts.push(
        `${c.flag} ${c.name} — Textile Exports: ${formatMarketSize(c.textileExports)} — ${fabrics}`
      );
    }

    // Template 5: Growth Rate (from industryStats)
    if (c.industryStats?.growthRate > 0 && c.industryStats?.employmentMillions > 0) {
      facts.push(
        `${c.flag} ${c.name} — Growth: ${c.industryStats.growthRate}% YoY — ${c.industryStats.employmentMillions}M Employed`
      );
    }

    // Template 6: Key Designers
    if (c.keyDesigners.length > 0) {
      const designer = c.keyDesigners[0];
      const brand = designer.brand ? ` (${designer.brand})` : '';
      facts.push(
        `${c.flag} ${c.name} — ${designer.name}${brand} — ${designer.specialty}`
      );
    }
  }

  // Shuffle all facts and take ~30
  return facts.sort(() => Math.random() - 0.5).slice(0, 30);
}

export function BottomTicker({ className }: BottomTickerProps) {
  const facts = useMemo(() => {
    const countries = countriesData as unknown as CountryBase[];
    return generateFacts(countries);
  }, []);

  // Duration scales with content: ~2s per fact for a smooth read speed
  const duration = Math.max(40, facts.length * 2);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-20 overflow-hidden',
        'bg-white/5 backdrop-blur-xl border-t border-white/10',
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
          {facts.map((fact, i) => (
            <span key={`a-${i}`}>
              <TickerFact text={fact} />
              <span className="text-accent/60 mx-3">{'\u25C6'}</span>
            </span>
          ))}
        </span>
        <span className="inline-block text-[11px] font-mono text-muted py-2 px-4 ticker-content">
          {facts.map((fact, i) => (
            <span key={`b-${i}`}>
              <TickerFact text={fact} />
              <span className="text-accent/60 mx-3">{'\u25C6'}</span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/** Highlights numbers and currency values in accent color */
function TickerFact({ text }: { text: string }) {
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
