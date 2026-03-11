'use client';

import { useCallback } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobeStore } from '@/store/useGlobeStore';

const FASHION_ERAS = [
  { id: 'ancient', label: 'Ancient', yearRange: [-3000, 500] },
  { id: 'medieval', label: 'Medieval', yearRange: [500, 1500] },
  { id: 'renaissance', label: 'Renaissance', yearRange: [1500, 1700] },
  { id: 'colonial', label: 'Colonial', yearRange: [1700, 1900] },
  { id: 'modern', label: 'Modern', yearRange: [1900, 1960] },
  { id: 'contemporary', label: 'Contemporary', yearRange: [1960, 2000] },
  { id: 'current', label: 'Current', yearRange: [2000, 2026] },
] as const;

function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  return `${year}`;
}

interface TimelineSliderProps {
  className?: string;
}

export function TimelineSlider({ className }: TimelineSliderProps) {
  const activeEra = useGlobeStore((s) => s.activeEra);
  const setActiveEra = useGlobeStore((s) => s.setActiveEra);

  const activeIndex = FASHION_ERAS.findIndex((e) => e.id === activeEra);

  const handlePrev = useCallback(() => {
    if (activeEra === null) {
      // From "All Eras", go to last era
      setActiveEra(FASHION_ERAS[FASHION_ERAS.length - 1].id);
    } else if (activeIndex === 0) {
      // From first era, go to "All Eras"
      setActiveEra(null);
    } else {
      setActiveEra(FASHION_ERAS[activeIndex - 1].id);
    }
  }, [activeEra, activeIndex, setActiveEra]);

  const handleNext = useCallback(() => {
    if (activeEra === null) {
      // From "All Eras", go to first era
      setActiveEra(FASHION_ERAS[0].id);
    } else if (activeIndex === FASHION_ERAS.length - 1) {
      // From last era, go to "All Eras"
      setActiveEra(null);
    } else {
      setActiveEra(FASHION_ERAS[activeIndex + 1].id);
    }
  }, [activeEra, activeIndex, setActiveEra]);

  const selectedEra = activeEra
    ? FASHION_ERAS.find((e) => e.id === activeEra)
    : null;

  return (
    <div
      className={cn(
        'absolute bottom-14 md:bottom-12 left-1/2 -translate-x-1/2 z-20',
        'bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl',
        'px-2 md:px-3 py-1.5 md:py-2 flex items-center gap-1 md:gap-1.5',
        'transition-all duration-300',
        'max-w-[92vw] overflow-x-auto scrollbar-hide',
        className
      )}
    >
      {/* Prev button */}
      <button
        onClick={handlePrev}
        className={cn(
          'p-1 rounded-lg transition-colors duration-200',
          'text-[#8B8FA3] hover:text-[#F0F0F5] hover:bg-white/10'
        )}
        aria-label="Previous era"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {/* "All Eras" marker */}
      <button
        onClick={() => setActiveEra(null)}
        className={cn(
          'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg',
          'transition-all duration-300 cursor-pointer group',
          activeEra === null
            ? 'bg-[#E94560]/15'
            : 'hover:bg-white/5'
        )}
        aria-label="All eras"
        aria-pressed={activeEra === null}
      >
        <Clock
          className={cn(
            'w-3 h-3 transition-colors duration-300',
            activeEra === null ? 'text-[#E94560]' : 'text-[#8B8FA3] group-hover:text-[#F0F0F5]'
          )}
        />
        <span
          className={cn(
            'text-[10px] font-mono leading-none transition-colors duration-300',
            activeEra === null ? 'text-[#E94560] font-semibold' : 'text-[#8B8FA3] group-hover:text-[#F0F0F5]'
          )}
        >
          ALL
        </span>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10 mx-0.5" />

      {/* Era markers */}
      {FASHION_ERAS.map((era, index) => {
        const isActive = activeEra === era.id;
        const isBeforeActive =
          activeEra !== null && activeIndex > index;

        return (
          <button
            key={era.id}
            onClick={() => setActiveEra(era.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg',
              'transition-all duration-300 cursor-pointer group relative'
            )}
            aria-label={`${era.label} era (${formatYear(era.yearRange[0])} - ${formatYear(era.yearRange[1])})`}
            aria-pressed={isActive}
          >
            {/* Dot */}
            <div className="relative flex items-center justify-center">
              <div
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  isActive
                    ? 'bg-[#E94560] shadow-[0_0_8px_rgba(233,69,96,0.6)]'
                    : isBeforeActive
                      ? 'bg-[#E94560]/40'
                      : 'bg-[#8B8FA3]/40 group-hover:bg-[#8B8FA3]/80'
                )}
              />
              {isActive && (
                <div className="absolute w-4 h-4 rounded-full border border-[#E94560]/40 animate-ping" />
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                'text-[11px] font-mono leading-none whitespace-nowrap transition-colors duration-300',
                isActive
                  ? 'text-[#E94560] font-semibold'
                  : 'text-[#8B8FA3] group-hover:text-[#F0F0F5]'
              )}
            >
              {era.label}
            </span>

            {/* Connecting line to next dot */}
            {index < FASHION_ERAS.length - 1 && (
              <div
                className={cn(
                  'absolute top-[13px] -right-[5px] w-[10px] h-px',
                  'transition-colors duration-300',
                  isBeforeActive || isActive
                    ? 'bg-[#E94560]/30'
                    : 'bg-white/10'
                )}
              />
            )}
          </button>
        );
      })}

      {/* Next button */}
      <button
        onClick={handleNext}
        className={cn(
          'p-1 rounded-lg transition-colors duration-200',
          'text-[#8B8FA3] hover:text-[#F0F0F5] hover:bg-white/10'
        )}
        aria-label="Next era"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      {/* Year range tooltip */}
      {selectedEra && (
        <div
          className={cn(
            'absolute -top-8 left-1/2 -translate-x-1/2',
            'bg-[#0A0A1A]/90 backdrop-blur-sm border border-white/10 rounded-md',
            'px-2.5 py-1 pointer-events-none',
            'animate-in fade-in-0 slide-in-from-bottom-1 duration-200'
          )}
        >
          <span className="text-[10px] font-mono text-[#F0F0F5] whitespace-nowrap">
            {formatYear(selectedEra.yearRange[0])} — {formatYear(selectedEra.yearRange[1])}
          </span>
        </div>
      )}
    </div>
  );
}
