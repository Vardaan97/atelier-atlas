'use client';

import { useEffect } from 'react';
import { useGlobeStore } from '@/store/useGlobeStore';
import { FashionGlobe } from '@/components/globe/FashionGlobe';
import { GlobeControls } from '@/components/globe/GlobeControls';
import { GlobeTooltip } from '@/components/globe/GlobeTooltip';
import { ColorLegend } from '@/components/globe/ColorLegend';
import { CountryPanel } from '@/components/panels/CountryPanel';
import { ComparisonView } from '@/components/panels/ComparisonView';
import { FilterSidebar } from '@/components/filters/FilterSidebar';
import { SearchBar } from '@/components/search/SearchBar';
import { TimelineSlider } from '@/components/ui/TimelineSlider';
import { BottomTicker } from '@/components/ui/BottomTicker';
import { OnboardingHint } from '@/components/ui/OnboardingHint';
import { useIsMobile } from '@/hooks/useIsMobile';
import { usePrefetch } from '@/hooks/usePrefetch';
import type { CountryBase } from '@/types/country';

export function GlobeView() {
  const setCountries = useGlobeStore((s) => s.setCountries);
  const globeReady = useGlobeStore((s) => s.globeReady);
  const isMobile = useIsMobile();

  // Background pre-fetch garment images for top countries (runs silently)
  usePrefetch(globeReady);

  // Safety net: force globeReady after 15s to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!useGlobeStore.getState().globeReady) {
        console.warn('Globe loading timeout — forcing ready state');
        useGlobeStore.getState().setGlobeReady(true);
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, []);

  // Load country data
  useEffect(() => {
    import('@/data/countries.json').then((mod) => {
      const data = (mod.default || mod) as unknown as CountryBase[];
      setCountries(data);
    });
  }, [setCountries]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A0A1A]">
      {/* Header */}
      <div className="absolute top-3 md:top-4 left-1/2 -translate-x-1/2 z-20 safe-area-top">
        <div className="glass-panel rounded-full px-3 md:px-6 py-1.5 md:py-2 flex items-center gap-2 md:gap-3">
          <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-accent animate-pulse-glow" />
          <h1 className="font-heading text-xs md:text-lg font-bold tracking-tight">
            Atelier Atlas
          </h1>
          <span className="hidden sm:inline text-[10px] text-muted font-mono uppercase tracking-widest">
            Global Fashion Intelligence
          </span>
        </div>
      </div>

      {/* Globe — always use 3D globe, wait for isMobile detection to avoid hydration mismatch */}
      {isMobile === undefined ? null : <FashionGlobe />}

      {/* Filter Sidebar */}
      <FilterSidebar />

      {/* Search Bar */}
      <SearchBar />

      {/* Controls overlay */}
      <GlobeControls />

      {/* Tooltip */}
      <GlobeTooltip />

      {/* Color Legend */}
      <ColorLegend />

      {/* Country Panel */}
      <CountryPanel />

      {/* Comparison View */}
      <ComparisonView />

      {/* First-visit onboarding hint */}
      <OnboardingHint />

      {/* Loading overlay — also shows while detecting mobile/desktop */}
      {(!globeReady || isMobile === undefined) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0A0A1A]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <p className="text-muted text-sm font-mono tracking-wider">
              LOADING ATLAS...
            </p>
          </div>
        </div>
      )}

      {/* Timeline era slider */}
      <TimelineSlider />

      {/* Bottom ticker */}
      <BottomTicker />
    </div>
  );
}
