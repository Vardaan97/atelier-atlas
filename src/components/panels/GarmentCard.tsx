'use client';

import { useState } from 'react';
import { Shirt, Calendar, Tag, Layers, Flame, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useImages } from '@/hooks/useImages';
import type { Garment } from '@/types/country';

interface GarmentTrendInfo {
  trending: boolean;
  direction: 'up' | 'down' | 'stable';
  score: number;
}

interface GarmentCardProps {
  garment: Garment;
  countryName: string;
  index?: number;
  trendInfo?: GarmentTrendInfo;
  onClick?: (garment: Garment) => void;
}

/**
 * Build a garment-specific search query optimized for stock photo accuracy.
 *
 * Key principles:
 * - SHORTER queries work better ("traditional sari India" > long phrases)
 * - Garment name first — describes what we want
 * - No "full body" — ironically returns face closeups
 * - No "photography"/"fashion" — biases toward editorial/artistic shots
 * - Use material/technique keywords for specificity
 */
export function buildGarmentQuery(garment: Garment, countryName: string): string {
  if (garment.imageQuery) return garment.imageQuery;
  // Short, specific fallback: "traditional [garment] [country]"
  return `traditional ${garment.name} ${countryName} clothing`;
}

export function GarmentCard({ garment, countryName, index = 0, trendInfo, onClick }: GarmentCardProps) {
  const query = buildGarmentQuery(garment, countryName);
  const { images, loading } = useImages(query, 3);
  const [imgIdx, setImgIdx] = useState(0);
  const heroImage = images[imgIdx] || images[0];
  const hasMultiple = images.length > 1;

  const prevImage = () => setImgIdx((i) => (i - 1 + images.length) % images.length);
  const nextImage = () => setImgIdx((i) => (i + 1) % images.length);

  return (
    <div
      className="glass-panel glass-panel-hover rounded-xl overflow-hidden animate-fade-in-up cursor-pointer group/card"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => onClick?.(garment)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(garment);
        }
      }}
    >
      {/* Hero Image with mini carousel */}
      <div className="relative w-full h-48 overflow-hidden group">
        {loading ? (
          <div className="w-full h-full bg-white/5 animate-pulse">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
        ) : heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage.thumbnailUrl || heroImage.url}
              alt={garment.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A1A] via-transparent to-transparent" />
            {/* Carousel controls */}
            {hasMultiple && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {/* Dots indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setImgIdx(i); }}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white/80' : 'bg-white/30'}`}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            <span className="absolute bottom-2 right-2 text-[9px] text-white/40 bg-black/40 px-1.5 py-0.5 rounded capitalize">
              {heroImage.source}
            </span>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/40 to-accent/10 flex items-center justify-center">
            <Shirt className="w-10 h-10 text-muted/20" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-heading font-semibold text-base">
            {garment.name}
          </h4>
          {trendInfo?.trending && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/15 text-[9px] text-accent font-mono animate-pulse-subtle">
              <Flame className="w-2.5 h-2.5" />
              Trending
            </span>
          )}
          {trendInfo && !trendInfo.trending && trendInfo.direction === 'up' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-400/10 text-[9px] text-green-400 font-mono">
              <TrendingUp className="w-2.5 h-2.5" />
              Rising
            </span>
          )}
          {trendInfo && trendInfo.direction === 'down' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/5 text-[9px] text-muted font-mono">
              <TrendingDown className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
        <p className="text-sm text-muted leading-relaxed mb-3">
          {garment.description}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-muted">
            <Calendar className="w-3 h-3" />
            {garment.era}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-muted">
            <Tag className="w-3 h-3" />
            {garment.occasion}
          </span>
          {garment.materials.map((mat) => (
            <span
              key={mat}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-[10px] text-accent"
            >
              <Layers className="w-3 h-3" />
              {mat}
            </span>
          ))}
        </div>

        {/* Click hint */}
        {onClick && (
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/5 text-[10px] text-muted/50 group-hover/card:text-accent/60 transition-colors">
            <span>View details</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
}
