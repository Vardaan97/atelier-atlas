'use client';

import { useEffect } from 'react';
import { useGlobeStore } from '@/store/useGlobeStore';
import { FashionGlobe } from '@/components/globe/FashionGlobe';
import { GlobeControls } from '@/components/globe/GlobeControls';
import { GlobeTooltip } from '@/components/globe/GlobeTooltip';
import { CountryPanel } from '@/components/panels/CountryPanel';
import { ComparisonView } from '@/components/panels/ComparisonView';
import { FilterSidebar } from '@/components/filters/FilterSidebar';
import { SearchBar } from '@/components/search/SearchBar';
import { TimelineSlider } from '@/components/ui/TimelineSlider';
import { BottomTicker } from '@/components/ui/BottomTicker';
import type { CountryBase } from '@/types/country';

export function GlobeView() {
  const setCountries = useGlobeStore((s) => s.setCountries);
  const globeReady = useGlobeStore((s) => s.globeReady);

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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="glass-panel rounded-full px-6 py-2 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
          <h1 className="font-heading text-lg font-bold tracking-tight">
            Atelier Atlas
          </h1>
          <span className="text-[10px] text-muted font-mono uppercase tracking-widest">
            Global Fashion Intelligence
          </span>
        </div>
      </div>

      {/* Globe */}
      <FashionGlobe />

      {/* Filter Sidebar */}
      <FilterSidebar />

      {/* Search Bar */}
      <SearchBar />

      {/* Controls overlay */}
      <GlobeControls />

      {/* Tooltip */}
      <GlobeTooltip />

      {/* Country Panel */}
      <CountryPanel />

      {/* Comparison View */}
      <ComparisonView />

      {/* Loading overlay */}
      {!globeReady && (
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
