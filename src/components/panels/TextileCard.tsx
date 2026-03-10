'use client';

import { Layers } from 'lucide-react';
import { useImages } from '@/hooks/useImages';
import type { Textile } from '@/types/country';

interface TextileCardProps {
  textile: Textile;
  countryName: string;
  index?: number;
}

export function TextileCard({ textile, countryName, index = 0 }: TextileCardProps) {
  const query = textile.imageQuery || `${textile.name} fabric textile ${countryName}`;
  const { images, loading } = useImages(query, 1);
  const heroImage = images[0];

  return (
    <div
      className="glass-panel glass-panel-hover rounded-xl overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Texture Image */}
      <div className="relative w-full h-32 overflow-hidden">
        {loading ? (
          <div className="w-full h-full bg-white/5 animate-pulse">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
        ) : heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage.thumbnailUrl || heroImage.url}
              alt={textile.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A1A]/80 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/5 to-secondary/20 flex items-center justify-center">
            <Layers className="w-8 h-8 text-muted/20" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <h5 className="font-heading font-semibold text-sm">{textile.name}</h5>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-mono uppercase">
            {textile.type}
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed mb-2">
          {textile.description}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-muted">
          {textile.origin && <span>Origin: {textile.origin}</span>}
          {textile.technique && <span>Technique: {textile.technique}</span>}
        </div>
      </div>
    </div>
  );
}

interface FabricChipProps {
  fabric: string;
}

export function FabricChip({ fabric }: FabricChipProps) {
  return (
    <div className="glass-panel glass-panel-hover rounded-lg px-3 py-2.5 flex items-center gap-2">
      <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
      <span className="text-xs font-medium">{fabric}</span>
    </div>
  );
}
