'use client';

import { useGlobeStore } from '@/store/useGlobeStore';
import { formatCurrency, formatNumber } from '@/lib/utils';

export function GlobeTooltip() {
  const tooltip = useGlobeStore((s) => s.tooltip);
  const activeMetric = useGlobeStore((s) => s.activeMetric);
  const countries = useGlobeStore((s) => s.countries);
  const panelOpen = useGlobeStore((s) => s.panelOpen);

  if (!tooltip || panelOpen) return null;

  const country = countries.find((c) => c.iso === tooltip.iso);

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

  const tierColors: Record<string, string> = {
    A: 'bg-accent text-white',
    B: 'bg-secondary text-white',
    C: 'bg-white/10 text-muted',
    skeleton: 'bg-white/5 text-muted',
  };

  return (
    <div
      className="fixed pointer-events-none z-50 animate-fade-in-up"
      style={{
        left: tooltip.x + 15,
        top: tooltip.y - 10,
      }}
    >
      <div className="glass-panel rounded-xl px-4 py-3 shadow-2xl min-w-[180px] border border-white/15">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-xl">{tooltip.flag}</span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm block truncate">{tooltip.name}</span>
            {country && (
              <span className="text-[10px] text-muted">{country.region}</span>
            )}
          </div>
          {country && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tierColors[country.tier] || tierColors.skeleton}`}>
              {country.tier === 'skeleton' ? '—' : `Tier ${country.tier}`}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-xs border-t border-white/10 pt-2">
          <div>
            <span className="text-[10px] text-muted block">{tooltip.metric}</span>
            <span className="font-mono font-semibold text-accent">{formatValue(tooltip.value)}</span>
          </div>
          {country && activeMetric !== 'fashionIndex' && (
            <div className="text-right">
              <span className="text-[10px] text-muted block">Fashion Index</span>
              <span className="font-mono font-semibold">{country.fashionIndex}</span>
            </div>
          )}
        </div>

        <p className="text-[9px] text-muted/60 mt-2 text-center">Click to explore</p>
      </div>
    </div>
  );
}
