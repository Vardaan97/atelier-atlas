'use client';

import { useState, useMemo } from 'react';
import { Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FashionEvent } from '@/types/api';

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'fashion-week': { bg: 'bg-accent/15', text: 'text-accent', dot: 'bg-accent' },
  'trade-show': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  'jewelry-show': { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
};

const TYPE_LABELS: Record<string, string> = {
  'fashion-week': 'Fashion Week',
  'trade-show': 'Trade Show',
  'jewelry-show': 'Jewelry Show',
};

const TIER_BADGE: Record<string, { className: string; label: string }> = {
  A: { className: 'bg-accent/20 text-accent', label: 'Tier A' },
  B: { className: 'bg-secondary/40 text-blue-300', label: 'Tier B' },
  C: { className: 'bg-white/10 text-muted', label: 'Tier C' },
};

interface FashionCalendarProps {
  events: FashionEvent[];
  className?: string;
}

export function FashionCalendar({ events, className }: FashionCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FashionEvent | null>(null);

  // Build a map: month index -> events
  const monthEvents = useMemo(() => {
    const map = new Map<number, FashionEvent[]>();
    for (const event of events) {
      for (const month of event.months) {
        const idx = MONTHS.indexOf(month);
        if (idx >= 0) {
          const existing = map.get(idx) || [];
          // Avoid duplicates
          if (!existing.find((e) => e.name === event.name)) {
            existing.push(event);
          }
          map.set(idx, existing);
        }
      }
    }
    return map;
  }, [events]);

  const selectedMonthEvents = useMemo(() => {
    if (selectedMonth === null) return [];
    return monthEvents.get(selectedMonth) || [];
  }, [selectedMonth, monthEvents]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Month Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {MONTH_LABELS.map((label, idx) => {
          const evts = monthEvents.get(idx) || [];
          const isSelected = selectedMonth === idx;
          const hasEvents = evts.length > 0;

          // Collect unique event types for dots
          const types = [...new Set(evts.map((e) => e.type))];

          return (
            <button
              key={label}
              onClick={() => setSelectedMonth(isSelected ? null : idx)}
              className={cn(
                'relative rounded-lg px-2 py-2 text-center transition-all text-xs font-medium',
                isSelected
                  ? 'bg-accent/20 text-accent ring-1 ring-accent/40'
                  : hasEvents
                    ? 'bg-white/5 hover:bg-white/10 text-foreground'
                    : 'bg-white/[0.02] text-muted/40 cursor-default'
              )}
              disabled={!hasEvents}
            >
              <span>{label}</span>
              {/* Event type dots */}
              {types.length > 0 && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {types.map((t) => (
                    <span
                      key={t}
                      className={cn('w-1.5 h-1.5 rounded-full', TYPE_COLORS[t]?.dot || 'bg-white/30')}
                    />
                  ))}
                </div>
              )}
              {/* Event count badge */}
              {evts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent/80 text-[9px] font-bold flex items-center justify-center text-white">
                  {evts.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-muted">
        {Object.entries(TYPE_COLORS).map(([type, colors]) => (
          <span key={type} className="flex items-center gap-1">
            <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
            {TYPE_LABELS[type]}
          </span>
        ))}
      </div>

      {/* Selected month events list */}
      {selectedMonth !== null && (
        <div className="space-y-2 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted uppercase tracking-wider">
              {MONTH_LABELS[selectedMonth]} Events ({selectedMonthEvents.length})
            </h4>
            <button
              onClick={() => { setSelectedMonth(null); setSelectedEvent(null); }}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-3 h-3 text-muted" />
            </button>
          </div>

          {selectedMonthEvents.map((event) => {
            const typeStyle = TYPE_COLORS[event.type];
            const tierStyle = TIER_BADGE[event.tier];
            const isExpanded = selectedEvent?.name === event.name;

            return (
              <button
                key={event.name}
                onClick={() => setSelectedEvent(isExpanded ? null : event)}
                className={cn(
                  'w-full text-left rounded-lg p-3 transition-all',
                  isExpanded
                    ? 'glass-panel ring-1 ring-white/10'
                    : 'bg-white/[0.03] hover:bg-white/[0.06]'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.name}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {event.city}, est. {event.established}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', typeStyle?.bg, typeStyle?.text)}>
                      {TYPE_LABELS[event.type]}
                    </span>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', tierStyle?.className)}>
                      {tierStyle?.label}
                    </span>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-fade-in-up">
                    <p className="text-xs text-muted leading-relaxed">{event.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted">Designers/Exhibitors</span>
                        <p className="font-mono font-semibold">{event.designers.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted">Attendance</span>
                        <p className="font-mono font-semibold">{event.attendance.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {event.months.map((m) => (
                        <span key={m} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-muted capitalize">
                          {m.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Compact inline list for showing a country's events inside other tabs */
interface EventsInlineProps {
  events: FashionEvent[];
  loading?: boolean;
  countryName?: string;
}

export function EventsInline({ events, loading, countryName }: EventsInlineProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-5 text-center">
        <Calendar className="w-8 h-8 text-muted/30 mx-auto mb-2" />
        <p className="text-sm text-muted">No major fashion events in {countryName || 'this country'}</p>
        <p className="text-[10px] text-muted/60 mt-1">Check nearby fashion capitals for regional events</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const typeStyle = TYPE_COLORS[event.type];
        const tierStyle = TIER_BADGE[event.tier];
        const isExpanded = expanded === event.name;

        return (
          <button
            key={event.name}
            onClick={() => setExpanded(isExpanded ? null : event.name)}
            className={cn(
              'w-full text-left rounded-lg p-3 transition-all',
              isExpanded
                ? 'glass-panel ring-1 ring-white/10'
                : 'bg-white/[0.03] hover:bg-white/[0.06]'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted">{event.city}</span>
                  <span className="text-[10px] text-muted/40">|</span>
                  <span className="text-[10px] text-muted capitalize">
                    {event.months.map((m) => m.slice(0, 3)).join(', ')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', typeStyle?.bg, typeStyle?.text)}>
                  {TYPE_LABELS[event.type]}
                </span>
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', tierStyle?.className)}>
                  {tierStyle?.label}
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-fade-in-up">
                <p className="text-xs text-muted leading-relaxed">{event.description}</p>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted">Exhibitors</span>
                    <p className="font-mono font-semibold">{event.designers.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted">Attendance</span>
                    <p className="font-mono font-semibold">{event.attendance.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted">Est.</span>
                    <p className="font-mono font-semibold">{event.established}</p>
                  </div>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
