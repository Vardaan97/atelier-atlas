'use client';

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Leaf,
  MapPin,
  Palette,
  Scissors,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Thermometer,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { REGIONS } from '@/lib/constants';
import {
  CLIMATE_ZONES,
  countActiveFilters,
  FABRIC_OPTIONS,
  FASHION_WEEK_CITIES,
  TIER_OPTIONS,
} from '@/lib/filters';
import { useGlobeStore } from '@/store/useGlobeStore';

/* ------------------------------------------------------------------ */
/*  Collapsible section wrapper                                       */
/* ------------------------------------------------------------------ */

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, icon, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2 px-4 py-3 text-left',
          'text-xs font-mono uppercase tracking-wider text-muted',
          'hover:bg-white/[0.03] transition-colors'
        )}
      >
        {icon}
        <span className="flex-1">{title}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Range slider (dual-thumb via two native inputs)                   */
/* ------------------------------------------------------------------ */

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatLabel?: (v: number) => string;
}

function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  formatLabel = String,
}: RangeSliderProps) {
  const leftPercent = ((value[0] - min) / (max - min)) * 100;
  const rightPercent = ((value[1] - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono text-muted">
        <span>{formatLabel(value[0])}</span>
        <span>{formatLabel(value[1])}</span>
      </div>
      <div className="relative h-5">
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 h-1 w-full rounded-full bg-white/10" />
        {/* Active range */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-accent/60"
          style={{
            left: `${leftPercent}%`,
            width: `${rightPercent - leftPercent}%`,
          }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= value[1]) onChange([v, value[1]]);
          }}
          className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/20 [&::-moz-range-thumb]:cursor-pointer"
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= value[0]) onChange([value[0], v]);
          }}
          className="range-thumb absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/20 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/20 [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chip (multi-select toggle)                                        */
/* ------------------------------------------------------------------ */

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono',
        'border transition-all duration-150 cursor-pointer',
        active
          ? 'bg-accent/20 border-accent/50 text-accent'
          : 'bg-white/[0.03] border-white/10 text-muted hover:border-white/20 hover:bg-white/[0.06]'
      )}
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Checkbox                                                          */
/* ------------------------------------------------------------------ */

interface CheckboxItemProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CheckboxItem({ label, checked, onChange }: CheckboxItemProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        className={cn(
          'h-3.5 w-3.5 rounded-[3px] border flex items-center justify-center transition-all',
          checked
            ? 'bg-accent/80 border-accent'
            : 'bg-white/5 border-white/20 group-hover:border-white/30'
        )}
      >
        {checked && (
          <svg
            className="h-2.5 w-2.5 text-white"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-xs text-foreground/80 group-hover:text-foreground transition-colors">
        {label}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Radio button                                                      */
/* ------------------------------------------------------------------ */

interface RadioItemProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function RadioItem({ label, selected, onSelect }: RadioItemProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        className={cn(
          'h-3.5 w-3.5 rounded-full border flex items-center justify-center transition-all',
          selected
            ? 'border-accent'
            : 'border-white/20 group-hover:border-white/30'
        )}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-accent" />}
      </div>
      <input
        type="radio"
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="text-xs text-foreground/80 group-hover:text-foreground transition-colors">
        {label}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Toggle switch                                                     */
/* ------------------------------------------------------------------ */

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-xs text-foreground/80 group-hover:text-foreground transition-colors">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-accent/70' : 'bg-white/10'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </button>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Color picker (simplified hex input + swatch)                      */
/* ------------------------------------------------------------------ */

interface ColorPickerProps {
  value: string | null;
  onChange: (hex: string | null) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value ?? '#E94560'}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 rounded-md cursor-pointer border border-white/10 bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
        />
      </div>
      <input
        type="text"
        placeholder="#E94560"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') {
            onChange(null);
          } else {
            onChange(v);
          }
        }}
        className={cn(
          'flex-1 h-8 px-2 rounded-md text-xs font-mono bg-white/5 border border-white/10',
          'text-foreground placeholder:text-muted/50',
          'focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20',
          'transition-colors'
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: toggle item in array                                      */
/* ------------------------------------------------------------------ */

function toggleArrayItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

/* ------------------------------------------------------------------ */
/*  Sidebar animation variants                                        */
/* ------------------------------------------------------------------ */

const sidebarVariants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, damping: 28, stiffness: 300 },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/* ------------------------------------------------------------------ */
/*  FilterSidebar                                                     */
/* ------------------------------------------------------------------ */

export function FilterSidebar() {
  const {
    filterSidebarOpen,
    setFilterSidebarOpen,
    countries,
    regionFilter,
    tierFilter,
    fashionIndexRange,
    marketSizeRange,
    sustainabilityRange,
    fabricFilter,
    fashionWeekFilter,
    climateFilter,
    textileHeritage,
    colorFilter,
    setFilters,
    clearFilters,
    getFilteredCountries,
  } = useGlobeStore();

  const activeCount = useMemo(
    () =>
      countActiveFilters({
        regionFilter,
        tierFilter,
        fashionIndexRange,
        marketSizeRange,
        sustainabilityRange,
        fabricFilter,
        fashionWeekFilter,
        climateFilter,
        textileHeritage,
        colorFilter,
      }),
    [
      regionFilter,
      tierFilter,
      fashionIndexRange,
      marketSizeRange,
      sustainabilityRange,
      fabricFilter,
      fashionWeekFilter,
      climateFilter,
      textileHeritage,
      colorFilter,
    ]
  );

  const filteredCount = useMemo(() => {
    if (activeCount === 0) return countries.length;
    return getFilteredCountries().length;
  }, [activeCount, countries.length, getFilteredCountries]);

  const handleApply = useCallback(() => {
    setFilterSidebarOpen(false);
  }, [setFilterSidebarOpen]);

  const handleClear = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  return (
    <AnimatePresence>
      {filterSidebarOpen && (
        <>
          {/* Mobile overlay backdrop */}
          <motion.div
            key="filter-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setFilterSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />

          {/* Sidebar panel */}
          <motion.aside
            key="filter-sidebar"
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'fixed top-0 left-0 z-50 h-full flex flex-col',
              'w-full md:w-80 lg:w-[340px]',
              'bg-[#0A0A1A]/95 backdrop-blur-xl',
              'border-r border-white/10',
              'shadow-2xl shadow-black/50'
            )}
          >
            {/* ---- Header ---- */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-mono font-semibold tracking-wider uppercase text-foreground">
                  Filters
                </h2>
                {activeCount > 0 && (
                  <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-accent text-[10px] font-mono font-bold text-white">
                    {activeCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[10px] font-mono uppercase tracking-wider text-accent hover:text-accent-hover transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFilterSidebarOpen(false)}
                  className="p-1 rounded-md hover:bg-white/10 transition-colors text-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ---- Scrollable filter sections ---- */}
            <div className="flex-1 overflow-y-auto">
              {/* 1. Region */}
              <Section
                title="Region"
                icon={<MapPin className="h-3.5 w-3.5 text-accent" />}
                defaultOpen
              >
                <RadioItem
                  label="All Regions"
                  selected={regionFilter === null}
                  onSelect={() => setFilters({ regionFilter: null })}
                />
                {REGIONS.map((region) => (
                  <RadioItem
                    key={region}
                    label={region}
                    selected={regionFilter === region}
                    onSelect={() => setFilters({ regionFilter: region })}
                  />
                ))}
              </Section>

              {/* 2. Tier */}
              <Section
                title="Tier"
                icon={<Sparkles className="h-3.5 w-3.5 text-accent" />}
              >
                {TIER_OPTIONS.map((tier) => (
                  <CheckboxItem
                    key={tier}
                    label={tier === 'skeleton' ? 'Unrated' : `Tier ${tier}`}
                    checked={tierFilter.includes(tier)}
                    onChange={() =>
                      setFilters({
                        tierFilter: toggleArrayItem(tierFilter, tier),
                      })
                    }
                  />
                ))}
              </Section>

              {/* 3. Fashion Index */}
              <Section
                title="Fashion Index"
                icon={
                  <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
                }
              >
                <RangeSlider
                  min={0}
                  max={100}
                  value={fashionIndexRange}
                  onChange={(v) => setFilters({ fashionIndexRange: v })}
                />
              </Section>

              {/* 4. Market Size */}
              <Section
                title="Market Size (USD B)"
                icon={
                  <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
                }
              >
                <RangeSlider
                  min={0}
                  max={400}
                  step={5}
                  value={marketSizeRange}
                  onChange={(v) => setFilters({ marketSizeRange: v })}
                  formatLabel={(v) => `$${v}B`}
                />
              </Section>

              {/* 5. Sustainability */}
              <Section
                title="Sustainability Score"
                icon={<Leaf className="h-3.5 w-3.5 text-accent" />}
              >
                <RangeSlider
                  min={0}
                  max={100}
                  value={sustainabilityRange}
                  onChange={(v) => setFilters({ sustainabilityRange: v })}
                />
              </Section>

              {/* 6. Primary Fabrics */}
              <Section
                title="Primary Fabrics"
                icon={<Scissors className="h-3.5 w-3.5 text-accent" />}
              >
                <div className="flex flex-wrap gap-1.5">
                  {FABRIC_OPTIONS.map((fabric) => (
                    <Chip
                      key={fabric}
                      label={fabric}
                      active={fabricFilter.includes(fabric)}
                      onClick={() =>
                        setFilters({
                          fabricFilter: toggleArrayItem(fabricFilter, fabric),
                        })
                      }
                    />
                  ))}
                </div>
              </Section>

              {/* 7. Fashion Week Cities */}
              <Section
                title="Fashion Week Cities"
                icon={<Shirt className="h-3.5 w-3.5 text-accent" />}
              >
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {FASHION_WEEK_CITIES.map((city) => (
                    <CheckboxItem
                      key={city}
                      label={city}
                      checked={fashionWeekFilter.includes(city)}
                      onChange={() =>
                        setFilters({
                          fashionWeekFilter: toggleArrayItem(
                            fashionWeekFilter,
                            city
                          ),
                        })
                      }
                    />
                  ))}
                </div>
              </Section>

              {/* 8. Climate Zone */}
              <Section
                title="Climate Zone"
                icon={<Thermometer className="h-3.5 w-3.5 text-accent" />}
              >
                {CLIMATE_ZONES.map((zone) => (
                  <CheckboxItem
                    key={zone}
                    label={zone}
                    checked={climateFilter.includes(zone)}
                    onChange={() =>
                      setFilters({
                        climateFilter: toggleArrayItem(climateFilter, zone),
                      })
                    }
                  />
                ))}
              </Section>

              {/* 9. Textile Heritage */}
              <Section
                title="Textile Heritage"
                icon={<Sun className="h-3.5 w-3.5 text-accent" />}
              >
                <ToggleSwitch
                  label="Only notable textile heritage"
                  checked={textileHeritage}
                  onChange={(v) => setFilters({ textileHeritage: v })}
                />
                <p className="text-[10px] text-muted leading-relaxed">
                  Show only countries with documented traditional garments or
                  notable fabric traditions.
                </p>
              </Section>

              {/* 10. Color Dominant */}
              <Section
                title="Dominant Color"
                icon={<Palette className="h-3.5 w-3.5 text-accent" />}
              >
                <ColorPicker
                  value={colorFilter}
                  onChange={(hex) => setFilters({ colorFilter: hex })}
                />
                <p className="text-[10px] text-muted leading-relaxed">
                  Filter countries whose palette contains a similar color.
                </p>
              </Section>
            </div>

            {/* ---- Sticky footer ---- */}
            <div className="border-t border-white/10 px-4 py-3 space-y-2 bg-[#0A0A1A]/95 backdrop-blur-xl">
              <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                <span>
                  {filteredCount} of {countries.length} countries
                </span>
                {activeCount > 0 && (
                  <span className="text-accent">
                    {activeCount} filter{activeCount !== 1 ? 's' : ''} active
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleApply}
                className={cn(
                  'w-full py-2.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider',
                  'transition-all duration-200',
                  activeCount > 0
                    ? 'bg-accent hover:bg-accent-hover text-white glow-accent'
                    : 'bg-white/10 hover:bg-white/15 text-foreground'
                )}
              >
                Apply Filters
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
