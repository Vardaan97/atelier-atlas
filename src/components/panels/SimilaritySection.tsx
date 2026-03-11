'use client';

import { useMemo } from 'react';
import { Link2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobeStore } from '@/store/useGlobeStore';
import {
  getSimilarCountries,
  hasCharacteristics,
  type SimilarityResult,
} from '@/lib/fashionSimilarity';

// Fallback to legacy static data for countries without characteristics
import legacyData from '@/data/similarity.json';

const legacy = legacyData as Record<
  string,
  Array<{
    iso: string;
    name: string;
    score: number;
    sharedFabrics: string[];
    flag: string;
  }>
>;

interface SimilaritySectionProps {
  iso: string;
}

export function SimilaritySection({ iso }: SimilaritySectionProps) {
  const selectCountry = useGlobeStore((s) => s.selectCountry);

  // Compute similarity using the new algorithm, falling back to legacy
  const entries: SimilarityResult[] = useMemo(() => {
    if (hasCharacteristics(iso)) {
      return getSimilarCountries(iso, 5);
    }

    // Fallback: convert legacy data to SimilarityResult format
    const legacyEntries = legacy[iso];
    if (!legacyEntries) return [];
    return legacyEntries.map((e) => ({
      iso: e.iso,
      name: e.name,
      flag: e.flag,
      score: e.score,
      explanation: e.sharedFabrics.length > 0
        ? `Shared fabric traditions: ${e.sharedFabrics.join(', ')}`
        : 'Similar fashion characteristics',
      sharedTraits: e.sharedFabrics,
      breakdown: {
        silhouette: 0,
        colorPalette: 0,
        materials: 0,
        techniques: 0,
        aesthetic: 0,
        embellishment: 0,
        modesty: 0,
        region: 0,
        climate: 0,
        culturalInfluence: 0,
      },
    }));
  }, [iso]);

  if (entries.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-4 text-center">
        <Link2 className="w-6 h-6 text-muted/40 mx-auto mb-2" />
        <p className="text-xs text-muted">No similarity data available</p>
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Similar Fashion Cultures
        </h3>
      </div>

      <div className="space-y-2">
        {entries.map((entry, i) => (
          <SimilarityCard
            key={entry.iso}
            entry={entry}
            index={i}
            onSelect={selectCountry}
          />
        ))}
      </div>

      {/* Source note */}
      <p className="text-[9px] text-muted/40 text-center mt-3 font-mono leading-relaxed">
        Based on analysis of traditional silhouettes, materials,
        techniques, color palettes, and cultural aesthetics
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Similarity Card
// ---------------------------------------------------------------------------

function SimilarityCard({
  entry,
  index,
  onSelect,
}: {
  entry: SimilarityResult;
  index: number;
  onSelect: (iso: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(entry.iso)}
      className={cn(
        'glass-panel rounded-xl p-3 w-full text-left',
        'hover:bg-white/[0.08] transition-all duration-200 cursor-pointer',
        'animate-fade-in-up group'
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Flag + Name */}
        <span className="text-xl leading-none">{entry.flag}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{entry.name}</p>

          {/* Explanation */}
          <p className="text-[10px] text-muted mt-0.5 flex items-start gap-1 leading-relaxed">
            <Info className="w-2.5 h-2.5 mt-0.5 shrink-0 text-accent/50" />
            <span className="line-clamp-2">{entry.explanation}</span>
          </p>

          {/* Shared trait chips */}
          {entry.sharedTraits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {entry.sharedTraits.slice(0, 4).map((trait) => (
                <span
                  key={trait}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent/80 border border-accent/20"
                >
                  {trait}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <span className="text-sm font-mono font-bold text-accent">
            {entry.score}
          </span>
          <span className="text-[9px] text-muted font-mono ml-0.5">%</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${entry.score}%`,
            background:
              entry.score >= 60
                ? 'linear-gradient(90deg, var(--color-accent) 0%, #FF6B8A 100%)'
                : entry.score >= 40
                  ? 'linear-gradient(90deg, #FFB800 0%, #FFA040 100%)'
                  : 'linear-gradient(90deg, #666 0%, #888 100%)',
          }}
        />
      </div>
    </button>
  );
}
