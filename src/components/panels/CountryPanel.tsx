'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe2, TrendingUp, MapPin, Sparkles, Loader2 } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { useGlobeStore } from '@/store/useGlobeStore';
import { PANEL_TABS } from '@/lib/constants';
import { cn, formatCurrency } from '@/lib/utils';
import { useAiProfile } from '@/hooks/useAiProfile';
import { FashionDNAChart } from '@/components/charts/RadarChart';
import { TraditionalTab } from './TraditionalTab';
import { IndustryTab } from './IndustryTab';
import { ColorsTextilesTab } from './ColorsTextilesTab';
import { TimelineTab } from './TimelineTab';
import { CultureClimateTab } from './CultureClimateTab';
import { ContemporaryTab } from './ContemporaryTab';

export function CountryPanel() {
  const selectedCountry = useGlobeStore((s) => s.selectedCountry);
  const countries = useGlobeStore((s) => s.countries);
  const panelOpen = useGlobeStore((s) => s.panelOpen);
  const setPanelOpen = useGlobeStore((s) => s.setPanelOpen);
  const activeTab = useGlobeStore((s) => s.activeTab);
  const setActiveTab = useGlobeStore((s) => s.setActiveTab);

  const country = useMemo(
    () => countries.find((c) => c.iso === selectedCountry),
    [countries, selectedCountry]
  );

  const { profile, loading: profileLoading } = useAiProfile(country || null);

  return (
    <AnimatePresence>
      {panelOpen && country && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-full sm:w-[50%] z-30 glass-panel border-l border-white/10 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <span className="text-5xl">{country.flag}</span>
                <div>
                  <h2 className="text-2xl font-heading font-bold tracking-tight">
                    {country.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <MapPin className="w-3 h-3" />
                      {country.capital}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Globe2 className="w-3 h-3" />
                      {country.region}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <TrendingUp className="w-3 h-3" />
                      {formatCurrency(country.marketSize * 1e9)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            {/* Quick stats + Radar Chart */}
            <div className="flex gap-4 mt-4">
              <div className="flex-1 flex gap-3">
                {[
                  { label: 'Fashion Index', value: country.fashionIndex.toString() },
                  { label: 'Sustainability', value: `${country.sustainabilityScore}%` },
                  { label: 'Tier', value: country.tier.toUpperCase() },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-center"
                  >
                    <div className="text-lg font-mono font-bold text-accent">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-muted uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini Radar Chart */}
              {profile?.fashionDNA && (
                <div className="w-36 shrink-0">
                  <FashionDNAChart dna={profile.fashionDNA} size="sm" />
                </div>
              )}
              {profileLoading && (
                <div className="w-36 shrink-0 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-accent animate-spin" />
                </div>
              )}
            </div>

            {/* AI Profile indicator */}
            {profile && (
              <div className="flex items-center gap-1.5 mt-3">
                <Sparkles className="w-3 h-3 text-accent" />
                <span className="text-[10px] text-accent font-mono">AI PROFILE ACTIVE</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs.Root
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col flex-1 min-h-0"
          >
            <Tabs.List className="flex border-b border-white/10 px-4 shrink-0 overflow-x-auto">
              {PANEL_TABS.map((tab) => (
                <Tabs.Trigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2',
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted hover:text-foreground'
                  )}
                >
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <div className="flex-1 overflow-y-auto p-4">
              <Tabs.Content value="traditional" className="outline-none">
                <TraditionalTab country={country} />
              </Tabs.Content>
              <Tabs.Content value="colors" className="outline-none">
                <ColorsTextilesTab country={country} profile={profile} />
              </Tabs.Content>
              <Tabs.Content value="timeline" className="outline-none">
                <TimelineTab country={country} profile={profile} profileLoading={profileLoading} />
              </Tabs.Content>
              <Tabs.Content value="industry" className="outline-none">
                <IndustryTab country={country} />
              </Tabs.Content>
              <Tabs.Content value="culture" className="outline-none">
                <CultureClimateTab country={country} profile={profile} profileLoading={profileLoading} />
              </Tabs.Content>
              <Tabs.Content value="contemporary" className="outline-none">
                <ContemporaryTab country={country} profile={profile} profileLoading={profileLoading} />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
