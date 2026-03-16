'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  Command,
  X,
  ArrowUp,
  ArrowDown,
  Loader2,
  Globe,
  CornerDownLeft,
} from 'lucide-react';
import { useGlobeStore } from '@/store/useGlobeStore';
import { cn } from '@/lib/utils';
import type { CountryBase } from '@/types/country';

interface LocalMatch {
  iso: string;
  name: string;
  flag: string;
  region: string;
  matchField: string; // what matched: "name", "region", "fabric", "designer"
}

interface AiResult {
  iso: string;
  reason: string;
  score: number;
}

/**
 * Fuzzy-ish match: checks whether every word in the query appears as
 * a prefix of some word in the target string. Case-insensitive.
 */
function fuzzyMatch(query: string, target: string): boolean {
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const tLower = target.toLowerCase();
  return qWords.every((w) => tLower.includes(w));
}

function searchCountries(
  countries: CountryBase[],
  query: string
): LocalMatch[] {
  if (!query.trim()) return [];
  const q = query.trim();
  const results: LocalMatch[] = [];
  const seen = new Set<string>();

  for (const c of countries) {
    // Name match (highest priority)
    if (fuzzyMatch(q, c.name) && !seen.has(c.iso)) {
      seen.add(c.iso);
      results.push({
        iso: c.iso,
        name: c.name,
        flag: c.flag,
        region: c.region,
        matchField: 'name',
      });
    }
  }

  for (const c of countries) {
    // Region / subregion match
    if (
      !seen.has(c.iso) &&
      (fuzzyMatch(q, c.region) || fuzzyMatch(q, c.subregion))
    ) {
      seen.add(c.iso);
      results.push({
        iso: c.iso,
        name: c.name,
        flag: c.flag,
        region: c.region,
        matchField: 'region',
      });
    }
  }

  for (const c of countries) {
    // Fabric match
    if (
      !seen.has(c.iso) &&
      c.primaryFabrics?.some((f) => fuzzyMatch(q, f))
    ) {
      seen.add(c.iso);
      results.push({
        iso: c.iso,
        name: c.name,
        flag: c.flag,
        region: c.region,
        matchField: 'fabric',
      });
    }
  }

  for (const c of countries) {
    // Designer match
    if (
      !seen.has(c.iso) &&
      c.keyDesigners?.some(
        (d) => fuzzyMatch(q, d.name) || (d.brand && fuzzyMatch(q, d.brand))
      )
    ) {
      seen.add(c.iso);
      results.push({
        iso: c.iso,
        name: c.name,
        flag: c.flag,
        region: c.region,
        matchField: 'designer',
      });
    }
  }

  // Capital match
  for (const c of countries) {
    if (!seen.has(c.iso) && fuzzyMatch(q, c.capital)) {
      seen.add(c.iso);
      results.push({
        iso: c.iso,
        name: c.name,
        flag: c.flag,
        region: c.region,
        matchField: 'capital',
      });
    }
  }

  return results.slice(0, 8);
}

function isQuestionQuery(q: string): boolean {
  const lower = q.toLowerCase().trim();
  const questionStarters = [
    'which',
    'what',
    'where',
    'who',
    'how',
    'why',
    'countries',
    'show me',
    'find',
    'list',
    'best',
    'top',
    'famous',
    'known for',
  ];
  return (
    lower.includes('?') ||
    questionStarters.some((s) => lower.startsWith(s)) ||
    (lower.split(' ').length >= 4 &&
      questionStarters.some((s) => lower.includes(s)))
  );
}

/* ---- Animated cycling placeholder ---- */
const PLACEHOLDERS = [
  'Search countries, fabrics, designers...',
  "Try 'silk' or 'kimono'...",
  'Find designers by name...',
  'Ask AI: Which countries are known for lace?',
];

function AnimatedPlaceholder({ show }: { show: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 flex items-center pointer-events-none select-none overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={PLACEHOLDERS[index]}
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-sm text-white/25 whitespace-nowrap"
        >
          {PLACEHOLDERS[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ---- Tiny SVG progress ring for AI score ---- */
function ScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score);

  return (
    <div className="relative flex items-center justify-center shrink-0" title={`${pct}% match`}>
      <svg width="26" height="26" viewBox="0 0 26 26" className="rotate-[-90deg]">
        <circle
          cx="13"
          cy="13"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="2.5"
        />
        <circle
          cx="13"
          cy="13"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="drop-shadow-[0_0_4px_rgba(233,69,96,0.6)]"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E94560" />
            <stop offset="100%" stopColor="#FF5A7A" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-[8px] font-mono text-accent font-bold leading-none">
        {pct}
      </span>
    </div>
  );
}

/* ---- Match field category config ---- */
const CATEGORY_CONFIG: Record<string, { label: string; dot: string }> = {
  region: { label: 'Region', dot: 'bg-blue-400' },
  fabric: { label: 'Fabric', dot: 'bg-emerald-400' },
  designer: { label: 'Designer', dot: 'bg-purple-400' },
  capital: { label: 'Capital', dot: 'bg-amber-400' },
};

/* ---- Highlight matching text ---- */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);

  // Find the best match position
  let bestStart = -1;
  let bestLen = 0;
  const textLower = text.toLowerCase();

  for (const w of qWords) {
    const idx = textLower.indexOf(w);
    if (idx !== -1 && w.length > bestLen) {
      bestStart = idx;
      bestLen = w.length;
    }
  }

  if (bestStart === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, bestStart)}
      <span className="text-accent font-semibold">{text.slice(bestStart, bestStart + bestLen)}</span>
      {text.slice(bestStart + bestLen)}
    </>
  );
}

/* ---- Dropdown spring animation ---- */
const dropdownVariants = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
};

const dropdownTransition = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 380,
};

export function SearchBar() {
  const countries = useGlobeStore((s) => s.countries);
  const selectCountry = useGlobeStore((s) => s.selectCountry);
  const setSearchQuery = useGlobeStore((s) => s.setSearchQuery);
  const setSearchResults = useGlobeStore((s) => s.setSearchResults);
  const panelOpen = useGlobeStore((s) => s.panelOpen);

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [localMatches, setLocalMatches] = useState<LocalMatch[]>([]);
  const [aiResults, setAiResults] = useState<AiResult[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Total selectable items (local + ai)
  const allItems = useMemo(() => {
    const items: { type: 'local' | 'ai'; iso: string; label: string }[] = [];
    localMatches.forEach((m) =>
      items.push({ type: 'local', iso: m.iso, label: m.name })
    );
    aiResults.forEach((r) => {
      const c = countries.find((cc) => cc.iso === r.iso);
      if (c) items.push({ type: 'ai', iso: r.iso, label: c.name });
    });
    return items;
  }, [localMatches, aiResults, countries]);

  const hasResults = localMatches.length > 0 || aiResults.length > 0;
  const showDropdown = open && (hasResults || aiLoading || inputValue.trim().length > 0);

  // ---- Global keyboard shortcut: Cmd+K / Ctrl+K ----
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setOpen((prev) => {
          if (!prev) {
            // Opening - focus input on next frame after render
            requestAnimationFrame(() => {
              inputRef.current?.focus();
            });
          } else {
            // Closing - blur input
            inputRef.current?.blur();
          }
          return !prev;
        });
      }
    }
    document.addEventListener('keydown', handleGlobalKey, { capture: true });
    return () => document.removeEventListener('keydown', handleGlobalKey, { capture: true });
  }, []);

  // ---- Click outside to close ----
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setInputValue('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // ---- Debounced local search ----
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!inputValue.trim()) {
      setLocalMatches([]);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      const matches = searchCountries(countries, inputValue);
      setLocalMatches(matches);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [inputValue, countries]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [localMatches, aiResults]);

  // ---- Select a result ----
  const handleSelect = useCallback(
    (iso: string) => {
      selectCountry(iso);
      setSearchResults([iso]);
      setSearchQuery(inputValue);
      setOpen(false);
      setInputValue('');
      setLocalMatches([]);
      setAiResults([]);
    },
    [selectCountry, setSearchResults, setSearchQuery, inputValue]
  );

  // ---- AI search ----
  const triggerAiSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`
        );
        if (!res.ok) throw new Error('Search failed');
        const json = await res.json();
        if (json.data?.results) {
          setAiResults(json.data.results);
          setSearchResults(
            json.data.results.map((r: AiResult) => r.iso)
          );
          setSearchQuery(query);
        }
      } catch (err) {
        setAiError(
          err instanceof Error ? err.message : 'Search failed'
        );
      } finally {
        setAiLoading(false);
      }
    },
    [setSearchResults, setSearchQuery]
  );

  // ---- Keyboard navigation in dropdown ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        setInputValue('');
        inputRef.current?.blur();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < allItems.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : allItems.length - 1
        );
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < allItems.length) {
          handleSelect(allItems[activeIndex].iso);
        } else if (isQuestionQuery(inputValue) || localMatches.length === 0) {
          triggerAiSearch(inputValue);
        } else if (localMatches.length > 0) {
          handleSelect(localMatches[0].iso);
        }
        return;
      }
    },
    [allItems, activeIndex, handleSelect, inputValue, localMatches, triggerAiSearch]
  );

  const matchFieldLabel = (field: string) => {
    return CATEGORY_CONFIG[field] || null;
  };

  const showAnimatedPlaceholder = !inputValue && isFocused;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute top-14 md:top-16 left-1/2 -translate-x-1/2 w-full max-w-[92vw] md:max-w-lg px-2 md:px-4",
        panelOpen ? "z-20 hidden" : "z-40"
      )}
    >
      {/* Search Input - Gradient border wrapper on focus */}
      <div
        className={cn(
          'rounded-xl transition-all duration-300 p-[1px]',
          isFocused
            ? 'bg-gradient-to-r from-accent via-pink-500/60 to-accent shadow-[0_0_24px_rgba(233,69,96,0.2),0_0_48px_rgba(233,69,96,0.08)]'
            : 'bg-white/[0.08] hover:bg-white/[0.12]'
        )}
      >
        <div
          className={cn(
            'rounded-[11px] flex items-center gap-3 px-4 py-2.5 transition-all duration-200',
            isFocused
              ? 'bg-[#0A0A1A] backdrop-blur-xl'
              : 'bg-[#0A0A1A]/80 backdrop-blur-xl hover:bg-[#0A0A1A]/90'
          )}
        >
          <motion.div
            animate={{
              scale: isFocused ? 1.1 : 1,
            }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          >
            <Search
              className={cn(
                'w-4 h-4 shrink-0 transition-colors duration-300',
                isFocused ? 'text-accent drop-shadow-[0_0_6px_rgba(233,69,96,0.5)]' : 'text-muted'
              )}
            />
          </motion.div>
          <div className="relative flex-1">
            <AnimatedPlaceholder show={showAnimatedPlaceholder} />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => {
                setOpen(true);
                setIsFocused(true);
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={isFocused ? '' : 'Search countries, fabrics, designers...'}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-white/20 outline-none"
              aria-label="Search countries"
              aria-expanded={showDropdown}
              aria-controls="search-results-list"
              aria-autocomplete="list"
              role="combobox"
            />
          </div>
          {inputValue && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => {
                setInputValue('');
                setLocalMatches([]);
                setAiResults([]);
                inputRef.current?.focus();
              }}
              className="text-white/30 hover:text-foreground hover:bg-white/[0.06] rounded-md p-0.5 transition-all duration-150"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
          <kbd className={cn(
            "hidden sm:flex items-center gap-0.5 text-[10px] font-mono rounded-md px-2 py-1 cursor-default transition-all duration-200",
            isFocused
              ? 'text-accent/60 bg-accent/[0.08] border border-accent/[0.15] shadow-[0_0_8px_rgba(233,69,96,0.1)]'
              : 'text-white/30 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]'
          )}>
            <Command className="w-3 h-3" />K
          </kbd>
        </div>
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={dropdownTransition}
            className={cn(
              'mt-2 rounded-xl overflow-hidden max-h-[45vh] md:max-h-[60vh]',
              'bg-[#0C0C1E]/97 backdrop-blur-2xl border border-white/[0.08]',
              'shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)]',
              'relative'
            )}
            id="search-results-list"
            role="listbox"
          >
            {/* Gradient top border accent line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

            {/* Subtle inner glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse at 20% 0%, rgba(233,69,96,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.01) 0%, transparent 40%)',
              }}
            />

            {/* Noise texture overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-overlay"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
              }}
            />

            {/* Scrollable content */}
            <div className="relative overflow-y-auto max-h-[calc(45vh-44px)] md:max-h-[calc(60vh-44px)]">
              {/* Local matches */}
              {localMatches.length > 0 && (
                <div className="p-1.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 px-2.5 py-2 flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/70 shadow-[0_0_6px_rgba(233,69,96,0.5)]" />
                    Countries
                    <span className="text-white/15 ml-auto tabular-nums">{localMatches.length}</span>
                  </p>
                  {localMatches.map((match, i) => {
                    const globalIndex = i;
                    const category = matchFieldLabel(match.matchField);
                    const isActive = activeIndex === globalIndex;
                    return (
                      <motion.button
                        key={match.iso}
                        initial={false}
                        animate={{
                          backgroundColor: isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0)',
                        }}
                        transition={{ duration: 0.15 }}
                        onClick={() => handleSelect(match.iso)}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group relative',
                          isActive
                            ? 'text-foreground'
                            : 'text-foreground/80 hover:text-foreground'
                        )}
                        role="option"
                        aria-selected={isActive}
                      >
                        {/* Left accent bar */}
                        <div className={cn(
                          'absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-full transition-all duration-200',
                          isActive ? 'h-5 bg-accent shadow-[0_0_8px_rgba(233,69,96,0.5)]' : 'h-0 bg-transparent'
                        )} />
                        <span className="text-lg shrink-0 drop-shadow-sm">{match.flag}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            <HighlightMatch text={match.name} query={inputValue} />
                          </span>
                          <span className="text-[11px] text-white/25">{match.region}</span>
                        </div>
                        {category && (
                          <span className="flex items-center gap-1.5 text-[10px] text-white/50 bg-white/[0.04] border border-white/[0.06] rounded-md px-2 py-0.5 shrink-0">
                            <span className={cn('w-1.5 h-1.5 rounded-full', category.dot)} />
                            {category.label}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Divider */}
              {localMatches.length > 0 && (aiResults.length > 0 || aiLoading) && (
                <div className="mx-3 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              )}

              {/* AI loading state */}
              {aiLoading && (
                <div className="relative p-5 flex items-center justify-center gap-3">
                  <div className="relative">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    <div className="absolute inset-0 animate-ping opacity-20">
                      <Sparkles className="w-4 h-4 text-accent" />
                    </div>
                  </div>
                  <span className="text-sm text-white/35 font-medium">Searching with AI...</span>
                </div>
              )}

              {/* AI error */}
              {aiError && !aiLoading && (
                <div className="relative p-4 text-center text-sm text-red-400/80">
                  {aiError}
                </div>
              )}

              {/* AI results */}
              {aiResults.length > 0 && !aiLoading && (
                <div className="p-1.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 px-2.5 py-2 flex items-center gap-2 font-medium">
                    <Sparkles className="w-3 h-3 text-accent animate-[pulse_3s_ease-in-out_infinite]" />
                    AI Results
                    <span className="text-white/15 ml-auto tabular-nums">{aiResults.length}</span>
                  </p>
                  {aiResults.map((result, i) => {
                    const globalIndex = localMatches.length + i;
                    const c = countries.find((cc) => cc.iso === result.iso);
                    if (!c) return null;
                    const isActive = activeIndex === globalIndex;
                    return (
                      <motion.button
                        key={result.iso}
                        initial={false}
                        animate={{
                          backgroundColor: isActive ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0)',
                        }}
                        transition={{ duration: 0.15 }}
                        onClick={() => handleSelect(result.iso)}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group relative',
                          isActive
                            ? 'text-foreground'
                            : 'text-foreground/80 hover:text-foreground'
                        )}
                        role="option"
                        aria-selected={isActive}
                      >
                        {/* Left accent bar */}
                        <div className={cn(
                          'absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-full transition-all duration-200',
                          isActive ? 'h-5 bg-accent shadow-[0_0_8px_rgba(233,69,96,0.5)]' : 'h-0 bg-transparent'
                        )} />
                        <span className="text-lg shrink-0 drop-shadow-sm">{c.flag}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            <HighlightMatch text={c.name} query={inputValue} />
                          </span>
                          <span className="text-[11px] text-white/25 line-clamp-1">
                            {result.reason}
                          </span>
                        </div>
                        <ScoreRing score={result.score} />
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {!aiLoading &&
                !aiError &&
                localMatches.length === 0 &&
                aiResults.length === 0 &&
                inputValue.trim().length > 0 && (
                  <div className="relative p-8 text-center">
                    <div className="relative inline-block mb-4">
                      <Globe className="w-10 h-10 text-white/[0.06] mx-auto" />
                      <motion.div
                        className="absolute -top-1 -right-1"
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Sparkles className="w-4 h-4 text-accent/30" />
                      </motion.div>
                    </div>
                    <p className="text-sm font-medium text-white/35 mb-1">
                      No matches found
                    </p>
                    <p className="text-xs text-white/15 mb-4">
                      Try a different query or let AI find it for you
                    </p>
                    <motion.button
                      onClick={() => triggerAiSearch(inputValue)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        'inline-flex items-center gap-2 text-xs font-medium transition-all duration-200',
                        'text-accent hover:text-accent-hover',
                        'bg-accent/[0.08] hover:bg-accent/[0.14] border border-accent/[0.15] hover:border-accent/[0.25] rounded-lg px-4 py-2',
                        'shadow-[0_0_16px_rgba(233,69,96,0.15)] hover:shadow-[0_0_24px_rgba(233,69,96,0.25)]'
                      )}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Search with AI
                      <kbd className="text-[9px] text-accent/40 bg-accent/[0.06] border border-accent/[0.1] rounded px-1 py-0.5 font-mono ml-1">
                        <CornerDownLeft className="w-2.5 h-2.5 inline" />
                      </kbd>
                    </motion.button>
                  </div>
                )}
            </div>

            {/* Footer hint - always at bottom */}
            {(hasResults || aiLoading) && (
              <div className="relative border-t border-white/[0.05] bg-[#080818]/60 backdrop-blur-sm px-3 py-2 flex items-center justify-between text-[10px] text-white/25">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="inline-flex items-center justify-center w-[18px] h-[18px] bg-white/[0.05] border border-white/[0.08] rounded text-[9px] font-mono">
                      <ArrowUp className="w-2.5 h-2.5" />
                    </kbd>
                    <kbd className="inline-flex items-center justify-center w-[18px] h-[18px] bg-white/[0.05] border border-white/[0.08] rounded text-[9px] font-mono">
                      <ArrowDown className="w-2.5 h-2.5" />
                    </kbd>
                    <span className="ml-0.5 text-white/20">navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5 font-mono text-[9px]">
                      <CornerDownLeft className="w-2.5 h-2.5 inline" />
                    </kbd>
                    <span className="text-white/20">select</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5 font-mono text-[9px]">
                      esc
                    </kbd>
                    <span className="text-white/20">close</span>
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-accent/35">
                  <Sparkles className="w-2.5 h-2.5 animate-[pulse_3s_ease-in-out_infinite]" />
                  <span className="font-medium tracking-wide text-[9px]">AI-powered</span>
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
