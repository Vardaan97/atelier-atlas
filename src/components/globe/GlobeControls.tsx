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
  Menu, X, ChevronDown, Gem,
} from 'lucide-react';
import type { MetricKey } from '@/types/country';

type OverlayMode = 'metric' | 'sustainability' | 'climate' | 'fashionWeek';

const OVERLAY_MODES: { key: OverlayMode; label: string; icon: React.ReactNode }[] = [
  { key: 'metric', label: 'Metric', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'sustainability', label: 'Sustainability', icon: <Leaf className="w-4 h-4" /> },
  { key: 'climate', label: 'Climate', icon: <Thermometer className="w-4 h-4" /> },
  { key: 'fashionWeek', label: 'Fashion Weeks', icon: <Calendar className="w-4 h-4" /> },
];

const METRIC_ICONS: Record<MetricKey, React.ReactNode> = {
  fashionIndex: <Activity className="w-4 h-4" />,
  marketSize: <DollarSign className="w-4 h-4" />,
  textileExports: <Factory className="w-4 h-4" />,
  sustainabilityScore: <Leaf className="w-4 h-4" />,
  population: <Users className="w-4 h-4" />,
};

/* ── Collapsible Section ─────────────────────────────────────── */

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
      {/* Left accent strip */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[2px] transition-all duration-300',
          expanded
            ? 'bg-accent shadow-[0_0_8px_rgba(233,69,96,0.4)]'
            : 'bg-white/[0.06]'
        )}
      />

      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-white/40">
          {title}
        </span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3 h-3 text-white/30" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Shared Control Buttons (used in both desktop & mobile) ── */

function ControlPanel({ onDone }: { onDone?: () => void }) {
  const activeMetric = useGlobeStore((s) => s.activeMetric);
  const setActiveMetric = useGlobeStore((s) => s.setActiveMetric);
  const filterSidebarOpen = useGlobeStore((s) => s.filterSidebarOpen);
  const toggleFilterSidebar = useGlobeStore((s) => s.toggleFilterSidebar);
  const comparisonMode = useGlobeStore((s) => s.comparisonMode);
  const toggleComparisonMode = useGlobeStore((s) => s.toggleComparisonMode);
  const overlayMode = useGlobeStore((s) => s.overlayMode);
  const setOverlayMode = useGlobeStore((s) => s.setOverlayMode);

  const filterCount = countActiveFilters(useGlobeStore.getState());

  const [sections, setSections] = useState({
    metrics: true,
    actions: true,
    overlay: true,
  });

  const toggle = (key: keyof typeof sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="flex flex-col gap-2">
      {/* ── Data Metrics ── */}
      <Section title="Data Metrics" expanded={sections.metrics} onToggle={() => toggle('metrics')}>
        <div className="flex flex-col gap-0.5">
          {METRICS.map((m) => {
            const isActive = activeMetric === m.key && overlayMode === 'metric';
            return (
              <motion.button
                key={m.key}
                onClick={() => {
                  setActiveMetric(m.key as MetricKey);
                  onDone?.();
                }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 w-full',
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="metric-glow"
                    className="absolute inset-0 rounded-lg bg-accent/[0.08] shadow-[0_0_12px_rgba(233,69,96,0.15)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5">
                  {METRIC_ICONS[m.key as MetricKey]}
                  <span>{m.label}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </Section>

      {/* ── Actions ── */}
      <Section title="Actions" expanded={sections.actions} onToggle={() => toggle('actions')}>
        <div className="flex flex-col gap-0.5">
          {/* Filters */}
          <motion.button
            onClick={() => {
              toggleFilterSidebar();
              onDone?.();
            }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 w-full',
              filterSidebarOpen
                ? 'bg-accent/15 text-accent'
                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="flex-1 text-left">Filters</span>
            {filterCount > 0 && (
              <span className="ml-auto w-5 h-5 rounded-full bg-accent/20 border border-accent/30 text-accent text-[10px] font-bold flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </motion.button>

          {/* Compare */}
          <motion.button
            onClick={() => {
              toggleComparisonMode();
              onDone?.();
            }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 w-full',
              comparisonMode
                ? 'bg-accent/15 text-accent'
                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
            )}
          >
            <GitCompareArrows className="w-4 h-4" />
            <span>Compare</span>
          </motion.button>
        </div>
      </Section>

      {/* ── Overlay Mode ── */}
      <Section title="Overlay Mode" expanded={sections.overlay} onToggle={() => toggle('overlay')}>
        <div className="grid grid-cols-2 gap-1">
          {OVERLAY_MODES.map((mode) => {
            const isActive = overlayMode === mode.key;
            return (
              <motion.button
                key={mode.key}
                onClick={() => {
                  setOverlayMode(overlayMode === mode.key ? 'metric' : mode.key);
                  onDone?.();
                }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'relative flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'bg-accent/15 text-accent border border-accent/20 shadow-[0_0_10px_rgba(233,69,96,0.12)]'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04] border border-transparent'
                )}
              >
                {mode.icon}
                <span className="truncate">{mode.label}</span>
              </motion.button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

/* ── Main Export ──────────────────────────────────────────────── */

export function GlobeControls() {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const panelOpen = useGlobeStore((s) => s.panelOpen);

  if (isMobile) {
    return (
      <>
        {/* Floating menu button — hide when country panel is open */}
        {!panelOpen && (
          <motion.button
            onClick={() => setMobileOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 left-4 z-20 w-14 h-14 rounded-full flex items-center justify-center safe-area-bottom
              bg-[#0A0A1A]/80 backdrop-blur-xl border border-white/10 shadow-lg shadow-accent/10"
          >
            <div className="absolute inset-0 rounded-full bg-accent/5 blur-sm" />
            <Menu className="w-5 h-5 text-accent relative z-10" />
          </motion.button>
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
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />

              {/* Content */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-h-[75vh] bg-[#0A0A1A]/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl overflow-y-auto p-4 pb-8"
              >
                {/* Drag handle */}
                <div className="flex justify-center mb-3">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Close button */}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute top-3 right-3 p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>

                <h3 className="text-sm font-heading font-bold mb-4 text-white/90 tracking-wide">
                  Controls
                </h3>

                <ControlPanel onDone={() => setMobileOpen(false)} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: left-side floating panel
  return (
    <div className="absolute top-16 left-4 z-20 w-52">
      <ControlPanel />
    </div>
  );
}
