'use client';

import { useGlobeStore } from '@/store/useGlobeStore';
import { METRICS } from '@/lib/constants';
import { useIsMobile } from '@/hooks/useIsMobile';

const CLIMATE_ZONES = [
  { label: 'Tropical', color: '#FFB800' },
  { label: 'Arid', color: '#D4A574' },
  { label: 'Temperate', color: '#00C48C' },
  { label: 'Continental', color: '#4A90D9' },
  { label: 'Polar', color: '#E8E8E8' },
];

export function ColorLegend() {
  const overlayMode = useGlobeStore((s) => s.overlayMode);
  const activeMetric = useGlobeStore((s) => s.activeMetric);
  const panelOpen = useGlobeStore((s) => s.panelOpen);
  const isMobile = useIsMobile();

  // Hide on mobile when panel is open (overlaps bottom sheet)
  if (isMobile && panelOpen) return null;

  if (overlayMode === 'metric') {
    const metricLabel = METRICS.find((m) => m.key === activeMetric)?.label || activeMetric;
    return (
      <div className="absolute bottom-4 md:bottom-14 left-4 md:left-auto md:right-4 z-20 glass-panel rounded-xl p-2 md:p-3 animate-fade-in-up">
        <p className="text-[10px] text-muted uppercase tracking-wider font-mono mb-2">{metricLabel}</p>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted">Low</span>
          <div
            className="w-24 h-2.5 rounded-full"
            style={{ background: 'linear-gradient(to right, rgb(30, 60, 160), rgb(233, 69, 96))' }}
          />
          <span className="text-[9px] text-muted">High</span>
        </div>
      </div>
    );
  }

  if (overlayMode === 'sustainability') {
    return (
      <div className="absolute bottom-4 md:bottom-14 left-4 md:left-auto md:right-4 z-20 glass-panel rounded-xl p-2 md:p-3 animate-fade-in-up">
        <p className="text-[10px] text-muted uppercase tracking-wider font-mono mb-2">Sustainability Score</p>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted">Low</span>
          <div
            className="w-24 h-2.5 rounded-full"
            style={{ background: 'linear-gradient(to right, rgb(255, 71, 87), rgb(0, 220, 160))' }}
          />
          <span className="text-[9px] text-muted">High</span>
        </div>
      </div>
    );
  }

  if (overlayMode === 'climate') {
    return (
      <div className="absolute bottom-4 md:bottom-14 left-4 md:left-auto md:right-4 z-20 glass-panel rounded-xl p-2 md:p-3 animate-fade-in-up">
        <p className="text-[10px] text-muted uppercase tracking-wider font-mono mb-2">Climate Zones</p>
        <div className="flex flex-col gap-1">
          {CLIMATE_ZONES.map((zone) => (
            <div key={zone.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: zone.color }} />
              <span className="text-[9px] text-muted">{zone.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (overlayMode === 'fashionWeek') {
    return (
      <div className="absolute bottom-4 md:bottom-14 left-4 md:left-auto md:right-4 z-20 glass-panel rounded-xl p-2 md:p-3 animate-fade-in-up">
        <p className="text-[10px] text-muted uppercase tracking-wider font-mono mb-2">Fashion Weeks</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <span className="text-[9px] text-muted">Fashion Capital</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-accent/80" />
            <span className="text-[9px] text-muted">Has Fashion Weeks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(20, 30, 60, 0.7)' }} />
            <span className="text-[9px] text-muted">No Fashion Weeks</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
