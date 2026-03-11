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
  Link2,
} from 'lucide-react';
import { useGlobeStore } from '@/store/useGlobeStore';
import { useComparisonProfiles } from '@/hooks/useComparisonProfiles';
import { useWorldBankComparison } from '@/hooks/useWorldBankComparison';
import { FASHION_DNA_AXES } from '@/lib/constants';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import {
  getCountryPairSimilarity,
  getCharacteristics,
  type DimensionBreakdown,
} from '@/lib/fashionSimilarity';
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
// Fashion Culture Similarity Section
// ---------------------------------------------------------------------------

const DIMENSION_LABELS: Record<keyof DimensionBreakdown, string> = {
  silhouette: 'Silhouette',
  colorPalette: 'Color Palette',
  materials: 'Materials',
  techniques: 'Techniques',
  aesthetic: 'Aesthetic',
  embellishment: 'Embellishment',
  modesty: 'Modesty',
  region: 'Region',
  climate: 'Climate',
  culturalInfluence: 'Cultural',
};

function FashionSimilaritySection({
  countries,
}: {
  countries: CountryBase[];
}) {
  // For 2 countries, show a single pair. For 3, show all 3 pairs.
  const pairs = useMemo(() => {
    const result: Array<{
      a: CountryBase;
      b: CountryBase;
      similarity: NonNullable<ReturnType<typeof getCountryPairSimilarity>>;
    }> = [];

    for (let i = 0; i < countries.length; i++) {
      for (let j = i + 1; j < countries.length; j++) {
        const sim = getCountryPairSimilarity(countries[i].iso, countries[j].iso);
        if (sim) {
          result.push({ a: countries[i], b: countries[j], similarity: sim });
        }
      }
    }
    return result;
  }, [countries]);

  if (pairs.length === 0) return null;

  return (
    <Section title="Fashion Culture Similarity" defaultOpen={true}>
      <div className="space-y-5">
        {pairs.map(({ a, b, similarity }) => (
          <div key={`${a.iso}-${b.iso}`} className="space-y-3">
            {/* Header with score */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg">{a.flag}</span>
                <span className="text-xs font-medium truncate">{a.name}</span>
                <Link2 className="w-3 h-3 text-muted shrink-0" />
                <span className="text-lg">{b.flag}</span>
                <span className="text-xs font-medium truncate">{b.name}</span>
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                <span
                  className={cn(
                    'text-lg font-mono font-bold',
                    similarity.score >= 60
                      ? 'text-accent'
                      : similarity.score >= 40
                        ? 'text-[#FFB800]'
                        : 'text-muted'
                  )}
                >
                  {similarity.score}%
                </span>
              </div>
            </div>

            {/* Explanation */}
            <p className="text-[11px] text-muted leading-relaxed">
              {similarity.explanation}
            </p>

            {/* Shared traits */}
            {similarity.sharedTraits.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {similarity.sharedTraits.map((trait) => (
                  <span
                    key={trait}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent/80 border border-accent/20"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}

            {/* Breakdown bars */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {(Object.entries(similarity.breakdown) as [keyof DimensionBreakdown, number][]).map(
                ([dim, val]) => (
                  <div key={dim} className="flex items-center gap-2">
                    <span className="text-[9px] text-muted font-mono w-16 shrink-0 text-right">
                      {DIMENSION_LABELS[dim]}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round(val * 100)}%`,
                          background:
                            val >= 0.6
                              ? 'var(--color-accent)'
                              : val >= 0.3
                                ? '#FFB800'
                                : 'rgba(255,255,255,0.2)',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted font-mono w-7 shrink-0">
                      {Math.round(val * 100)}%
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Fashion characteristics comparison */}
            <FashionCharacteristicsComparison isoA={a.iso} isoB={b.iso} nameA={a.name} nameB={b.name} />
          </div>
        ))}
      </div>

      <p className="text-[9px] text-muted/40 text-center font-mono mt-4">
        Based on analysis of silhouettes, materials, techniques, color palettes, and cultural aesthetics
      </p>
    </Section>
  );
}

function FashionCharacteristicsComparison({
  isoA,
  isoB,
  nameA,
  nameB,
}: {
  isoA: string;
  isoB: string;
  nameA: string;
  nameB: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const charsA = getCharacteristics(isoA);
  const charsB = getCharacteristics(isoB);

  if (!charsA || !charsB) return null;

  const dimensions: Array<{
    label: string;
    tagsA: string[];
    tagsB: string[];
  }> = [
    { label: 'Silhouette', tagsA: charsA.silhouette, tagsB: charsB.silhouette },
    { label: 'Color Palette', tagsA: charsA.colorPalette, tagsB: charsB.colorPalette },
    { label: 'Materials', tagsA: charsA.materials, tagsB: charsB.materials },
    { label: 'Techniques', tagsA: charsA.techniques, tagsB: charsB.techniques },
    { label: 'Aesthetics', tagsA: charsA.aestheticPhilosophy, tagsB: charsB.aestheticPhilosophy },
  ];

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-accent/70 hover:text-accent transition-colors font-mono"
      >
        {expanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
        {expanded ? 'HIDE' : 'SHOW'} DETAILED COMPARISON
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {dimensions.map(({ label, tagsA, tagsB }) => {
                const shared = tagsA.filter((t) => tagsB.includes(t));

                return (
                  <div key={label}>
                    <div className="text-[10px] text-muted font-mono uppercase tracking-wider mb-1.5">
                      {label}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[9px] text-muted/60 mb-1">{nameA}</div>
                        <div className="flex flex-wrap gap-1">
                          {tagsA.map((tag) => (
                            <span
                              key={tag}
                              className={cn(
                                'text-[9px] px-1.5 py-0.5 rounded-full border',
                                shared.includes(tag)
                                  ? 'bg-accent/15 text-accent border-accent/25'
                                  : 'bg-white/5 text-muted border-white/10'
                              )}
                            >
                              {tag.replace(/-/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-muted/60 mb-1">{nameB}</div>
                        <div className="flex flex-wrap gap-1">
                          {tagsB.map((tag) => (
                            <span
                              key={tag}
                              className={cn(
                                'text-[9px] px-1.5 py-0.5 rounded-full border',
                                shared.includes(tag)
                                  ? 'bg-accent/15 text-accent border-accent/25'
                                  : 'bg-white/5 text-muted border-white/10'
                              )}
                            >
                              {tag.replace(/-/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {shared.length > 0 && (
                      <div className="text-[9px] text-accent/60 mt-1 font-mono">
                        {shared.length} shared: {shared.map(t => t.replace(/-/g, ' ')).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Numeric dimensions */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Embellishment', a: charsA.embellishmentLevel, b: charsB.embellishmentLevel, max: 5 },
                  { label: 'Modesty', a: charsA.modesty, b: charsB.modesty, max: 5 },
                  { label: 'Gender Distinction', a: charsA.genderDistinction, b: charsB.genderDistinction, max: 5 },
                ].map(({ label, a, b, max }) => (
                  <div key={label} className="rounded-lg bg-white/[0.03] p-2">
                    <div className="text-[9px] text-muted font-mono mb-1">{label}</div>
                    <div className="flex items-center justify-center gap-3">
                      <span className={cn('text-xs font-mono font-bold', a === b ? 'text-accent' : 'text-foreground')}>
                        {a}/{max}
                      </span>
                      <span className="text-[9px] text-muted">vs</span>
                      <span className={cn('text-xs font-mono font-bold', a === b ? 'text-accent' : 'text-foreground')}>
                        {b}/{max}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
            className="absolute bottom-full mb-2 left-0 w-72 rounded-xl border border-white/10 bg-[#0F1629] shadow-2xl overflow-hidden z-[60]"
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
                    {c.tier === 'skeleton' ? '—' : c.tier.toUpperCase()}
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
  const { data: wbData, loading: wbLoading } = useWorldBankComparison(comparedCountries);

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
                Click countries on the globe or click &apos;Add Country&apos; below to
                search and compare up to 3 countries.
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
                        {c.tier === 'skeleton' ? 'Unrated' : `TIER ${c.tier.toUpperCase()}`}
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

              {/* 1.5 Fashion Culture Similarity */}
              {comparedData.length >= 2 && (
                <FashionSimilaritySection countries={comparedData} />
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

              {/* 3. Economic Indicators (World Bank) */}
              <Section title="Economic Indicators" defaultOpen={true}>
                {wbLoading.size > 0 && wbData.size === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <Loader2 className="w-4 h-4 text-accent animate-spin" />
                    <span className="text-xs text-muted font-mono">
                      Loading World Bank data...
                    </span>
                  </div>
                ) : wbData.size === 0 ? (
                  <p className="text-xs text-muted text-center py-4">
                    World Bank data unavailable
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left text-[10px] text-muted font-mono uppercase tracking-wider py-2 pr-4">
                            Indicator
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
                        {/* Manufacturing % of GDP */}
                        {(() => {
                          const vals = comparedData.map(
                            (c) => wbData.get(c.iso)?.manufacturingPct?.value ?? null
                          );
                          const hasAny = vals.some((v) => v !== null);
                          if (!hasAny) return null;
                          const maxIdx = vals.reduce<number>(
                            (best, v, i) =>
                              v !== null && (best === -1 || v > (vals[best as number] ?? -Infinity))
                                ? i
                                : best,
                            -1
                          );
                          return (
                            <tr className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="py-2.5 pr-4 text-xs text-muted">
                                Manufacturing % GDP
                              </td>
                              {comparedData.map((c, i) => {
                                const wb = wbData.get(c.iso);
                                const val = wb?.manufacturingPct?.value;
                                const year = wb?.manufacturingPct?.year;
                                const isWinner = maxIdx === i && comparedData.length >= 2;
                                return (
                                  <td
                                    key={c.iso}
                                    className={cn(
                                      'py-2.5 px-2 text-center font-mono text-sm',
                                      isWinner ? 'text-accent font-bold' : 'text-foreground'
                                    )}
                                  >
                                    {val != null ? (
                                      <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1.5">
                                          {val.toFixed(1)}%
                                          {isWinner && <Crown className="w-3 h-3 text-accent" />}
                                        </div>
                                        {year && (
                                          <span className="text-[9px] text-muted font-mono">
                                            {year}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted">--</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })()}

                        {/* Industry Employment % */}
                        {(() => {
                          const vals = comparedData.map(
                            (c) => wbData.get(c.iso)?.industryEmploymentPct?.value ?? null
                          );
                          const hasAny = vals.some((v) => v !== null);
                          if (!hasAny) return null;
                          const maxIdx = vals.reduce<number>(
                            (best, v, i) =>
                              v !== null && (best === -1 || v > (vals[best as number] ?? -Infinity))
                                ? i
                                : best,
                            -1
                          );
                          return (
                            <tr className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="py-2.5 pr-4 text-xs text-muted">
                                Industry Employment %
                              </td>
                              {comparedData.map((c, i) => {
                                const wb = wbData.get(c.iso);
                                const val = wb?.industryEmploymentPct?.value;
                                const year = wb?.industryEmploymentPct?.year;
                                const isWinner = maxIdx === i && comparedData.length >= 2;
                                return (
                                  <td
                                    key={c.iso}
                                    className={cn(
                                      'py-2.5 px-2 text-center font-mono text-sm',
                                      isWinner ? 'text-accent font-bold' : 'text-foreground'
                                    )}
                                  >
                                    {val != null ? (
                                      <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1.5">
                                          {val.toFixed(1)}%
                                          {isWinner && <Crown className="w-3 h-3 text-accent" />}
                                        </div>
                                        {year && (
                                          <span className="text-[9px] text-muted font-mono">
                                            {year}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted">--</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })()}

                        {/* GDP */}
                        {(() => {
                          const vals = comparedData.map(
                            (c) => wbData.get(c.iso)?.gdp?.value ?? null
                          );
                          const hasAny = vals.some((v) => v !== null);
                          if (!hasAny) return null;
                          const maxIdx = vals.reduce<number>(
                            (best, v, i) =>
                              v !== null && (best === -1 || v > (vals[best as number] ?? -Infinity))
                                ? i
                                : best,
                            -1
                          );
                          return (
                            <tr className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="py-2.5 pr-4 text-xs text-muted">
                                GDP (World Bank)
                              </td>
                              {comparedData.map((c, i) => {
                                const wb = wbData.get(c.iso);
                                const val = wb?.gdp?.value;
                                const year = wb?.gdp?.year;
                                const isWinner = maxIdx === i && comparedData.length >= 2;
                                return (
                                  <td
                                    key={c.iso}
                                    className={cn(
                                      'py-2.5 px-2 text-center font-mono text-sm',
                                      isWinner ? 'text-accent font-bold' : 'text-foreground'
                                    )}
                                  >
                                    {val != null ? (
                                      <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1.5">
                                          {formatCurrency(val)}
                                          {isWinner && <Crown className="w-3 h-3 text-accent" />}
                                        </div>
                                        {year && (
                                          <span className="text-[9px] text-muted font-mono">
                                            {year}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted">--</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })()}

                        {/* Exports of goods & services % GDP */}
                        {(() => {
                          const vals = comparedData.map(
                            (c) => wbData.get(c.iso)?.exportsGoodsPct?.value ?? null
                          );
                          const hasAny = vals.some((v) => v !== null);
                          if (!hasAny) return null;
                          const maxIdx = vals.reduce<number>(
                            (best, v, i) =>
                              v !== null && (best === -1 || v > (vals[best as number] ?? -Infinity))
                                ? i
                                : best,
                            -1
                          );
                          return (
                            <tr className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="py-2.5 pr-4 text-xs text-muted">
                                Exports % GDP
                              </td>
                              {comparedData.map((c, i) => {
                                const wb = wbData.get(c.iso);
                                const val = wb?.exportsGoodsPct?.value;
                                const year = wb?.exportsGoodsPct?.year;
                                const isWinner = maxIdx === i && comparedData.length >= 2;
                                return (
                                  <td
                                    key={c.iso}
                                    className={cn(
                                      'py-2.5 px-2 text-center font-mono text-sm',
                                      isWinner ? 'text-accent font-bold' : 'text-foreground'
                                    )}
                                  >
                                    {val != null ? (
                                      <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1.5">
                                          {val.toFixed(1)}%
                                          {isWinner && <Crown className="w-3 h-3 text-accent" />}
                                        </div>
                                        {year && (
                                          <span className="text-[9px] text-muted font-mono">
                                            {year}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted">--</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                    <p className="text-[9px] text-muted/50 text-center font-mono mt-3">
                      Source: World Bank Open Data
                    </p>
                  </div>
                )}
              </Section>

              {/* 4. Traditional Garments */}
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
