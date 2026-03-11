'use client';

import { Shirt, Calendar, Tag, Layers } from 'lucide-react';
import { useImages } from '@/hooks/useImages';
import type { Garment } from '@/types/country';

interface GarmentCardProps {
  garment: Garment;
  countryName: string;
  index?: number;
}

// Rotate modifiers for image variety
const GARMENT_MODIFIERS = [
  'full body outfit fashion photography',
  'woman wearing traditional outfit full body',
  'man wearing traditional outfit full body',
  'couple wearing traditional clothing',
  'woman in traditional dress full body portrait',
  'traditional outfit detailed garment photography',
];

export function GarmentCard({ garment, countryName, index = 0 }: GarmentCardProps) {
  const modifier = GARMENT_MODIFIERS[index % GARMENT_MODIFIERS.length];
  const query = garment.imageQuery || `${garment.name} ${countryName} ${modifier}`;
  const { images, loading } = useImages(query, 1);
  const heroImage = images[0];

  return (
    <div
      className="glass-panel glass-panel-hover rounded-xl overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Hero Image */}
      <div className="relative w-full h-48 overflow-hidden">
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
        <h4 className="font-heading font-semibold text-base mb-1">
          {garment.name}
        </h4>
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
      </div>
    </div>
  );
}
