'use client';

import { motion } from 'framer-motion';
import { Calendar, User, TrendingUp, Wifi, ShoppingCart, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendsSection } from './TrendsSection';
import type { CountryBase, CountryProfile } from '@/types/country';

interface ContemporaryTabProps {
  country: CountryBase;
  profile: CountryProfile | null;
  profileLoading: boolean;
}

/* Reusable section header with gradient underline */
function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="relative flex items-center gap-2 mb-4 pb-2">
      <Icon className="w-4 h-4 text-accent" />
      <h3 className="text-sm font-medium text-muted uppercase tracking-wider">{label}</h3>
      <div className="absolute bottom-0 left-0 w-12 h-[2px] bg-gradient-to-r from-accent to-transparent" />
    </div>
  );
}

/* Tier-specific styling for fashion week cards */
const tierStyles = {
  'Big Four': { border: 'border-l-accent',     badge: 'bg-accent/20 text-accent' },
  'Major':    { border: 'border-l-blue-400',   badge: 'bg-blue-400/20 text-blue-400' },
  'Regional': { border: 'border-l-green-400',  badge: 'bg-green-400/20 text-green-400' },
} as const;

function getTierStyle(tier: string) {
  return tierStyles[tier as keyof typeof tierStyles] ?? tierStyles.Regional;
}

/* Designer initials avatar */
function DesignerAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={cn(
      'w-9 h-9 rounded-full shrink-0',
      'bg-gradient-to-br from-accent/20 to-pink-500/10',
      'border border-accent/20',
      'flex items-center justify-center',
      'text-[11px] font-bold text-accent'
    )}>
      {initials}
    </div>
  );
}

export function ContemporaryTab({ country, profile, profileLoading }: ContemporaryTabProps) {
  const scene = profile?.contemporaryScene;
  const designers = country.keyDesigners;

  if (profileLoading) {
    return <ContemporarySkeleton />;
  }

  const hasProfileContent = (scene?.fashionWeeks && scene.fashionWeeks.length > 0)
    || country.fashionWeeks.length > 0
    || designers.length > 0
    || (scene?.emergingTrends && scene.emergingTrends.length > 0);

  // Always render -- TrendsSection fetches its own data and is always relevant
  return (
    <div className="space-y-6">
      {/* Google Trends -- always shown */}
      <TrendsSection countryIso={country.iso} />

      {!hasProfileContent && !profileLoading && (
        <div className="flex flex-col items-center justify-center py-8 text-center border-t border-white/10 mt-4">
          <TrendingUp className="w-8 h-8 text-muted/30 mb-2" />
          <p className="text-muted text-xs">
            AI profile needed for additional contemporary analysis
          </p>
        </div>
      )}

      {/* Fashion Weeks */}
      {((scene?.fashionWeeks && scene.fashionWeeks.length > 0) || country.fashionWeeks.length > 0) && (
        <section className="animate-fade-in-up">
          <SectionHeader icon={Calendar} label="Fashion Weeks" />

          <div className="space-y-2">
            {scene?.fashionWeeks && scene.fashionWeeks.length > 0 ? (
              scene.fashionWeeks.map(fw => {
                const style = getTierStyle(fw.tier);
                return (
                  <div
                    key={fw.name}
                    className={cn(
                      'relative glass-panel rounded-xl p-4 border-l-2 overflow-hidden',
                      style.border
                    )}
                  >
                    {/* Subtle gradient top accent */}
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{fw.name}</h4>
                        <p className="text-[10px] text-muted">{fw.city} · {fw.month}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase border',
                        style.badge,
                        fw.tier === 'Big Four' ? 'border-accent/20' :
                        fw.tier === 'Major' ? 'border-blue-400/20' :
                        'border-green-400/20'
                      )}>
                        {fw.tier}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              country.fashionWeeks.map(fw => (
                <div key={fw} className="glass-panel rounded-xl p-3 border-l-2 border-l-accent/30">
                  <p className="text-sm">{fw}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Key Designers */}
      {designers.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <SectionHeader icon={User} label="Key Designers" />

          <div className="grid gap-2">
            {designers.map(designer => (
              <div
                key={designer.name}
                className={cn(
                  'glass-panel glass-panel-hover rounded-xl p-4',
                  'hover:shadow-[0_0_16px_rgba(233,69,96,0.08)]',
                  'transition-all duration-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <DesignerAvatar name={designer.name} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-heading font-semibold">{designer.name}</h4>
                    {designer.brand && (
                      <p className="text-[10px] text-accent font-mono">{designer.brand}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted">{designer.specialty}</p>
                    <p className="text-[10px] text-muted/60">{designer.era}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Emerging Trends */}
      {scene?.emergingTrends && scene.emergingTrends.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <SectionHeader icon={TrendingUp} label="Emerging Trends" />

          <div className="flex flex-wrap gap-2">
            {scene.emergingTrends.map((trend, i) => (
              <motion.span
                key={trend}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.04 }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs text-accent font-medium',
                  'bg-gradient-to-r from-accent/15 to-pink-500/10',
                  'border border-accent/20',
                  'hover:border-accent/40 hover:shadow-[0_0_10px_rgba(233,69,96,0.15)]',
                  'transition-all duration-300 cursor-default',
                  i < 3 && 'animate-pulse [animation-duration:3s]'
                )}
              >
                {trend}
              </motion.span>
            ))}
          </div>
        </section>
      )}

      {/* Digital Metrics */}
      {scene && (
        <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <SectionHeader icon={Wifi} label="Digital Landscape" />

          <div className="glass-panel rounded-xl p-5 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted">Digital Presence</span>
                <span className="font-mono text-accent">{scene.digitalPresence}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scene.digitalPresence}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-accent to-pink-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" /> E-commerce
                </span>
                <span className="font-mono text-blue-400">{scene.ecommercePenetration}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scene.ecommercePenetration}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Notable Events */}
      {scene?.notableEvents && scene.notableEvents.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <SectionHeader icon={Award} label="Notable Events" />

          <div className="space-y-2.5">
            {scene.notableEvents.map(event => (
              <div key={event} className="flex items-start gap-3 text-sm text-muted group">
                {/* Accent gradient dot */}
                <div className={cn(
                  'w-2 h-2 mt-1.5 rounded-full shrink-0',
                  'bg-gradient-to-br from-accent to-pink-500',
                  'shadow-[0_0_6px_rgba(233,69,96,0.3)]'
                )} />
                <span className="group-hover:text-foreground transition-colors duration-200">
                  {event}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ContemporarySkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="glass-panel rounded-xl p-4 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
