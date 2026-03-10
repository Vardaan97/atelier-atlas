'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageResult } from '@/types/api';

interface ImageGalleryProps {
  images: ImageResult[];
  loading?: boolean;
  columns?: number;
  className?: string;
}

export function ImageGallery({
  images,
  loading,
  columns = 2,
  className,
}: ImageGalleryProps) {
  const [lightboxImage, setLightboxImage] = useState<ImageResult | null>(null);

  if (loading) {
    return (
      <div className={cn('gap-3', className)} style={{ columns }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="mb-3 break-inside-avoid rounded-lg bg-white/5 animate-pulse"
            style={{ height: `${140 + (i % 3) * 40}px` }}
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) return null;

  return (
    <>
      <div className={cn('gap-3', className)} style={{ columns }}>
        {images.map((img, i) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="mb-3 break-inside-avoid"
          >
            <button
              onClick={() => setLightboxImage(img)}
              className="w-full group relative rounded-lg overflow-hidden ring-1 ring-white/10 hover:ring-accent/40 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnailUrl || img.url}
                alt={img.alt}
                loading="lazy"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white/80 truncate">
                    {img.photographer}
                  </p>
                  <p className="text-[9px] text-white/50 capitalize">
                    {img.source}
                  </p>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-8"
            onClick={() => setLightboxImage(null)}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage.url}
              alt={lightboxImage.alt}
              className="max-w-full max-h-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel rounded-full px-4 py-2 flex items-center gap-3">
              <span className="text-xs">{lightboxImage.photographer}</span>
              <div className="w-px h-3 bg-white/20" />
              <span className="text-xs text-muted capitalize">
                {lightboxImage.source}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
