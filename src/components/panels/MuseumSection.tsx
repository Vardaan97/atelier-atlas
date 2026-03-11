'use client';

import { ExternalLink, Landmark } from 'lucide-react';
import { useMuseumData } from '@/hooks/useMuseumData';
import { Skeleton, ImageSkeleton } from '@/components/ui/Skeleton';
import type { MuseumItem } from '@/lib/metmuseum';

// ---------------------------------------------------------------------------
// Full museum section for TraditionalTab
// ---------------------------------------------------------------------------

interface MuseumSectionProps {
  countryName: string;
  /** Optional garment to focus the search on */
  garmentName?: string;
}

export function MuseumSection({ countryName, garmentName }: MuseumSectionProps) {
  const { items, loading, error } = useMuseumData(countryName, {
    garment: garmentName,
    limit: 5,
  });

  if (error && !loading && items.length === 0) {
    return null; // Fail silently — museum data is supplementary
  }

  return (
    <div className="space-y-3 mt-6">
      <div className="flex items-center gap-2">
        <Landmark className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Museum Collection
        </h3>
      </div>

      {loading ? (
        <MuseumSkeleton />
      ) : items.length === 0 ? (
        <p className="text-xs text-muted/50 italic pl-1">
          No matching items in the Met&apos;s Costume Institute
        </p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <MuseumItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Attribution — required by Met Museum terms */}
      <p className="text-[10px] text-muted/40 text-center pt-1">
        From The Metropolitan Museum of Art &middot; Open Access
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact inline museum items for TimelineTab
// ---------------------------------------------------------------------------

interface MuseumEraInlineProps {
  countryName: string;
  eraName: string;
}

export function MuseumEraInline({ countryName, eraName }: MuseumEraInlineProps) {
  const { items, loading } = useMuseumData(countryName, {
    era: eraName,
    limit: 2,
  });

  if (!loading && items.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {loading ? (
        <div className="flex gap-2">
          <ImageSkeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
      ) : (
        items.map((item) => (
          <MuseumItemInline key={item.id} item={item} />
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card variants
// ---------------------------------------------------------------------------

function MuseumItemCard({ item }: { item: MuseumItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-panel glass-panel-hover rounded-xl overflow-hidden flex gap-3 p-3 group transition-all"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/5">
        {item.imageSmall ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.imageSmall}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Landmark className="w-6 h-6 text-muted/20" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground leading-tight line-clamp-2 group-hover:text-accent transition-colors">
          {item.title}
        </h4>
        {(item.culture || item.date) && (
          <p className="text-[11px] text-muted mt-0.5">
            {[item.culture, item.date].filter(Boolean).join(' \u00B7 ')}
          </p>
        )}
        {item.medium && (
          <p className="text-[10px] text-muted/60 mt-0.5 line-clamp-1">
            {item.medium}
          </p>
        )}
        <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-accent/70 group-hover:text-accent transition-colors">
          <ExternalLink className="w-3 h-3" />
          View at Met Museum
        </span>
      </div>
    </a>
  );
}

function MuseumItemInline({ item }: { item: MuseumItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 group rounded-lg p-1.5 -mx-1.5 hover:bg-white/5 transition-colors"
    >
      {/* Small thumbnail */}
      <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-white/5">
        {item.imageSmall ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.imageSmall}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Landmark className="w-4 h-4 text-muted/20" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted leading-tight line-clamp-1 group-hover:text-accent transition-colors">
          {item.title}
        </p>
        <p className="text-[9px] text-muted/50">
          {[item.date, 'Met Museum'].filter(Boolean).join(' \u00B7 ')}
        </p>
      </div>
      <ExternalLink className="w-3 h-3 text-muted/30 flex-shrink-0 group-hover:text-accent transition-colors" />
    </a>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function MuseumSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass-panel rounded-xl flex gap-3 p-3">
          <ImageSkeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
            <Skeleton className="h-2 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
