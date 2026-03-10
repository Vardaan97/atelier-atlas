'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ColorEntry } from '@/types/country';

interface ColorSwatchProps {
  color: ColorEntry;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

export function ColorSwatch({ color, size = 'md' }: ColorSwatchProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative group flex flex-col items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Swatch chip */}
      <div
        className={cn(
          sizes[size],
          'rounded-lg cursor-pointer transition-transform hover:scale-110 ring-1 ring-white/10 shadow-lg'
        )}
        style={{ backgroundColor: color.hex }}
      />

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="glass-panel rounded-lg px-3 py-2 text-center whitespace-nowrap shadow-xl">
            <p className="text-xs font-medium">{color.name}</p>
            {color.pantone && (
              <p className="text-[10px] text-muted font-mono">{color.pantone}</p>
            )}
            <p className="text-[10px] text-muted mt-0.5">{color.meaning}</p>
            <p className="text-[10px] text-accent font-mono mt-0.5">{color.hex}</p>
          </div>
        </div>
      )}

      {/* Label below */}
      <p className="text-[10px] text-muted text-center mt-1.5 truncate max-w-14">
        {color.name}
      </p>
    </div>
  );
}

interface ColorPaletteProps {
  colors: ColorEntry[];
  className?: string;
}

export function ColorPalette({ colors, className }: ColorPaletteProps) {
  if (!colors || colors.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-4', className)}>
      {colors.map((color) => (
        <ColorSwatch key={color.hex} color={color} />
      ))}
    </div>
  );
}
