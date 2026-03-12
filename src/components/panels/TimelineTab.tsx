'use client';

import { motion } from 'framer-motion';
import { Clock, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImages } from '@/hooks/useImages';
import { Skeleton } from '@/components/ui/Skeleton';
import { MuseumEraInline } from './MuseumSection';
import type { CountryBase, CountryProfile, FashionEra } from '@/types/country';

interface TimelineTabProps {
  country: CountryBase;
  profile: CountryProfile | null;
  profileLoading: boolean;
}

export function TimelineTab({ country, profile, profileLoading }: TimelineTabProps) {
  if (profileLoading) {
    return <TimelineSkeleton />;
  }

  const eras = profile?.eras;

  if (!eras || eras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-muted text-sm">Fashion timeline not available</p>
        <p className="text-muted/50 text-xs mt-1">
          {profile ? 'No era data in profile' : 'AI profile needed to generate timeline'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header with gradient underline */}
      <div className="relative flex items-center gap-2 mb-2 pb-2">
        <Clock className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Fashion Through the Ages
        </h3>
        <span className="text-xs text-muted font-mono ml-auto">
          {eras.length} eras
        </span>
        <div className="absolute bottom-0 left-0 w-12 h-[2px] bg-gradient-to-r from-accent to-transparent" />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Gradient timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent/40 via-accent/20 to-transparent" />
        <div className="space-y-6">
          {eras.map((era, i) => (
            <EraCard
              key={era.id}
              era={era}
              countryName={country.name}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EraCard({
  era,
  countryName,
  index,
}: {
  era: FashionEra;
  countryName: string;
  index: number;
}) {
  const imageQuery = `${era.name} fashion ${countryName} traditional clothing ${era.yearRange[0]}`;
  const { images, loading } = useImages(imageQuery, 1);
  const heroImage = images[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative pl-14"
    >
      {/* Timeline dot with glow */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.1 + 0.15, type: 'spring', stiffness: 300 }}
        className={cn(
          'absolute left-4 top-3 w-5 h-5 rounded-full bg-[#0A0A1A] border-2 border-accent',
          'flex items-center justify-center z-10',
          'shadow-[0_0_8px_rgba(233,69,96,0.4)]'
        )}
      >
        <div className="w-2 h-2 rounded-full bg-accent" />
      </motion.div>

      {/* Card with gradient top border */}
      <div className="relative glass-panel glass-panel-hover rounded-xl overflow-hidden">
        {/* Subtle gradient top accent line */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        {/* Image */}
        {(loading || heroImage) && (
          <div className="relative w-full h-36 overflow-hidden">
            {loading ? (
              <div className="w-full h-full bg-white/5 animate-pulse" />
            ) : heroImage ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImage.thumbnailUrl || heroImage.url}
                  alt={era.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A1A] via-[#0A0A1A]/20 to-transparent" />
              </>
            ) : null}
          </div>
        )}

        <div className="p-4">
          {/* Year badge with gradient background */}
          <span className="text-[10px] font-mono text-accent bg-gradient-to-r from-accent/15 to-pink-500/10 px-2.5 py-0.5 rounded-full border border-accent/20">
            {era.yearRange[0]} — {era.yearRange[1]}
          </span>

          <h4 className="font-heading font-semibold text-base mt-2 mb-1">{era.name}</h4>
          <p className="text-sm text-muted leading-relaxed mb-3">{era.description}</p>

          {/* Key garments with hover effect */}
          {era.keyGarments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {era.keyGarments.map(g => (
                <span
                  key={g}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full',
                    'bg-white/5 text-[10px] text-muted border border-white/5',
                    'hover:bg-white/10 hover:border-accent/20 hover:text-foreground',
                    'transition-all duration-200 cursor-default'
                  )}
                >
                  <Shirt className="w-3 h-3" />
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Met Museum items for this era */}
          <MuseumEraInline countryName={countryName} eraName={era.name} />
        </div>
      </div>
    </motion.div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="relative pl-14">
          <Skeleton className="absolute left-4 top-3 w-5 h-5 rounded-full" />
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
