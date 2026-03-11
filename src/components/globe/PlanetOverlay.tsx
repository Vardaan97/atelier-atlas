'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Globe2, Thermometer, Clock, Ruler, MoonStar, Sparkles } from 'lucide-react';
import type { PlanetInfo } from './spaceBackground';

interface PlanetOverlayProps {
  planet: PlanetInfo | null;
  onReturn: () => void;
}

export function PlanetOverlay({ planet, onReturn }: PlanetOverlayProps) {
  return (
    <AnimatePresence>
      {planet && (
        <>
          {/* Top bar: Return to Earth */}
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            onClick={onReturn}
            className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl
              bg-black/60 backdrop-blur-xl border border-white/10
              hover:bg-white/10 hover:border-accent/30 transition-all
              text-sm font-medium text-white/90 group"
          >
            <ArrowLeft className="w-4 h-4 text-accent group-hover:-translate-x-0.5 transition-transform" />
            Return to Earth
          </motion.button>

          {/* Planet info card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.15 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-lg"
          >
            <div className="bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${planet.color}dd, ${planet.color}44)`,
                    boxShadow: `0 0 20px ${planet.color}33`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold tracking-tight">{planet.name}</h2>
                  <p className="text-xs text-muted font-mono">{planet.distFromSun}</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 border border-accent/20">
                  <Sparkles className="w-3 h-3 text-accent" />
                  <span className="text-[10px] text-accent font-mono">EASTER EGG</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <StatPill icon={<Ruler className="w-3.5 h-3.5" />} label="Diameter" value={planet.diameter} />
                <StatPill icon={<Thermometer className="w-3.5 h-3.5" />} label="Temperature" value={planet.temperature} />
                <StatPill icon={<Clock className="w-3.5 h-3.5" />} label="Day Length" value={planet.dayLength} />
                <StatPill icon={<Globe2 className="w-3.5 h-3.5" />} label="Year Length" value={planet.yearLength} />
                {planet.moonCount > 0 && (
                  <StatPill
                    icon={<MoonStar className="w-3.5 h-3.5" />}
                    label="Known Moons"
                    value={planet.moonCount.toString()}
                  />
                )}
              </div>

              {/* Fun fact */}
              <div className="rounded-xl bg-white/5 border border-white/5 px-4 py-3">
                <p className="text-xs text-white/60 uppercase tracking-wider mb-1 font-mono">Did you know?</p>
                <p className="text-sm text-white/80 leading-relaxed">{planet.funFact}</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
      <span className="text-muted shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] text-muted uppercase tracking-wider">{label}</div>
        <div className="text-xs font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
