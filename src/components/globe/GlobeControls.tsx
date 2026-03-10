'use client';

import { useGlobeStore } from '@/store/useGlobeStore';
import { METRICS } from '@/lib/constants';
import { countActiveFilters } from '@/lib/filters';
import { cn } from '@/lib/utils';
import {
  Activity, DollarSign, Factory, Leaf, Users,
  SlidersHorizontal, GitCompareArrows,
  BarChart3, Thermometer, Calendar,
} from 'lucide-react';
import type { MetricKey } from '@/types/country';

type OverlayMode = 'metric' | 'sustainability' | 'climate' | 'fashionWeek';

const OVERLAY_MODES: { key: OverlayMode; label: string; icon: React.ReactNode }[] = [
  { key: 'metric', label: 'Metric', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { key: 'sustainability', label: 'Sustainability', icon: <Leaf className="w-3.5 h-3.5" /> },
  { key: 'climate', label: 'Climate', icon: <Thermometer className="w-3.5 h-3.5" /> },
  { key: 'fashionWeek', label: 'Fashion Weeks', icon: <Calendar className="w-3.5 h-3.5" /> },
];

const METRIC_ICONS: Record<MetricKey, React.ReactNode> = {
  fashionIndex: <Activity className="w-3.5 h-3.5" />,
  marketSize: <DollarSign className="w-3.5 h-3.5" />,
  textileExports: <Factory className="w-3.5 h-3.5" />,
  sustainabilityScore: <Leaf className="w-3.5 h-3.5" />,
  population: <Users className="w-3.5 h-3.5" />,
};

export function GlobeControls() {
  const activeMetric = useGlobeStore((s) => s.activeMetric);
  const setActiveMetric = useGlobeStore((s) => s.setActiveMetric);
  const filterSidebarOpen = useGlobeStore((s) => s.filterSidebarOpen);
  const setFilterSidebarOpen = useGlobeStore((s) => s.setFilterSidebarOpen);
  const comparisonMode = useGlobeStore((s) => s.comparisonMode);
  const toggleComparisonMode = useGlobeStore((s) => s.toggleComparisonMode);
  const overlayMode = useGlobeStore((s) => s.overlayMode);
  const setOverlayMode = useGlobeStore((s) => s.setOverlayMode);

  const filterCount = countActiveFilters(useGlobeStore.getState());

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
      {/* Metric buttons */}
      <div className="glass-panel rounded-xl p-1.5 flex flex-col gap-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key as MetricKey)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
              activeMetric === m.key
                ? 'bg-accent/20 text-accent'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            )}
            title={m.label}
          >
            {METRIC_ICONS[m.key as MetricKey]}
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="glass-panel rounded-xl p-1.5 flex flex-col gap-1">
        {/* Filter toggle */}
        <button
          onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 relative',
            filterSidebarOpen
              ? 'bg-accent/20 text-accent'
              : 'text-muted hover:text-foreground hover:bg-white/5'
          )}
          title="Filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {filterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-[9px] font-bold flex items-center justify-center text-white">
              {filterCount}
            </span>
          )}
        </button>

        {/* Compare toggle */}
        <button
          onClick={toggleComparisonMode}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
            comparisonMode
              ? 'bg-accent/20 text-accent'
              : 'text-muted hover:text-foreground hover:bg-white/5'
          )}
          title="Compare Countries"
        >
          <GitCompareArrows className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Compare</span>
        </button>
      </div>

      {/* Overlay mode buttons */}
      <div className="glass-panel rounded-xl p-1.5 flex flex-col gap-1">
        {OVERLAY_MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setOverlayMode(mode.key)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
              overlayMode === mode.key
                ? 'bg-accent/20 text-accent'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            )}
            title={mode.label}
          >
            {mode.icon}
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
