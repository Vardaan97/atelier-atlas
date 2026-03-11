'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart as RechartsRadar,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Loader2,
  Crown,
  Sparkles,
} from 'lucide-react';
import { useGlobeStore } from '@/store/useGlobeStore';
import { useComparisonProfiles } from '@/hooks/useComparisonProfiles';
import { FASHION_DNA_AXES } from '@/lib/constants';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import type { CountryBase, FashionDNA } from '@/types/country';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPARISON_COLORS = ['#E94560', '#00C48C', '#FFB800'] as const;

const RADAR_AXIS_LABELS: Record<string, string> = {
  traditionalism: 'Tradition',
  innovation: 'Innovation',
  sustainability: 'Sustain.',
  luxuryIndex: 'Luxury',
  streetwearInfluence: 'Street',
  craftsmanship: 'Craft',
  globalInfluence: 'Global',
};

const TIER_COLORS: Record<string, string> = {
  A: 'bg-accent/20 text-accent border-accent/30',
  B: 'bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30',
  C: 'bg-[#00C48C]/20 text-[#00C48C] border-[#00C48C]/30',
  skeleton: 'bg-white/10 text-muted border-white/10',
};

const STAT_ROWS = [
  {
    label: 'Fashion Index',
    key: 'fashionIndex' as const,
    format: (v: number) => v.toString(),
    higherIsBetter: true,
  },
  {
    label: 'Market Size',
    key: 'marketSize' as const,
    format: (v: number) => formatCurrency(v * 1e9),
    higherIsBetter: true,
  },
  {
    label: 'Sustainability',
    key: 'sustainabilityScore' as const,
    format: (v: number) => `${v}%`,
    higherIsBetter: true,
  },
  {
    label: 'Textile Exports',
    key: 'textileExports' as const,
    format: (v: number) => formatCurrency(v * 1e9),
    higherIsBetter: true,
  },
  {
    label: 'Population',
    key: 'population' as const,
    format: (v: number) => formatNumber(v),
    higherIsBetter: false,
  },
] as const;

// ---------------------------------------------------------------------------
// Section Component (collapsible)
// ---------------------------------------------------------------------------

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <span className="text-xs font-mono uppercase tracking-widest text-muted">
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Country Search Dropdown
// ---------------------------------------------------------------------------

function CountrySearchDropdown({
  onSelect,
  excludeIsos,
}: {
  onSelect: (iso: string) => void;
  excludeIsos: string[];
}) {
  const countries = useGlobeStore((s) => s.countries);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const available = countries.filter((c) => !excludeIsos.includes(c.iso));
    if (!query.trim()) return available.slice(0, 20);
    const q = query.toLowerCase();
    return available
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.iso.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [countries, excludeIsos, query]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm',
          'border-white/10 hover:border-accent/50 hover:bg-white/5 text-muted hover:text-foreground'
        )}
      >
        <Plus className="w-4 h-4" />
        <span>Add Country</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 w-72 rounded-xl border border-white/10 bg-[#0F1629] shadow-2xl overflow-hidden z-50"
          >
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <Search className="w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search countries..."
                  autoFocus
                  className="bg-transparent text-sm text-foreground placeholder:text-muted outline-none flex-1"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted">
                  No countries found
                </div>
              )}
              {filtered.map((c) => (
                <button
                  key={c.iso}
                  onClick={() => {
                    onSelect(c.iso);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <span className="text-lg">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-[10px] text-muted">{c.region}</div>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border font-mono',
                      TIER_COLORS[c.tier]
                    )}
                  >
                    {c.tier.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overlaid Radar Chart (all countries on same axes)
// ---------------------------------------------------------------------------

function OverlaidRadarChart({
  entries,
}: {
  entries: { name: string; dna: FashionDNA; color: string }[];
}) {
  const data = FASHION_DNA_AXES.map((axis) => {
    const point: Record<string, string | number> = {
      axis: RADAR_AXIS_LABELS[axis] || axis,
    };
    entries.forEach((entry) => {
      point[entry.name] = entry.dna[axis as keyof FashionDNA];
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RechartsRadar data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: '#8B8FA3', fontSize: 11 }}
        />
        {entries.map((entry) => (
          <Radar
            key={entry.name}
            name={entry.name}
            dataKey={entry.name}
            stroke={entry.color}
            fill={entry.color}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#8B8FA3' }}
          iconType="circle"
          iconSize={8}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Main ComparisonView
// ---------------------------------------------------------------------------

export function ComparisonView() {
  const comparisonMode = useGlobeStore((s) => s.comparisonMode);
  const comparedCountries = useGlobeStore((s) => s.comparedCountries);
  const countries = useGlobeStore((s) => s.countries);
  const toggleComparisonMode = useGlobeStore((s) => s.toggleComparisonMode);
  const addComparisonCountry = useGlobeStore((s) => s.addComparisonCountry);
  const removeComparisonCountry = useGlobeStore(
    (s) => s.removeComparisonCountry
  );

  const { profiles, loading } = useComparisonProfiles(comparedCountries);

  // Resolve full CountryBase for each compared ISO
  const comparedData = useMemo(() => {
    return comparedCountries
      .map((iso) => countries.find((c) => c.iso === iso))
      .filter(Boolean) as CountryBase[];
  }, [comparedCountries, countries]);

  const handleAddCountry = useCallback(
    (iso: string) => {
      addComparisonCountry(iso);
    },
    [addComparisonCountry]
  );

  // Helper: find winner index for a stat (highest value)
  const winnerIndex = useCallback(
    (key: keyof CountryBase) => {
      if (comparedData.length < 2) return -1;
      let maxIdx = 0;
      let maxVal = -Infinity;
      comparedData.forEach((c, i) => {
        const val = c[key] as number;
        if (val > maxVal) {
          maxVal = val;
          maxIdx = i;
        }
      });
      return maxIdx;
    },
    [comparedData]
  );

  // Radar chart entries
  const radarEntries = useMemo(() => {
    return comparedData
      .map((c, i) => {
        const profile = profiles.get(c.iso);
        if (!profile?.fashionDNA) return null;
        return {
          name: c.name,
          dna: profile.fashionDNA,
          color: COMPARISON_COLORS[i],
        };
      })
      .filter(Boolean) as { name: string; dna: FashionDNA; color: string }[];
  }, [comparedData, profiles]);

  if (!comparisonMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[#0A0A1A]/80 backdrop-blur-xl"
          onClick={toggleComparisonMode}
        />

        {/* Panel */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300, delay: 0.05 }}
          className="relative z-10 w-full max-w-5xl mx-2 md:mx-4 my-4 md:my-8 rounded-2xl border border-white/10 bg-[#0A0A1A]/95 backdrop-blur-xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ---- Header ---- */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-heading font-bold tracking-tight">
                Compare Countries
              </h2>
              <span className="text-xs text-muted font-mono">
                {comparedData.length}/3
              </span>
            </div>
            <button
              onClick={toggleComparisonMode}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close comparison"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          {/* ---- Empty State ---- */}
          {comparedData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-muted" />
              </div>
              <p className="text-muted text-sm text-center max-w-sm">
                Click countries on the globe or use the search below to add up
                to 3 countries for comparison.
              </p>
              <CountrySearchDropdown
                onSelect={handleAddCountry}
                excludeIsos={comparedCountries}
              />
            </div>
          )}

          {comparedData.length > 0 && (
            <>
              {/* ---- Column Headers ---- */}
              <div className="grid px-6 pt-5 pb-3 gap-4" style={{ gridTemplateColumns: `repeat(${comparedData.length}, 1fr)` }}>
                {comparedData.map((c, i) => (
                  <motion.div
                    key={c.iso}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex flex-col items-center gap-2 relative group"
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => removeComparisonCountry(c.iso)}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                      aria-label={`Remove ${c.name}`}
                    >
                      <X className="w-3 h-3 text-muted" />
                    </button>

                    <span className="text-4xl">{c.flag}</span>
                    <div className="text-center">
                      <h3
                        className="font-heading font-bold text-base"
                        style={{ color: COMPARISON_COLORS[i] }}
                      >
                        {c.name}
                      </h3>
                      <span
                        className={cn(
                          'inline-block mt-1 text-[10px] px-2 py-0.5 rounded border font-mono',
                          TIER_COLORS[c.tier]
                        )}
                      >
                        TIER {c.tier.toUpperCase()}
                      </span>
                    </div>

                    {/* Color bar indicator */}
                    <div
                      className="w-full h-0.5 rounded-full mt-1"
                      style={{ backgroundColor: COMPARISON_COLORS[i] }}
                    />

                    {/* Loading indicator */}
                    {loading.has(c.iso) && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Loader2 className="w-3 h-3 text-accent animate-spin" />
                        <span className="text-[10px] text-muted font-mono">
                          LOADING PROFILE
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* ---- Sections ---- */}

              {/* 1. Fashion DNA */}
              {radarEntries.length >= 2 && (
                <Section title="Fashion DNA">
                  <OverlaidRadarChart entries={radarEntries} />
                </Section>
              )}
              {radarEntries.length === 1 && (
                <Section title="Fashion DNA">
                  <p className="text-xs text-muted text-center py-4">
                    Waiting for profiles to load to overlay radar charts...
                  </p>
                </Section>
              )}

              {/* 2. Key Stats */}
              <Section title="Key Stats">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left text-[10px] text-muted font-mono uppercase tracking-wider py-2 pr-4">
                          Metric
                        </th>
                        {comparedData.map((c, i) => (
                          <th
                            key={c.iso}
                            className="text-center text-[10px] font-mono uppercase tracking-wider py-2 px-2"
                            style={{ color: COMPARISON_COLORS[i] }}
                          >
                            {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {STAT_ROWS.map((row) => {
                        const winner = row.higherIsBetter
                          ? winnerIndex(row.key)
                          : -1;
                        return (
                          <tr
                            key={row.key}
                            className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-2.5 pr-4 text-xs text-muted">
                              {row.label}
                            </td>
                            {comparedData.map((c, i) => {
                              const val = c[row.key] as number;
                              const isWinner = winner === i;
                              return (
                                <td
                                  key={c.iso}
                                  className={cn(
                                    'py-2.5 px-2 text-center font-mono text-sm',
                                    isWinner
                                      ? 'text-accent font-bold'
                                      : 'text-foreground'
                                  )}
                                >
                                  <div className="flex items-center justify-center gap-1.5">
                                    {row.format(val)}
                                    {isWinner && (
                                      <Crown className="w-3 h-3 text-accent" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* 3. Traditional Garments */}
              <Section title="Traditional Garments" defaultOpen={false}>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${comparedData.length}, 1fr)`,
                  }}
                >
                  {comparedData.map((c, i) => (
                    <div key={c.iso}>
                      <h4
                        className="text-xs font-mono uppercase tracking-wider mb-2"
                        style={{ color: COMPARISON_COLORS[i] }}
                      >
                        {c.name}
                      </h4>
                      <div className="space-y-2">
                        {c.traditionalGarments.slice(0, 3).map((g) => (
                          <div
                            key={g.name}
                            className="rounded-lg bg-white/[0.03] p-3"
                          >
                            <div className="text-sm font-medium">{g.name}</div>
                            <div className="text-[11px] text-muted mt-0.5 line-clamp-2">
                              {g.description}
                            </div>
                            <div className="text-[10px] text-muted mt-1 font-mono">
                              {g.era}
                            </div>
                          </div>
                        ))}
                        {c.traditionalGarments.length === 0 && (
                          <p className="text-xs text-muted italic">
                            No garment data
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 4. Primary Fabrics */}
              <Section title="Primary Fabrics" defaultOpen={false}>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${comparedData.length}, 1fr)`,
                  }}
                >
                  {comparedData.map((c, i) => (
                    <div key={c.iso}>
                      <h4
                        className="text-xs font-mono uppercase tracking-wider mb-2"
                        style={{ color: COMPARISON_COLORS[i] }}
                      >
                        {c.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {c.primaryFabrics.map((fabric) => (
                          <span
                            key={fabric}
                            className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5"
                          >
                            {fabric}
                          </span>
                        ))}
                        {c.primaryFabrics.length === 0 && (
                          <p className="text-xs text-muted italic">
                            No fabric data
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 5. Color Palette */}
              <Section title="Color Palette" defaultOpen={false}>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${comparedData.length}, 1fr)`,
                  }}
                >
                  {comparedData.map((c, i) => (
                    <div key={c.iso}>
                      <h4
                        className="text-xs font-mono uppercase tracking-wider mb-2"
                        style={{ color: COMPARISON_COLORS[i] }}
                      >
                        {c.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {c.colorPalette.map((color) => (
                          <div
                            key={color.hex}
                            className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5"
                          >
                            <div
                              className="w-5 h-5 rounded-full border border-white/10 shrink-0"
                              style={{ backgroundColor: color.hex }}
                            />
                            <div>
                              <div className="text-xs font-medium leading-tight">
                                {color.name}
                              </div>
                              <div className="text-[10px] text-muted font-mono">
                                {color.hex}
                              </div>
                            </div>
                          </div>
                        ))}
                        {c.colorPalette.length === 0 && (
                          <p className="text-xs text-muted italic">
                            No color data
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 6. Designers */}
              <Section title="Key Designers" defaultOpen={false}>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${comparedData.length}, 1fr)`,
                  }}
                >
                  {comparedData.map((c, i) => (
                    <div key={c.iso}>
                      <h4
                        className="text-xs font-mono uppercase tracking-wider mb-2"
                        style={{ color: COMPARISON_COLORS[i] }}
                      >
                        {c.name}
                      </h4>
                      <div className="space-y-2">
                        {c.keyDesigners.map((d) => (
                          <div
                            key={d.name}
                            className="rounded-lg bg-white/[0.03] p-3"
                          >
                            <div className="text-sm font-medium">{d.name}</div>
                            {d.brand && (
                              <div className="text-[11px] text-muted mt-0.5">
                                {d.brand}
                              </div>
                            )}
                            <div className="text-[10px] text-muted font-mono mt-0.5">
                              {d.era} &middot; {d.specialty}
                            </div>
                          </div>
                        ))}
                        {c.keyDesigners.length === 0 && (
                          <p className="text-xs text-muted italic">
                            No designer data
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* ---- Footer ---- */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              {comparedData.length > 0 && comparedData.length < 3 && (
                <CountrySearchDropdown
                  onSelect={handleAddCountry}
                  excludeIsos={comparedCountries}
                />
              )}
              {comparedData.length >= 3 && (
                <span className="text-xs text-muted font-mono">
                  MAX 3 COUNTRIES
                </span>
              )}
            </div>

            <button
              onClick={toggleComparisonMode}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-muted hover:text-foreground transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
