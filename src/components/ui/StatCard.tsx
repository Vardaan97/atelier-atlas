'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color?: string;
  delay?: number;
  subtitle?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-accent',
  delay = 0,
  subtitle,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn('glass-panel rounded-xl p-4 animate-fade-in-up', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-[10px] text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className={cn('text-xl font-mono font-bold', color)}>
        {value}
      </div>
      {subtitle && (
        <p className="text-[10px] text-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}
