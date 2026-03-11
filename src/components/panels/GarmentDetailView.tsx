'use client';

import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Calendar,
  Tag,
  Layers,
  ExternalLink,
  BookOpen,
  Wand2,
  Shirt,
  Flame,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useGarmentInfo } from '@/hooks/useGarmentInfo';
import { useImages } from '@/hooks/useImages';
import { MuseumSection } from './MuseumSection';
import { Skeleton, ImageSkeleton } from '@/components/ui/Skeleton';
import type { Garment } from '@/types/country';

interface GarmentTrendInfo {
  trending: boolean;
  direction: 'up' | 'down' | 'stable';
  score: number;
}

interface GarmentDetailViewProps {
  garment: Garment;
  countryName: string;
  onBack: () => void;
  onOpenAiStudio: () => void;
  trendInfo?: GarmentTrendInfo;
}

// Multiple image modifiers for variety
const DETAIL_IMAGE_MODIFIERS = [
  'traditional full body fashion photography',
  'woman wearing traditional outfit detailed',
  'man wearing traditional outfit cultural',
  'close up textile pattern detail',
];

export function GarmentDetailView({
  garment,
  countryName,
  onBack,
  onOpenAiStudio,
  trendInfo,
}: GarmentDetailViewProps) {
  // Fetch Wikipedia info (lazy-loaded)
  const { info: wikiInfo, loading: wikiLoading } = useGarmentInfo(
    garment.name,
    countryName
  );

  // Fetch multiple images (4 different views)
  const imageQueries = DETAIL_IMAGE_MODIFIERS.map(
    (mod) => garment.imageQuery || `${garment.name} ${countryName} ${mod}`
  );
  const { images: images0, loading: imgLoading0 } = useImages(imageQueries[0], 1);
  const { images: images1, loading: imgLoading1 } = useImages(imageQueries[1], 1);
  const { images: images2, loading: imgLoading2 } = useImages(imageQueries[2], 1);
  const { images: images3, loading: imgLoading3 } = useImages(imageQueries[3], 1);

  // Deduplicate images by URL
  const allImages = [images0[0], images1[0], images2[0], images3[0]].filter(
    (img, idx, arr) =>
      img && arr.findIndex((i) => i?.url === img.url) === idx
  );
  const imagesLoading = imgLoading0 || imgLoading1 || imgLoading2 || imgLoading3;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="space-y-5"
    >
      {/* Back button + garment name header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="h-4 w-px bg-white/10" />
        <h3 className="font-heading font-bold text-lg truncate">
          {garment.name}
        </h3>
        {trendInfo?.trending && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/15 text-[9px] text-accent font-mono animate-pulse-subtle shrink-0">
            <Flame className="w-2.5 h-2.5" />
            Trending
          </span>
        )}
        {trendInfo && !trendInfo.trending && trendInfo.direction === 'up' && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-400/10 text-[9px] text-green-400 font-mono shrink-0">
            <TrendingUp className="w-2.5 h-2.5" />
            Rising
          </span>
        )}
        {trendInfo && trendInfo.direction === 'down' && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/5 text-[9px] text-muted font-mono shrink-0">
            <TrendingDown className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      {/* Image gallery */}
      <div className="space-y-2">
        {imagesLoading && allImages.length === 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <ImageSkeleton key={i} className="w-full aspect-[3/4] rounded-lg" />
            ))}
          </div>
        ) : allImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {allImages.slice(0, 3).map((img, idx) => (
              <motion.div
                key={img!.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.08 }}
                className="relative rounded-lg overflow-hidden group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img!.thumbnailUrl || img!.url}
                  alt={`${garment.name} - view ${idx + 1}`}
                  loading="lazy"
                  className="w-full aspect-[3/4] object-cover transition-transform group-hover:scale-105 duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-1 right-1 text-[8px] text-white/40 bg-black/40 px-1 py-0.5 rounded capitalize">
                  {img!.source}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-full aspect-[3/4] rounded-lg bg-gradient-to-br from-secondary/40 to-accent/10 flex items-center justify-center"
              >
                <Shirt className="w-6 h-6 text-muted/20" />
              </div>
            ))}
          </div>
        )}

        {/* Fourth image if available - shown wider below */}
        {allImages.length > 3 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative rounded-lg overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={allImages[3]!.thumbnailUrl || allImages[3]!.url}
              alt={`${garment.name} - detail`}
              loading="lazy"
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <span className="absolute bottom-1 right-1 text-[8px] text-white/40 bg-black/40 px-1 py-0.5 rounded capitalize">
              {allImages[3]!.source}
            </span>
          </motion.div>
        )}
      </div>

      {/* Quick metadata */}
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <p className="text-sm text-muted leading-relaxed">
          {garment.description}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-muted">
            <Calendar className="w-3 h-3" />
            {garment.era}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-muted">
            <Tag className="w-3 h-3" />
            {garment.occasion}
          </span>
          {garment.materials.map((mat) => (
            <span
              key={mat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-[11px] text-accent"
            >
              <Layers className="w-3 h-3" />
              {mat}
            </span>
          ))}
        </div>
      </div>

      {/* Wikipedia section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" />
          <h4 className="text-sm font-medium text-muted uppercase tracking-wider">
            About This Garment
          </h4>
        </div>

        {wikiLoading ? (
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/6" />
          </div>
        ) : wikiInfo ? (
          <div className="glass-panel rounded-xl p-4 space-y-3">
            {wikiInfo.description && (
              <p className="text-xs text-accent font-mono uppercase tracking-wider">
                {wikiInfo.description}
              </p>
            )}

            {/* Wikipedia extract - render paragraphs */}
            <div className="space-y-2.5">
              {wikiInfo.extract.split('\n\n').map((paragraph, idx) => (
                <p
                  key={idx}
                  className="text-sm text-foreground/85 leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Wikipedia attribution link */}
            <a
              href={wikiInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-accent/70 hover:text-accent transition-colors pt-1"
            >
              <ExternalLink className="w-3 h-3" />
              Read more on Wikipedia
            </a>
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-4 text-center">
            <BookOpen className="w-6 h-6 text-muted/30 mx-auto mb-1" />
            <p className="text-xs text-muted">
              No Wikipedia article found for {garment.name}
            </p>
            <p className="text-[10px] text-muted/50 mt-0.5">
              Try searching Wikipedia directly for more info
            </p>
          </div>
        )}
      </div>

      {/* Museum Pieces */}
      <MuseumSection
        countryName={countryName}
        garmentName={garment.name}
      />

      {/* Search Interest indicator */}
      {trendInfo && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h4 className="text-sm font-medium text-muted uppercase tracking-wider">
              Search Interest
            </h4>
          </div>
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">
                Google Trends Score
              </span>
              <span className="text-sm font-mono text-accent font-bold">
                {trendInfo.score}
              </span>
            </div>
            {/* Simple bar visualization */}
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(trendInfo.score, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  trendInfo.trending
                    ? 'bg-accent'
                    : trendInfo.direction === 'up'
                      ? 'bg-green-400'
                      : 'bg-white/20'
                }`}
              />
            </div>
            <p className="text-[10px] text-muted mt-1.5">
              {trendInfo.trending
                ? 'Currently trending worldwide'
                : trendInfo.direction === 'up'
                  ? 'Search interest is rising'
                  : trendInfo.direction === 'down'
                    ? 'Search interest is declining'
                    : 'Search interest is stable'}
            </p>
          </div>
        </div>
      )}

      {/* AI Generation CTA */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-accent" />
          <h4 className="text-sm font-medium text-muted uppercase tracking-wider">
            AI Generation
          </h4>
        </div>
        <button
          onClick={() => onOpenAiStudio()}
          className="w-full glass-panel glass-panel-hover rounded-xl p-4 flex items-center gap-3 group transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
            <Wand2 className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-medium group-hover:text-accent transition-colors">
              Generate AI Image
            </h5>
            <p className="text-[11px] text-muted">
              Create a historically accurate AI-generated image of this garment
            </p>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted/40 rotate-180 group-hover:text-accent transition-colors shrink-0" />
        </button>
      </div>
    </motion.div>
  );
}
