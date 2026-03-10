'use client';

import { useGlobeStore } from '@/store/useGlobeStore';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function GlobeTooltip() {
  const tooltip = useGlobeStore((s) => s.tooltip);
  const activeMetric = useGlobeStore((s) => s.activeMetric);

  if (!tooltip) return null;

  const formatValue = (value: number) => {
    switch (activeMetric) {
      case 'marketSize':
      case 'textileExports':
        return formatCurrency(value * 1e9);
      case 'population':
        return formatNumber(value);
      default:
        return value.toFixed(0);
    }
  };

  return (
    <div
      className="fixed pointer-events-none z-50 animate-fade-in-up"
      style={{
        left: tooltip.x + 15,
        top: tooltip.y - 10,
      }}
    >
      <div className="glass-panel rounded-lg px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-lg">{tooltip.flag}</span>
          <span className="font-medium text-sm">{tooltip.name}</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted">{tooltip.metric}:</span>
          <span className="text-xs font-mono font-semibold text-accent">
            {formatValue(tooltip.value)}
          </span>
        </div>
      </div>
    </div>
  );
}
