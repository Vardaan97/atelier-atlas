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
            // Opening – focus input on next frame after render
            requestAnimationFrame(() => {
              inputRef.current?.focus();
            });
          } else {
            // Closing – blur input
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
    switch (field) {
      case 'name':
        return null;
      case 'region':
        return 'Region';
      case 'fabric':
        return 'Fabric';
      case 'designer':
        return 'Designer';
      case 'capital':
        return 'Capital';
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-sm md:max-w-lg px-4", panelOpen ? "z-20" : "z-40")}
    >
      {/* Search Input */}
      <div
        className={cn(
          'glass-panel rounded-xl flex items-center gap-3 px-4 py-2.5 transition-all duration-200',
          open && 'ring-1 ring-accent/40 glow-accent'
        )}
      >
        <Search className="w-4 h-4 text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search countries, fabrics, designers..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
          aria-label="Search countries"
          aria-expanded={showDropdown}
          aria-controls="search-results-list"
          aria-autocomplete="list"
          role="combobox"
        />
        {inputValue && (
          <button
            onClick={() => {
              setInputValue('');
              setLocalMatches([]);
              setAiResults([]);
              inputRef.current?.focus();
            }}
            className="text-muted hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">
          <Command className="w-3 h-3" />K
        </kbd>
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="mt-2 glass-panel rounded-xl overflow-hidden max-h-[45vh] md:max-h-[60vh] overflow-y-auto"
            id="search-results-list"
            role="listbox"
          >
            {/* Local matches */}
            {localMatches.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] uppercase tracking-wider text-muted px-2 py-1">
                  Countries
                </p>
                {localMatches.map((match, i) => {
                  const globalIndex = i;
                  const label = matchFieldLabel(match.matchField);
                  return (
                    <button
                      key={match.iso}
                      onClick={() => handleSelect(match.iso)}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        activeIndex === globalIndex
                          ? 'bg-white/10 text-foreground'
                          : 'text-foreground/80 hover:bg-white/5'
                      )}
                      role="option"
                      aria-selected={activeIndex === globalIndex}
                    >
                      <span className="text-lg shrink-0">{match.flag}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {match.name}
                        </span>
                        <span className="text-xs text-muted">{match.region}</span>
                      </div>
                      {label && (
                        <span className="text-[10px] text-accent/80 bg-accent/10 rounded px-1.5 py-0.5 shrink-0">
                          {label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Divider */}
            {localMatches.length > 0 && (aiResults.length > 0 || aiLoading) && (
              <div className="border-t border-white/5" />
            )}

            {/* AI results */}
            {aiLoading && (
              <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span>Searching with AI...</span>
              </div>
            )}

            {aiError && !aiLoading && (
              <div className="p-4 text-center text-sm text-red-400">
                {aiError}
              </div>
            )}

            {aiResults.length > 0 && !aiLoading && (
              <div className="p-2">
                <p className="text-[10px] uppercase tracking-wider text-muted px-2 py-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-accent" />
                  AI Results
                </p>
                {aiResults.map((result, i) => {
                  const globalIndex = localMatches.length + i;
                  const c = countries.find((cc) => cc.iso === result.iso);
                  if (!c) return null;
                  return (
                    <button
                      key={result.iso}
                      onClick={() => handleSelect(result.iso)}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        activeIndex === globalIndex
                          ? 'bg-white/10 text-foreground'
                          : 'text-foreground/80 hover:bg-white/5'
                      )}
                      role="option"
                      aria-selected={activeIndex === globalIndex}
                    >
                      <span className="text-lg shrink-0">{c.flag}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {c.name}
                        </span>
                        <span className="text-xs text-muted line-clamp-1">
                          {result.reason}
                        </span>
                      </div>
                      <span className="text-[10px] text-accent font-mono shrink-0">
                        {Math.round(result.score * 100)}%
                      </span>
                    </button>
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
                <div className="p-4 text-center">
                  <p className="text-sm text-muted">
                    No local matches found.
                  </p>
                  <button
                    onClick={() => triggerAiSearch(inputValue)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    Search with AI
                  </button>
                </div>
              )}

            {/* Footer hint */}
            {(hasResults || aiLoading) && (
              <div className="border-t border-white/5 px-3 py-2 flex items-center justify-between text-[10px] text-muted">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5">
                    <ArrowUp className="w-3 h-3" />
                    <ArrowDown className="w-3 h-3" />
                    navigate
                  </span>
                  <span>
                    <kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5 font-mono">
                      Enter
                    </kbd>{' '}
                    select
                  </span>
                  <span>
                    <kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5 font-mono">
                      Esc
                    </kbd>{' '}
                    close
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
