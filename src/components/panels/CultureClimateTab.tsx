'use client';

import { CloudSun, Droplets, Thermometer, Globe2, Leaf, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CountryBase, CountryProfile } from '@/types/country';

interface CultureClimateTabProps {
  country: CountryBase;
  profile: CountryProfile | null;
  profileLoading: boolean;
}

export function CultureClimateTab({ country, profile, profileLoading }: CultureClimateTabProps) {
  if (profileLoading) {
    return <CultureSkeleton />;
  }

  const climate = profile?.climate;
  const influences = profile?.culturalInfluences;

  return (
    <div className="space-y-6">
      {/* Climate Section */}
      {climate ? (
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <CloudSun className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Climate & Fashion
            </h3>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <CloudSun className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xs font-medium">{climate.zone}</p>
                <p className="text-[10px] text-muted">Climate Zone</p>
              </div>
              <div className="text-center">
                <Thermometer className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <p className="text-xs font-medium">{climate.avgTemp}°C</p>
                <p className="text-[10px] text-muted">Avg Temp</p>
              </div>
              <div className="text-center">
                <Droplets className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-xs font-medium">{climate.humidity}</p>
                <p className="text-[10px] text-muted">Humidity</p>
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
          <div className="flex items-center gap-2 mb-4">
            <CloudSun className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Climate
            </h3>
          </div>
          <div className="glass-panel rounded-xl p-5 text-center">
            <CloudSun className="w-8 h-8 text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">Climate analysis requires AI profile</p>
          </div>
        </section>
      )}

      {/* Cultural Influences */}
      {influences && influences.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Cultural Influences
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {influences.map((influence, i) => (
              <span
                key={influence}
                className="px-3 py-1.5 rounded-full glass-panel text-xs font-medium animate-fade-in-up"
                style={{ animationDelay: `${150 + i * 50}ms` }}
              >
                {influence}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Sustainability */}
      <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
            Sustainability
          </h3>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm">Sustainability Score</span>
            <span className="text-lg font-mono font-bold text-green-400">
              {country.sustainabilityScore}/100
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${country.sustainabilityScore}%`,
                background: country.sustainabilityScore >= 60
                  ? 'linear-gradient(90deg, #00C48C, #00E5A0)'
                  : country.sustainabilityScore >= 40
                  ? 'linear-gradient(90deg, #FFB800, #FFD000)'
                  : 'linear-gradient(90deg, #FF4757, #FF6B7A)',
              }}
            />
          </div>
        </div>
      </section>

      {/* Regional Context */}
      <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
            Regional Context
          </h3>
        </div>

        <div className="glass-panel rounded-xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Region</span>
            <span>{country.region}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Sub-region</span>
            <span>{country.subregion}</span>
          </div>
          {country.primaryFabrics.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted">Primary Fabrics</span>
              <span className="text-right max-w-[60%]">{country.primaryFabrics.join(', ')}</span>
            </div>
          )}
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
