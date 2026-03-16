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
      <div className={cn('border-b border-white/10 shrink-0 relative overflow-hidden', isMobile ? 'p-4' : 'p-6')}>
        {/* Subtle radial gradient bg */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(233,69,96,0.06),transparent_70%)]" />

        <div className="relative z-10">
          {/* Top row: flag + name + close */}
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
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <MapPin className="w-3 h-3" />
                    {country.capital}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Globe2 className="w-3 h-3" />
                    {country.region}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <TrendingUp className="w-3 h-3" />
                    {formatCurrency(country.marketSize * 1e9)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>

          {/* Stat cards + Radar */}
          <div className={cn('flex gap-3 mt-4', isMobile && 'flex-col')}>
            <div className="flex-1 grid grid-cols-3 gap-2">
              {/* Fashion Index */}
              <div className="relative overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/60 to-accent/0" />
                <div className={cn(
                  'font-mono font-bold bg-gradient-to-r from-accent to-pink-400 bg-clip-text text-transparent',
                  isMobile ? 'text-xl' : 'text-2xl'
                )}>
                  {country.fashionIndex}
                </div>
                <div className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">
                  Fashion Index
                </div>
              </div>

              {/* Sustainability — circular progress */}
              <div className="relative overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 flex flex-col items-center">
                <div className="relative">
                  <svg width={isMobile ? 36 : 44} height={isMobile ? 36 : 44} className="-rotate-90">
                    <circle
                      cx={isMobile ? 18 : 22}
                      cy={isMobile ? 18 : 22}
                      r={isMobile ? 14 : 18}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={3}
                      fill="none"
                    />
                    <circle
                      cx={isMobile ? 18 : 22}
                      cy={isMobile ? 18 : 22}
                      r={isMobile ? 14 : 18}
                      stroke="rgb(52,211,153)"
                      strokeWidth={3}
                      fill="none"
                      strokeDasharray={2 * Math.PI * (isMobile ? 14 : 18)}
                      strokeDashoffset={2 * Math.PI * (isMobile ? 14 : 18) * (1 - country.sustainabilityScore / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className={cn(
                    'absolute inset-0 flex items-center justify-center font-mono font-bold text-emerald-400',
                    isMobile ? 'text-[10px]' : 'text-xs'
                  )}>
                    {country.sustainabilityScore}
                  </span>
                </div>
                <div className="text-[9px] text-white/40 uppercase tracking-wider mt-1">
                  Sustainability
                </div>
              </div>

              {/* Tier badge */}
              <div className="relative overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center flex flex-col items-center justify-center">
                {country.tier !== 'skeleton' ? (
                  <span className={cn(
                    'inline-flex items-center justify-center px-3 py-1 rounded-lg font-mono font-bold text-sm border',
                    country.tier === 'A' && 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                    country.tier === 'B' && 'bg-slate-400/15 text-slate-300 border-slate-400/30',
                    country.tier === 'C' && 'bg-orange-700/15 text-orange-400 border-orange-700/30',
                  )}>
                    Tier {country.tier}
                  </span>
                ) : (
                  <span className="text-sm font-mono text-white/30">—</span>
                )}
                <div className="text-[9px] text-white/40 uppercase tracking-wider mt-1">
                  Market Tier
                </div>
              </div>
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
              <span className="text-[10px] text-accent font-mono tracking-wider">AI PROFILE ACTIVE</span>
            </div>
          )}

          {/* Gradient accent line */}
          <div className="mt-4 h-[1px] bg-gradient-to-r from-accent/50 via-pink-500/30 to-transparent" />
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="relative shrink-0">
          <Tabs.List className="flex border-b border-white/10 px-2 md:px-4 overflow-x-auto scrollbar-hide">
            {PANEL_TABS.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  'px-2.5 md:px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2',
                  isMobile && 'text-[11px] px-2 py-2.5',
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted hover:text-foreground'
                )}
              >
                {isMobile ? (mobileTabLabels[tab.id] || tab.label) : tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {/* Scroll fade indicators for mobile */}
          {isMobile && (
            <>
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0A0A1A]/80 to-transparent pointer-events-none" />
            </>
          )}
        </div>

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
              if (info.offset.y > 80 || info.velocity.y > 400) {
                setPanelOpen(false);
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0A1A]/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl overflow-hidden flex flex-col safe-area-bottom"
            style={{ maxHeight: '85dvh' }}
          >
            {panelContent}
          </motion.div>
        ) : (
          /* ---- Desktop: Right slide-in panel ---- */
          <motion.div
            key="side-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { type: 'spring', damping: 30, stiffness: 300 } }}
            exit={{ x: '100%', opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }}
            className="fixed right-0 top-0 h-full w-full md:w-[65%] lg:w-[50%] z-30 glass-panel border-l border-white/10 overflow-hidden flex flex-col"
          >
            {panelContent}
          </motion.div>
        )
      )}
    </AnimatePresence>
  );
}
