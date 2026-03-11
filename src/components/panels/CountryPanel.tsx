'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe2, TrendingUp, MapPin, Sparkles, Loader2 } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { useGlobeStore } from '@/store/useGlobeStore';
import { PANEL_TABS } from '@/lib/constants';
import { cn, formatCurrency } from '@/lib/utils';
import { useAiProfile } from '@/hooks/useAiProfile';
import { useIsMobile } from '@/hooks/useIsMobile';
import { FashionDNAChart } from '@/components/charts/RadarChart';
import { TraditionalTab } from './TraditionalTab';
import { IndustryTab } from './IndustryTab';
import { ColorsTextilesTab } from './ColorsTextilesTab';
import { TimelineTab } from './TimelineTab';
import { CultureClimateTab } from './CultureClimateTab';
import { ContemporaryTab } from './ContemporaryTab';
import { JewelryTab } from './JewelryTab';
import { AiStudioTab } from './AiStudioTab';
import { SimilaritySection } from './SimilaritySection';

export function CountryPanel() {
  const selectedCountry = useGlobeStore((s) => s.selectedCountry);
  const countries = useGlobeStore((s) => s.countries);
  const panelOpen = useGlobeStore((s) => s.panelOpen);
  const setPanelOpen = useGlobeStore((s) => s.setPanelOpen);
  const activeTab = useGlobeStore((s) => s.activeTab);
  const setActiveTab = useGlobeStore((s) => s.setActiveTab);
  const isMobile = useIsMobile();

  const country = useMemo(
    () => countries.find((c) => c.iso === selectedCountry),
    [countries, selectedCountry]
  );

  const { profile, loading: profileLoading } = useAiProfile(country || null);

  // Mobile-friendly short tab labels
  const mobileTabLabels: Record<string, string> = {
    traditional: 'Trad.',
    colors: 'Colors',
    timeline: 'Timeline',
    industry: 'Industry',
    jewelry: 'Gems',
    culture: 'Culture',
    contemporary: 'Modern',
    'ai-studio': 'AI',
  };

  // Shared panel content
  const panelContent = country ? (
    <>
      {/* Drag handle for mobile bottom sheet */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
      )}

      {/* Header */}
      <div className={cn('border-b border-white/10 shrink-0', isMobile ? 'p-4' : 'p-6')}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className={cn(isMobile ? 'text-3xl' : 'text-5xl')}>{country.flag}</span>
            <div>
              <h2 className={cn(
                'font-heading font-bold tracking-tight truncate',
                isMobile ? 'text-lg' : 'text-2xl'
              )}>
                {country.name}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
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
            className="p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Quick stats + Radar Chart */}
        <div className={cn('flex gap-3 mt-4', isMobile && 'flex-col')}>
          <div className="flex-1 flex gap-2">
            {[
              { label: 'Fashion Index', value: country.fashionIndex.toString() },
              { label: 'Sustainability', value: `${country.sustainabilityScore}%` },
              { label: 'Tier', value: country.tier === 'skeleton' ? '—' : `Tier ${country.tier.toUpperCase()}` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-center"
              >
                <div className={cn(
                  'font-mono font-bold text-accent',
                  isMobile ? 'text-base' : 'text-lg'
                )}>
                  {stat.value}
                </div>
                <div className="text-[10px] text-muted uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Mini Radar Chart */}
          {profile?.fashionDNA && !isMobile && (
            <div className="w-36 shrink-0">
              <FashionDNAChart dna={profile.fashionDNA} size="sm" />
            </div>
          )}
          {profileLoading && !isMobile && (
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
        <Tabs.List className="flex border-b border-white/10 px-4 shrink-0 overflow-x-auto scrollbar-hide">
          {PANEL_TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 min-h-[44px]',
                isMobile && 'px-2 text-[11px]',
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-foreground'
              )}
            >
              {isMobile ? (mobileTabLabels[tab.id] || tab.label) : tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 overflow-y-auto p-3 md:p-4">
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
          <Tabs.Content value="jewelry" className="outline-none">
            <JewelryTab country={country} />
          </Tabs.Content>
          <Tabs.Content value="culture" className="outline-none">
            <CultureClimateTab country={country} profile={profile} profileLoading={profileLoading} />
          </Tabs.Content>
          <Tabs.Content value="contemporary" className="outline-none">
            <ContemporaryTab country={country} profile={profile} profileLoading={profileLoading} />
          </Tabs.Content>
          <Tabs.Content value="ai-studio" className="outline-none">
            <AiStudioTab country={country} profile={profile} profileLoading={profileLoading} />
          </Tabs.Content>

          {/* Style Similarity — always visible below active tab */}
          <div className="border-t border-white/10 pt-4 mt-6">
            <SimilaritySection iso={country.iso} />
          </div>
        </div>
      </Tabs.Root>
    </>
  ) : null;

  return (
    <AnimatePresence mode="wait">
      {panelOpen && country && (
        isMobile ? (
          /* ---- Mobile: Bottom sheet ---- */
          <motion.div
            key="bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setPanelOpen(false);
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-30 glass-panel border-t border-white/10 rounded-t-2xl overflow-hidden flex flex-col safe-area-bottom"
            style={{ maxHeight: '80vh' }}
          >
            {panelContent}
          </motion.div>
        ) : (
          /* ---- Desktop: Right slide-in panel ---- */
          <motion.div
            key="side-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '110%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full lg:w-[50%] z-30 glass-panel border-l border-white/10 overflow-hidden flex flex-col"
          >
            {panelContent}
          </motion.div>
        )
      )}
    </AnimatePresence>
  );
}
