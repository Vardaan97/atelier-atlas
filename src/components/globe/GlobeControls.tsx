'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobeStore } from '@/store/useGlobeStore';
import { METRICS } from '@/lib/constants';
import { countActiveFilters } from '@/lib/filters';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  Activity, DollarSign, Factory, Leaf, Users,
  SlidersHorizontal, GitCompareArrows,
  BarChart3, Thermometer, Calendar,
  Menu, X,
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

/** Shared control buttons used in both desktop and mobile layouts. */
function ControlButtons({ onDone }: { onDone?: () => void }) {
  const activeMetric = useGlobeStore((s) => s.activeMetric);
  const setActiveMetric = useGlobeStore((s) => s.setActiveMetric);
  const filterSidebarOpen = useGlobeStore((s) => s.filterSidebarOpen);
  const toggleFilterSidebar = useGlobeStore((s) => s.toggleFilterSidebar);
  const comparisonMode = useGlobeStore((s) => s.comparisonMode);
  const toggleComparisonMode = useGlobeStore((s) => s.toggleComparisonMode);
  const overlayMode = useGlobeStore((s) => s.overlayMode);
  const setOverlayMode = useGlobeStore((s) => s.setOverlayMode);

  const filterCount = countActiveFilters(useGlobeStore.getState());

  const handleMetricClick = (key: MetricKey) => {
    setActiveMetric(key);
    onDone?.();
  };

  const handleOverlayClick = (key: OverlayMode) => {
    // Toggle off: clicking active overlay resets to 'metric'
    setOverlayMode(overlayMode === key ? 'metric' : key);
    onDone?.();
  };

  const handleFilterToggle = () => {
    toggleFilterSidebar();
    onDone?.();
  };

  return (
    <>
      {/* Metrics */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted uppercase tracking-wider font-mono mb-1.5 md:hidden">Metrics</p>
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => handleMetricClick(m.key as MetricKey)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 md:py-1.5 rounded-lg text-xs transition-all duration-200 w-full min-h-[44px] md:min-h-0',
              activeMetric === m.key
                ? 'bg-accent/20 text-accent'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            )}
            title={m.label}
          >
            {METRIC_ICONS[m.key as MetricKey]}
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted uppercase tracking-wider font-mono mb-1.5 md:hidden">Actions</p>
        <button
          onClick={handleFilterToggle}
          className={cn(
            'flex items-center gap-2 px-3 py-2 md:py-1.5 rounded-lg text-xs transition-all duration-200 relative w-full min-h-[44px] md:min-h-0',
            filterSidebarOpen
              ? 'bg-accent/20 text-accent'
              : 'text-muted hover:text-foreground hover:bg-white/5'
          )}
          title="Filters"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {filterCount > 0 && (
            <span className="ml-auto w-4 h-4 rounded-full bg-accent text-[9px] font-bold flex items-center justify-center text-white">
              {filterCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            toggleComparisonMode();
            onDone?.();
          }}
          className={cn(
            'flex items-center gap-2 px-3 py-2 md:py-1.5 rounded-lg text-xs transition-all duration-200 w-full min-h-[44px] md:min-h-0',
            comparisonMode
              ? 'bg-accent/20 text-accent'
              : 'text-muted hover:text-foreground hover:bg-white/5'
          )}
          title="Compare Countries"
        >
          <GitCompareArrows className="w-3.5 h-3.5" />
          <span>Compare</span>
        </button>
      </div>

      {/* Overlay modes */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted uppercase tracking-wider font-mono mb-1.5 md:hidden">Overlays</p>
        {OVERLAY_MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => handleOverlayClick(mode.key)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 md:py-1.5 rounded-lg text-xs transition-all duration-200 w-full min-h-[44px] md:min-h-0',
              overlayMode === mode.key
                ? 'bg-accent/20 text-accent'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            )}
            title={mode.label}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export function GlobeControls() {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelOpen = useGlobeStore((s) => s.panelOpen);

  if (isMobile) {
    return (
      <>
        {/* Floating menu button — hide when country panel is open */}
        {!panelOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className="fixed bottom-6 left-4 z-20 w-12 h-12 rounded-full glass-panel flex items-center justify-center glow-accent safe-area-bottom"
            style={{ minWidth: 48, minHeight: 48 }}
          >
            <Menu className="w-5 h-5 text-accent" />
          </button>
        )}

        {/* Mobile controls overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 flex items-end justify-center"
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => setMobileOpen(false)}
              />

              {/* Content */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-h-[70vh] glass-panel border-t border-white/10 rounded-t-2xl overflow-y-auto p-4 pb-8"
              >
                {/* Drag handle */}
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Close button */}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute top-3 right-3 p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>

                <h3 className="text-sm font-heading font-bold mb-4 text-foreground">Controls</h3>

                <div className="grid grid-cols-1 gap-4">
                  <ControlButtons onDone={() => setMobileOpen(false)} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop layout (unchanged from original — 3 separate glass panels)
  return (
    <DesktopControls />
  );
}

/** Desktop: preserves original 3-panel layout. */
function DesktopControls() {
  const activeMetric = useGlobeStore((s) => s.activeMetric);
  const setActiveMetric = useGlobeStore((s) => s.setActiveMetric);
  const filterSidebarOpen = useGlobeStore((s) => s.filterSidebarOpen);
  const toggleFilterSidebar = useGlobeStore((s) => s.toggleFilterSidebar);
  const comparisonMode = useGlobeStore((s) => s.comparisonMode);
  const toggleComparisonMode = useGlobeStore((s) => s.toggleComparisonMode);
  const overlayMode = useGlobeStore((s) => s.overlayMode);
  const setOverlayMode = useGlobeStore((s) => s.setOverlayMode);

  const filterCount = countActiveFilters(useGlobeStore.getState());

  const handleFilterToggle = () => {
    toggleFilterSidebar();
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
      {/* Metric buttons */}
      <div className="glass-panel rounded-xl p-1.5 flex flex-col gap-1">
        <p className="text-[9px] text-muted/60 uppercase tracking-wider font-mono px-3 pt-1">Data Metrics</p>
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key as MetricKey)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
              activeMetric === m.key && overlayMode === 'metric'
                ? 'bg-accent/20 text-accent glow-accent'
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
          onClick={handleFilterToggle}
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
        <p className="text-[9px] text-muted/60 uppercase tracking-wider font-mono px-3 pt-1">Overlay Mode</p>
        {OVERLAY_MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setOverlayMode(overlayMode === mode.key ? 'metric' : mode.key)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
              overlayMode === mode.key
                ? 'bg-accent/20 text-accent glow-accent'
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
