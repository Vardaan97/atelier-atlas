'use client';

import { motion } from 'framer-motion';
import { CloudSun, Droplets, Thermometer, Globe2, Leaf, Sparkles, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { EventsInline } from './FashionCalendar';
import { useEvents } from '@/hooks/useEvents';
import type { CountryBase, CountryProfile } from '@/types/country';

interface CultureClimateTabProps {
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

/* Color-coded top border for climate stat cards */
const climateStat = {
  zone:     { icon: CloudSun,    color: 'border-t-blue-400',   iconColor: 'text-blue-400'   },
  temp:     { icon: Thermometer, color: 'border-t-orange-400', iconColor: 'text-orange-400' },
  humidity: { icon: Droplets,    color: 'border-t-cyan-400',   iconColor: 'text-cyan-400'   },
} as const;

export function CultureClimateTab({ country, profile, profileLoading }: CultureClimateTabProps) {
  const { events, loading: eventsLoading } = useEvents(country.iso);

  if (profileLoading) {
    return <CultureSkeleton />;
  }

  const climate = profile?.climate;
  const influences = profile?.culturalInfluences;
  const score = country.sustainabilityScore;

  return (
    <div className="space-y-6">
      {/* Climate Section */}
      {climate ? (
        <section className="animate-fade-in-up">
          <SectionHeader icon={CloudSun} label="Climate & Fashion" />

          <div className="glass-panel rounded-xl p-5">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Zone */}
              <div className={cn(
                'text-center rounded-lg bg-white/[0.03] p-3 border-t-2',
                climateStat.zone.color
              )}>
                <CloudSun className={cn('w-5 h-5 mx-auto mb-1.5', climateStat.zone.iconColor)} />
                <p className="text-xs font-medium">{climate.zone}</p>
                <p className="text-[10px] text-muted mt-0.5">Climate Zone</p>
              </div>
              {/* Temp */}
              <div className={cn(
                'text-center rounded-lg bg-white/[0.03] p-3 border-t-2',
                climateStat.temp.color
              )}>
                <Thermometer className={cn('w-5 h-5 mx-auto mb-1.5', climateStat.temp.iconColor)} />
                <p className="text-xs font-medium">{climate.avgTemp}°C</p>
                <p className="text-[10px] text-muted mt-0.5">Avg Temp</p>
              </div>
              {/* Humidity */}
              <div className={cn(
                'text-center rounded-lg bg-white/[0.03] p-3 border-t-2',
                climateStat.humidity.color
              )}>
                <Droplets className={cn('w-5 h-5 mx-auto mb-1.5', climateStat.humidity.iconColor)} />
                <p className="text-xs font-medium">{climate.humidity}</p>
                <p className="text-[10px] text-muted mt-0.5">Humidity</p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <p className="text-sm text-muted leading-relaxed">
                {climate.fashionImplication}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="animate-fade-in-up">
          <SectionHeader icon={CloudSun} label="Climate" />
          <div className="glass-panel rounded-xl p-5 text-center">
            <CloudSun className="w-8 h-8 text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">Climate analysis requires AI profile</p>
          </div>
        </section>
      )}

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Cultural Influences */}
      {influences && influences.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <SectionHeader icon={Globe2} label="Cultural Influences" />

          <div className="flex flex-wrap gap-2">
            {influences.map((influence, i) => (
              <motion.span
                key={influence}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={cn(
                  'px-3 py-1.5 rounded-full glass-panel text-xs font-medium',
                  'border border-white/5 hover:border-accent/30',
                  'hover:shadow-[0_0_12px_rgba(233,69,96,0.15)]',
                  'transition-all duration-300 cursor-default'
                )}
              >
                {influence}
              </motion.span>
            ))}
          </div>
        </section>
      )}

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Fashion Events */}
      <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="relative flex items-center gap-2 mb-4 pb-2">
          <Calendar className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
            Fashion Events
          </h3>
          {events.length > 0 && (
            <span className="ml-auto text-[10px] font-mono text-accent">{events.length} event{events.length !== 1 ? 's' : ''}</span>
          )}
          <div className="absolute bottom-0 left-0 w-12 h-[2px] bg-gradient-to-r from-accent to-transparent" />
        </div>
        <EventsInline events={events} loading={eventsLoading} countryName={country.name} />
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Sustainability */}
      <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <SectionHeader icon={Leaf} label="Sustainability" />

        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm">Sustainability Score</span>
            <span className={cn(
              'text-lg font-mono font-bold',
              score >= 60 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
            )}>
              {score}/100
            </span>
          </div>
          <div className="relative w-full h-3 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full rounded-full relative"
              style={{
                background: score >= 60
                  ? 'linear-gradient(90deg, #00C48C, #00E5A0)'
                  : score >= 40
                  ? 'linear-gradient(90deg, #FFB800, #FFD000)'
                  : 'linear-gradient(90deg, #FF4757, #FF6B7A)',
              }}
            >
              {/* Percentage label inside bar when wide enough */}
              {score >= 25 && (
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-white/90 drop-shadow-sm">
                  {score}%
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Regional Context */}
      <section className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <SectionHeader icon={Sparkles} label="Regional Context" />

        <div className="glass-panel rounded-xl p-5">
          <div className="divide-y divide-white/[0.06]">
            <div className="flex justify-between text-sm py-2.5 first:pt-0 hover:bg-white/[0.02] -mx-2 px-2 rounded transition-colors duration-200">
              <span className="text-muted">Region</span>
              <span>{country.region}</span>
            </div>
            <div className="flex justify-between text-sm py-2.5 hover:bg-white/[0.02] -mx-2 px-2 rounded transition-colors duration-200">
              <span className="text-muted">Sub-region</span>
              <span>{country.subregion}</span>
            </div>
            {country.primaryFabrics.length > 0 && (
              <div className="flex justify-between text-sm py-2.5 last:pb-0 hover:bg-white/[0.02] -mx-2 px-2 rounded transition-colors duration-200">
                <span className="text-muted">Primary Fabrics</span>
                <span className="text-right max-w-[60%]">{country.primaryFabrics.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function CultureSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="w-5 h-5 mx-auto rounded" />
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    </div>
  );
}
