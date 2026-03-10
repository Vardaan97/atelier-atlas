'use client';

import { Calendar, User, TrendingUp, Wifi, ShoppingCart, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CountryBase, CountryProfile } from '@/types/country';

interface ContemporaryTabProps {
  country: CountryBase;
  profile: CountryProfile | null;
  profileLoading: boolean;
}

export function ContemporaryTab({ country, profile, profileLoading }: ContemporaryTabProps) {
  const scene = profile?.contemporaryScene;
  const designers = country.keyDesigners;

  if (profileLoading) {
    return <ContemporarySkeleton />;
  }

  const hasContent = (scene?.fashionWeeks && scene.fashionWeeks.length > 0)
    || country.fashionWeeks.length > 0
    || designers.length > 0
    || (scene?.emergingTrends && scene.emergingTrends.length > 0);

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TrendingUp className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-muted text-sm">No contemporary data available</p>
        <p className="text-muted/50 text-xs mt-1">
          AI profile needed for full contemporary analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fashion Weeks */}
      {((scene?.fashionWeeks && scene.fashionWeeks.length > 0) || country.fashionWeeks.length > 0) && (
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Fashion Weeks
            </h3>
          </div>

          <div className="space-y-2">
            {scene?.fashionWeeks && scene.fashionWeeks.length > 0 ? (
              scene.fashionWeeks.map(fw => (
                <div key={fw.name} className="glass-panel rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{fw.name}</h4>
                      <p className="text-[10px] text-muted">{fw.city} · {fw.month}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
                      fw.tier === 'Big Four' ? 'bg-accent/20 text-accent' :
                      fw.tier === 'Major' ? 'bg-blue-400/20 text-blue-400' :
                      'bg-green-400/20 text-green-400'
                    }`}>
                      {fw.tier}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              country.fashionWeeks.map(fw => (
                <div key={fw} className="glass-panel rounded-xl p-3">
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
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Key Designers
            </h3>
          </div>

          <div className="grid gap-2">
            {designers.map(designer => (
              <div key={designer.name} className="glass-panel glass-panel-hover rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-heading font-semibold">{designer.name}</h4>
                    {designer.brand && (
                      <p className="text-[10px] text-accent font-mono">{designer.brand}</p>
                    )}
                  </div>
                  <div className="text-right">
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
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Emerging Trends
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {scene.emergingTrends.map(trend => (
              <span
                key={trend}
                className="px-3 py-1.5 rounded-full bg-accent/10 text-xs text-accent font-medium"
              >
                {trend}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Digital Metrics */}
      {scene && (
        <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Digital Landscape
            </h3>
          </div>

          <div className="glass-panel rounded-xl p-5 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">Digital Presence</span>
                <span className="font-mono">{scene.digitalPresence}/100</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${scene.digitalPresence}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" /> E-commerce
                </span>
                <span className="font-mono">{scene.ecommercePenetration}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-400 transition-all duration-700"
                  style={{ width: `${scene.ecommercePenetration}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Notable Events */}
      {scene?.notableEvents && scene.notableEvents.length > 0 && (
        <section className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Notable Events
            </h3>
          </div>

          <div className="space-y-2">
            {scene.notableEvents.map(event => (
              <div key={event} className="flex items-center gap-2 text-sm text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                {event}
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
