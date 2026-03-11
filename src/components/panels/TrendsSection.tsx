'use client';

import { useMemo } from 'react';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  Search,
  Crown,
  Loader2,
  AlertCircle,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Sparkline } from '@/components/charts/Sparkline';
import { useTrends } from '@/hooks/useTrends';
import { getGarmentTrendScore } from '@/lib/googletrends';
import { cn } from '@/lib/utils';
import type { TrendsResult, TrendQuery, InterestPoint } from '@/lib/googletrends';

interface TrendsSectionProps {
  countryIso: string;
  className?: string;
}

// ── Color helpers ───────────────────────────────────────────────────────────

function scoreToColor(score: number): string {
  if (score >= 70) return 'text-accent';      // hot
  if (score >= 40) return 'text-amber-400';    // warm
  return 'text-muted';                          // mild
}

function scoreToBg(score: number): string {
  if (score >= 70) return 'bg-accent/15 border-accent/25';
  if (score >= 40) return 'bg-amber-400/10 border-amber-400/20';
  return 'bg-white/5 border-white/10';
}

function typeIcon(type: TrendQuery['type']) {
  if (type === 'breakout') return <Flame className="w-3 h-3 text-accent" />;
  if (type === 'rising') return <ArrowUpRight className="w-3 h-3 text-green-400" />;
  return <Minus className="w-3 h-3 text-muted" />;
}

// ── Subcomponents ───────────────────────────────────────────────────────────

function TrendingNowBadges({ trends }: { trends: TrendQuery[] }) {
  if (trends.length === 0) return null;

  return (
    <section className="animate-fade-in-up">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Trending Now
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {trends.map((trend, i) => (
          <div
            key={`${trend.title}-${i}`}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
              scoreToBg(trend.score),
              scoreToColor(trend.score),
              i === 0 && 'animate-pulse-subtle',
            )}
          >
            {typeIcon(trend.type)}
            <span className="max-w-[140px] truncate">{trend.title}</span>
            {trend.score > 0 && (
              <span className="text-[10px] opacity-70 font-mono">{trend.score}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function GarmentSparklines({
  garmentData,
}: {
  garmentData: Record<string, InterestPoint[]>;
}) {
  const entries = Object.entries(garmentData);
  if (entries.length === 0) return null;

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Garment Interest
        </h3>
        <span className="text-[10px] text-muted/50 font-mono ml-auto">12 months</span>
      </div>

      <div className="space-y-2">
        {entries.map(([garment, points]) => {
          const values = points.map(p => p.value);
          const { trending, direction, score } = getGarmentTrendScore(points);

          return (
            <div
              key={garment}
              className="glass-panel rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{garment}</span>
                  {trending && (
                    <span className="flex items-center gap-0.5 text-[10px] text-accent font-mono">
                      <Flame className="w-3 h-3" />
                      Hot
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {direction === 'up' ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : direction === 'down' ? (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  ) : (
                    <Minus className="w-3 h-3 text-muted" />
                  )}
                  <span className={cn(
                    'text-[10px] font-mono',
                    direction === 'up' ? 'text-green-400' : direction === 'down' ? 'text-red-400' : 'text-muted',
                  )}>
                    {score > 50 ? `+${score - 50}` : score < 50 ? `${score - 50}` : '0'}%
                  </span>
                </div>
              </div>

              <Sparkline
                data={values}
                width={80}
                height={32}
                color={direction === 'up' ? '#00C48C' : direction === 'down' ? '#FF4757' : '#8B8FA3'}
                className="shrink-0"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RisingDesigners({ designers }: { designers: TrendQuery[] }) {
  if (designers.length === 0) return null;

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Rising Designers
        </h3>
      </div>

      <div className="glass-panel rounded-xl divide-y divide-white/5">
        {designers.map((designer, i) => (
          <div
            key={`${designer.title}-${i}`}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span className="text-xs text-muted/50 font-mono w-5 text-right shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">{designer.title}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {typeIcon(designer.type)}
              <span className={cn(
                'text-[10px] font-mono',
                designer.type === 'breakout' ? 'text-accent' :
                designer.type === 'rising' ? 'text-green-400' : 'text-muted',
              )}>
                {designer.type === 'breakout' ? 'Breakout' :
                 designer.type === 'rising' ? 'Rising' : 'Steady'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SearchTrendsChart({
  keywords,
}: {
  keywords: TrendsResult['topKeywords'];
}) {
  // Only show keywords that have data
  const withData = useMemo(
    () => keywords.filter(k => k.data.length > 0),
    [keywords]
  );

  // Merge all keyword time-series into Recharts-friendly format
  // Each data point has { date, keyword1: value, keyword2: value, ... }
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | string>>();

    for (const { keyword, data } of withData) {
      for (const point of data) {
        const existing = dateMap.get(point.date) || { date: point.date };
        existing[keyword] = point.value;
        dateMap.set(point.date, existing);
      }
    }

    return Array.from(dateMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  }, [withData]);

  if (keywords.length === 0 || withData.length === 0) return null;

  const COLORS = ['#E94560', '#3B82F6', '#00C48C', '#FFB800', '#A855F7'];

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Search Trends
        </h3>
      </div>

      <div className="glass-panel rounded-xl p-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          {withData.map((kw, i) => (
            <div key={kw.keyword} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-[10px] text-muted truncate max-w-[100px]">
                {kw.keyword}
              </span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {withData.map((kw, i) => (
                  <linearGradient key={kw.keyword} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#8B8FA3', fontSize: 9 }}
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return d.toLocaleDateString('en', { month: 'short' });
                }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#8B8FA3', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'rgba(10, 10, 26, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#F0F0F5',
                }}
                labelFormatter={(label) => {
                  const d = new Date(String(label));
                  return d.toLocaleDateString('en', { month: 'short', year: 'numeric' });
                }}
              />
              {withData.map((kw, i) => (
                <Area
                  key={kw.keyword}
                  type="monotone"
                  dataKey={kw.keyword}
                  stroke={COLORS[i % COLORS.length]}
                  fill={`url(#grad-${i})`}
                  strokeWidth={1.5}
                  dot={false}
                  animationDuration={800}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function TrendsSection({ countryIso, className }: TrendsSectionProps) {
  const { data, loading, error, refetch } = useTrends(countryIso, 'all');

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
          <span className="text-sm text-muted">Loading trends...</span>
        </div>
        {/* Skeleton badges */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-24 rounded-full bg-white/5 animate-pulse" />
          ))}
        </div>
        {/* Skeleton sparklines */}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-4 w-28 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('glass-panel rounded-xl p-6 text-center', className)}>
        <AlertCircle className="w-8 h-8 text-muted/40 mx-auto mb-2" />
        <p className="text-sm text-muted mb-3">Could not load trends data</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const hasContent =
    data.trendingNow.length > 0 ||
    Object.keys(data.garmentInterest).length > 0 ||
    data.risingDesigners.length > 0 ||
    data.topKeywords.length > 0;

  if (!hasContent) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <Search className="w-8 h-8 text-muted/30 mb-2" />
        <p className="text-sm text-muted">No trend data available for this region</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Source indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] text-accent font-mono uppercase">
            Google Trends
          </span>
        </div>
        <span className="text-[10px] text-muted/50 font-mono">
          {data.source === 'google-trends-api'
            ? 'Live'
            : data.source === 'rss-fallback'
              ? 'RSS feed'
              : 'Estimated'}
        </span>
      </div>

      {/* A. Trending Now badges */}
      <TrendingNowBadges trends={data.trendingNow} />

      {/* B. Garment Interest sparklines */}
      <GarmentSparklines garmentData={data.garmentInterest} />

      {/* C. Rising Designers */}
      <RisingDesigners designers={data.risingDesigners} />

      {/* D. Search Trends area chart */}
      <SearchTrendsChart keywords={data.topKeywords} />
    </div>
  );
}
