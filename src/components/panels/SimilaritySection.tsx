'use client';

import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobeStore } from '@/store/useGlobeStore';
import similarityData from '@/data/similarity.json';

const data = similarityData as Record<
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
  const entries = data[iso];

  if (!entries || entries.length === 0) {
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
          <button
            key={entry.iso}
            onClick={() => selectCountry(entry.iso)}
            className={cn(
              'glass-panel rounded-xl p-3 w-full text-left',
              'hover:bg-white/[0.08] transition-all duration-200 cursor-pointer',
              'animate-fade-in-up'
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center gap-3">
              {/* Flag + Name */}
              <span className="text-xl leading-none">{entry.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{entry.name}</p>

                {/* Shared fabric chips */}
                {entry.sharedFabrics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entry.sharedFabrics.map((fabric) => (
                      <span
                        key={fabric}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-muted border border-white/10"
                      >
                        {fabric}
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
                <span className="text-[9px] text-muted font-mono ml-0.5">
                  %
                </span>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${entry.score}%`,
                  background:
                    'linear-gradient(90deg, var(--color-accent) 0%, #FF6B8A 100%)',
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
