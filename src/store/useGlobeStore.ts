import { create } from 'zustand';
import type { CountryBase, CountryProfile, MetricKey } from '@/types/country';
import type { TooltipData } from '@/types/globe';
import { applyFilters, DEFAULT_FILTERS, type FilterState } from '@/lib/filters';

interface GlobeState {
  // Country data
  countries: CountryBase[];
  setCountries: (countries: CountryBase[]) => void;

  // Selection
  selectedCountry: string | null; // ISO code
  selectCountry: (iso: string | null) => void;

  // Hover
  hoveredCountry: string | null;
  setHoveredCountry: (iso: string | null) => void;
  tooltip: TooltipData | null;
  setTooltip: (tooltip: TooltipData | null) => void;

  // Panel
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Globe settings
  activeMetric: MetricKey;
  setActiveMetric: (metric: MetricKey) => void;
  autoRotate: boolean;
  setAutoRotate: (rotate: boolean) => void;

  // Cached profiles
  profileCache: Map<string, CountryProfile>;
  cacheProfile: (iso: string, profile: CountryProfile) => void;
  getCachedProfile: (iso: string) => CountryProfile | undefined;

  // Comparison mode
  comparisonMode: boolean;
  comparedCountries: string[];
  toggleComparisonMode: () => void;
  addComparisonCountry: (iso: string) => void;
  removeComparisonCountry: (iso: string) => void;

  // Filters (expanded)
  regionFilter: string | null;
  setRegionFilter: (region: string | null) => void;
  tierFilter: string[];
  fashionIndexRange: [number, number];
  marketSizeRange: [number, number];
  sustainabilityRange: [number, number];
  fabricFilter: string[];
  fashionWeekFilter: string[];
  climateFilter: string[];
  textileHeritage: boolean;
  colorFilter: string | null;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  getFilteredCountries: () => string[];
  filterSidebarOpen: boolean;
  setFilterSidebarOpen: (open: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: string[];
  setSearchResults: (results: string[]) => void;

  // Overlay mode
  overlayMode: 'metric' | 'sustainability' | 'climate' | 'fashionWeek';
  setOverlayMode: (mode: 'metric' | 'sustainability' | 'climate' | 'fashionWeek') => void;

  // Era filter
  activeEra: string | null; // null = "all eras"
  setActiveEra: (era: string | null) => void;

  // Globe loading
  globeReady: boolean;
  setGlobeReady: (ready: boolean) => void;
}

export const useGlobeStore = create<GlobeState>((set, get) => ({
  countries: [],
  setCountries: (countries) => set({ countries }),

  selectedCountry: null,
  selectCountry: (iso) =>
    set({
      selectedCountry: iso,
      panelOpen: iso !== null,
      activeTab: 'traditional',
      autoRotate: iso === null,
    }),

  hoveredCountry: null,
  setHoveredCountry: (iso) => set({ hoveredCountry: iso }),
  tooltip: null,
  setTooltip: (tooltip) => set({ tooltip }),

  panelOpen: false,
  setPanelOpen: (open) =>
    set({
      panelOpen: open,
      selectedCountry: open ? get().selectedCountry : null,
      autoRotate: !open,
    }),
  activeTab: 'traditional',
  setActiveTab: (tab) => set({ activeTab: tab }),

  activeMetric: 'fashionIndex',
  setActiveMetric: (metric) => set({ activeMetric: metric, overlayMode: 'metric' }),
  autoRotate: true,
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),

  profileCache: new Map(),
  cacheProfile: (iso, profile) =>
    set((state) => {
      const newCache = new Map(state.profileCache);
      newCache.set(iso, profile);
      return { profileCache: newCache };
    }),
  getCachedProfile: (iso) => get().profileCache.get(iso),

  comparisonMode: false,
  comparedCountries: [],
  toggleComparisonMode: () =>
    set((state) => ({
      comparisonMode: !state.comparisonMode,
      comparedCountries: [],
    })),
  addComparisonCountry: (iso) =>
    set((state) => {
      if (state.comparedCountries.length >= 3) return state;
      if (state.comparedCountries.includes(iso)) return state;
      return { comparedCountries: [...state.comparedCountries, iso] };
    }),
  removeComparisonCountry: (iso) =>
    set((state) => ({
      comparedCountries: state.comparedCountries.filter((c) => c !== iso),
    })),

  // Filters
  regionFilter: DEFAULT_FILTERS.regionFilter,
  setRegionFilter: (region) => set({ regionFilter: region }),
  tierFilter: DEFAULT_FILTERS.tierFilter,
  fashionIndexRange: DEFAULT_FILTERS.fashionIndexRange,
  marketSizeRange: DEFAULT_FILTERS.marketSizeRange,
  sustainabilityRange: DEFAULT_FILTERS.sustainabilityRange,
  fabricFilter: DEFAULT_FILTERS.fabricFilter,
  fashionWeekFilter: DEFAULT_FILTERS.fashionWeekFilter,
  climateFilter: DEFAULT_FILTERS.climateFilter,
  textileHeritage: DEFAULT_FILTERS.textileHeritage,
  colorFilter: DEFAULT_FILTERS.colorFilter,

  setFilters: (filters) => set(filters),

  clearFilters: () =>
    set({
      regionFilter: DEFAULT_FILTERS.regionFilter,
      tierFilter: [...DEFAULT_FILTERS.tierFilter],
      fashionIndexRange: [...DEFAULT_FILTERS.fashionIndexRange],
      marketSizeRange: [...DEFAULT_FILTERS.marketSizeRange],
      sustainabilityRange: [...DEFAULT_FILTERS.sustainabilityRange],
      fabricFilter: [...DEFAULT_FILTERS.fabricFilter],
      fashionWeekFilter: [...DEFAULT_FILTERS.fashionWeekFilter],
      climateFilter: [...DEFAULT_FILTERS.climateFilter],
      textileHeritage: DEFAULT_FILTERS.textileHeritage,
      colorFilter: DEFAULT_FILTERS.colorFilter,
    }),

  getFilteredCountries: () => {
    const state = get();
    const filters: FilterState = {
      regionFilter: state.regionFilter,
      tierFilter: state.tierFilter,
      fashionIndexRange: state.fashionIndexRange,
      marketSizeRange: state.marketSizeRange,
      sustainabilityRange: state.sustainabilityRange,
      fabricFilter: state.fabricFilter,
      fashionWeekFilter: state.fashionWeekFilter,
      climateFilter: state.climateFilter,
      textileHeritage: state.textileHeritage,
      colorFilter: state.colorFilter,
    };
    return applyFilters(state.countries, filters);
  },

  filterSidebarOpen: false,
  setFilterSidebarOpen: (open) => set({ filterSidebarOpen: open }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),

  // Overlay mode
  overlayMode: 'metric',
  setOverlayMode: (mode) => set({ overlayMode: mode }),

  // Era filter
  activeEra: null,
  setActiveEra: (era) => set({ activeEra: era }),

  globeReady: false,
  setGlobeReady: (ready) => set({ globeReady: ready }),
}));
