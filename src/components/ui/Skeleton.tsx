'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-white/5', className)} />
  );
}

export function ImageSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-white/5', className)}>
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-4 space-y-3">
      <ImageSkeleton className="w-full h-40" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-7 w-24" />
    </div>
  );
}

export function SwatchSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="w-14 h-14 rounded-lg" />
          <Skeleton className="h-2 w-10 mx-auto" />
        </div>
      ))}
    </div>
  );
}
