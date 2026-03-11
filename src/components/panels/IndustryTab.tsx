'use client';

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Leaf,
  BarChart3,
  Scale,
  Newspaper,
  ExternalLink,
  Loader2,
  Globe2,
  Factory,
  Briefcase,
  ArrowLeftRight,
} from 'lucide-react';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { useTradeData } from '@/hooks/useTradeData';
import { useWorldBank } from '@/hooks/useWorldBank';
import { useFashionNews } from '@/hooks/useFashionNews';
import type { CountryBase } from '@/types/country';
import type { TradeProduct, YearlyTrade } from '@/types/api';

interface IndustryTabProps {
  country: CountryBase;
}

/* ─── Skeleton loader ─── */
function TradeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="glass-panel rounded-xl p-4">
        <div className="h-4 w-32 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-3 w-24 bg-white/10 rounded" />
              <div className="flex gap-4">
                <div className="h-3 w-16 bg-white/10 rounded" />
                <div className="h-3 w-16 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-panel rounded-xl p-4">
        <div className="h-4 w-28 bg-white/10 rounded mb-4" />
        <div className="h-24 bg-white/10 rounded" />
      </div>
    </div>
  );
}

/* ─── Mini bar chart for yearly trends ─── */
function YearlyTrendChart({ trend }: { trend: YearlyTrade[] }) {
  const maxVal = Math.max(...trend.flatMap((t) => [t.exports, t.imports]), 1);

  return (
    <div className="flex items-end gap-2 h-28">
      {trend.map((t) => {
        const exportH = Math.max((t.exports / maxVal) * 100, 4);
        const importH = Math.max((t.imports / maxVal) * 100, 4);
        return (
          <div key={t.year} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 w-full justify-center h-24">
              <div
                className="w-2.5 rounded-t bg-green-400/80 transition-all duration-500"
                style={{ height: `${exportH}%` }}
                title={`Exports: ${formatCurrency(t.exports)}`}
              />
              <div
                className="w-2.5 rounded-t bg-red-400/60 transition-all duration-500"
                style={{ height: `${importH}%` }}
                title={`Imports: ${formatCurrency(t.imports)}`}
              />
            </div>
            <span className="text-[9px] text-muted font-mono">
              {String(t.year).slice(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Trade products table ─── */
function TradeProductTable({ products }: { products: TradeProduct[] }) {
  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="flex items-center text-[9px] text-muted uppercase tracking-wider px-2 pb-1">
        <span className="flex-1">Product</span>
        <span className="w-20 text-right">Exports</span>
        <span className="w-20 text-right">Imports</span>
      </div>
      {/* Rows */}
      {products.map((p, i) => {
        const total = p.exports + p.imports;
        const exportPct = total > 0 ? (p.exports / total) * 100 : 50;
        return (
          <div
            key={p.hsCode}
            className="flex items-center rounded-lg px-2 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium truncate block">{p.name}</span>
              <span className="text-[9px] text-muted font-mono">HS {p.hsCode}</span>
            </div>
            <span className="w-20 text-right text-xs font-mono text-green-400">
              {formatCurrency(p.exports)}
            </span>
            <span className="w-20 text-right text-xs font-mono text-red-400">
              {formatCurrency(p.imports)}
            </span>
            {/* Mini balance bar */}
            <div className="w-12 ml-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-400/70"
                style={{ width: `${exportPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Trade data section (fetched from API) ─── */
function TradeDataSection({ iso }: { iso: string }) {
  const { data, loading, error } = useTradeData(iso);

  if (loading) return <TradeSkeleton />;

  if (error || !data) {
    return (
      <div className="glass-panel rounded-xl p-4 text-center">
        <BarChart3 className="w-6 h-6 text-muted/40 mx-auto mb-2" />
        <p className="text-xs text-muted">
          {error || 'Trade data unavailable'}
        </p>
      </div>
    );
  }

  const isPositive = data.tradeBalance >= 0;

  return (
    <div className="space-y-4">
      {/* Trade Balance Indicator */}
      <div
        className="glass-panel rounded-xl p-4 animate-fade-in-up"
        style={{ animationDelay: '450ms' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-muted uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" />
            Trade Balance ({data.year})
          </h4>
          <span
            className={cn(
              'text-xs font-mono font-bold px-2 py-0.5 rounded-full',
              isPositive
                ? 'text-green-400 bg-green-400/10'
                : 'text-red-400 bg-red-400/10'
            )}
          >
            {isPositive ? '+' : ''}
            {formatCurrency(data.tradeBalance)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 rounded-lg bg-green-400/5 border border-green-400/10">
            <p className="text-[9px] text-muted uppercase tracking-wider mb-1">
              Total Exports
            </p>
            <p className="text-sm font-mono font-bold text-green-400">
              {formatCurrency(data.totalExports)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-400/5 border border-red-400/10">
            <p className="text-[9px] text-muted uppercase tracking-wider mb-1">
              Total Imports
            </p>
            <p className="text-sm font-mono font-bold text-red-400">
              {formatCurrency(data.totalImports)}
            </p>
          </div>
        </div>
      </div>

      {/* Product Breakdown Table */}
      <div
        className="glass-panel rounded-xl p-4 animate-fade-in-up"
        style={{ animationDelay: '550ms' }}
      >
        <h4 className="text-sm font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Package className="w-3.5 h-3.5" />
          Product Breakdown
        </h4>
        <TradeProductTable products={data.topProducts} />
      </div>

      {/* 5-Year Trend */}
      {data.yearlyTrend.length > 0 && (
        <div
          className="glass-panel rounded-xl p-4 animate-fade-in-up"
          style={{ animationDelay: '650ms' }}
        >
          <h4 className="text-sm font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            5-Year Trend
          </h4>
          <YearlyTrendChart trend={data.yearlyTrend} />
          <div className="flex items-center justify-center gap-4 mt-2 text-[9px] text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-green-400/80" />
              Exports
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-red-400/60" />
              Imports
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Time ago helper ─── */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

/* ─── Fashion News Section (fetched from GDELT) ─── */
function FashionNewsSection({ iso }: { iso: string }) {
  const { articles, loading, error } = useFashionNews(iso, 8);

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-4 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 text-accent animate-spin" />
        <span className="text-xs text-muted">Loading fashion news...</span>
      </div>
    );
  }

  if (error || articles.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-4 text-center">
        <Newspaper className="w-6 h-6 text-muted/40 mx-auto mb-2" />
        <p className="text-xs text-muted">
          No recent fashion news found for this country
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {articles.slice(0, 5).map((article, i) => (
        <a
          key={`${article.url}-${i}`}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] p-3 transition-colors group animate-fade-in-up"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* Thumbnail */}
          {article.image && (
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white/5">
              <img
                src={article.image}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
              {article.title}
            </h5>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[9px] text-muted font-mono uppercase truncate max-w-[120px]">
                {article.source}
              </span>
              <span className="text-[9px] text-muted/60">
                {timeAgo(article.date)}
              </span>
              <ExternalLink className="w-2.5 h-2.5 text-muted/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

/* ─── Skeleton for World Bank section ─── */
function EconomicSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-white/[0.03] p-3">
            <div className="h-3 w-20 bg-white/10 rounded mb-2" />
            <div className="h-5 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white/[0.03] p-3">
        <div className="h-3 w-32 bg-white/10 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-2 bg-white/10 rounded-full w-full" />
          <div className="h-2 bg-white/10 rounded-full w-3/4" />
        </div>
      </div>
    </div>
  );
}

/* ─── Helper: format percentage with bar ─── */
function PercentBar({
  label,
  value,
  year,
  color = 'bg-accent',
  icon: Icon,
}: {
  label: string;
  value: number;
  year: number;
  color?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  // Clamp display to 0-100 range
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3 h-3 text-muted" />
          <span className="text-[10px] text-muted uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-mono font-bold">{value.toFixed(1)}%</span>
          <span className="text-[9px] text-muted font-mono">({year})</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Economic Profile (World Bank data) ─── */
function EconomicProfileSection({ iso }: { iso: string }) {
  const { data, loading, error } = useWorldBank(iso);

  if (loading) return <EconomicSkeleton />;

  if (error || !data) {
    return (
      <div className="glass-panel rounded-xl p-4 text-center">
        <Globe2 className="w-6 h-6 text-muted/40 mx-auto mb-2" />
        <p className="text-xs text-muted">
          {error || 'Economic data unavailable'}
        </p>
      </div>
    );
  }

  // Check if we actually have any data
  const hasAnyData = data.gdp || data.population || data.manufacturingPct ||
    data.industryEmploymentPct || data.exportsGoodsPct;

  if (!hasAnyData) {
    return (
      <div className="glass-panel rounded-xl p-4 text-center">
        <Globe2 className="w-6 h-6 text-muted/40 mx-auto mb-2" />
        <p className="text-xs text-muted">No economic data available from World Bank</p>
      </div>
    );
  }

  // Build stat cards for GDP, Population, Labor Force
  const topStats: {
    label: string;
    value: string;
    year: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }[] = [];

  if (data.gdp?.value) {
    topStats.push({
      label: 'GDP',
      value: formatCurrency(data.gdp.value),
      year: data.gdp.year,
      icon: DollarSign,
      color: 'text-accent',
    });
  }

  if (data.population?.value) {
    topStats.push({
      label: 'Population',
      value: formatNumber(data.population.value),
      year: data.population.year,
      icon: Users,
      color: 'text-blue-400',
    });
  }

  if (data.laborForce?.value) {
    topStats.push({
      label: 'Labor Force',
      value: formatNumber(data.laborForce.value),
      year: data.laborForce.year,
      icon: Briefcase,
      color: 'text-purple-400',
    });
  }

  if (data.exportsGoodsPct?.value) {
    topStats.push({
      label: 'Exports (% GDP)',
      value: `${data.exportsGoodsPct.value.toFixed(1)}%`,
      year: data.exportsGoodsPct.year,
      icon: ArrowLeftRight,
      color: 'text-green-400',
    });
  }

  // Compute export/import balance if both available
  const hasBalance = data.manufacturesExportsPct?.value != null && data.manufacturesImportsPct?.value != null;

  return (
    <div className="space-y-4">
      {/* Top stat cards */}
      {topStats.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {topStats.map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white/[0.03] border border-white/5 p-3 animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
                <span className="text-[10px] text-muted uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <div className={cn('text-lg font-mono font-bold', stat.color)}>
                {stat.value}
              </div>
              <span className="text-[9px] text-muted font-mono">{stat.year}</span>
            </div>
          ))}
        </div>
      )}

      {/* Percentage bars */}
      <div
        className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-4 animate-fade-in-up"
        style={{ animationDelay: '200ms' }}
      >
        {data.manufacturingPct?.value != null && (
          <PercentBar
            label="Manufacturing (% GDP)"
            value={data.manufacturingPct.value}
            year={data.manufacturingPct.year}
            color="bg-accent/80"
            icon={Factory}
          />
        )}
        {data.industryPct?.value != null && (
          <PercentBar
            label="Industry (% GDP)"
            value={data.industryPct.value}
            year={data.industryPct.year}
            color="bg-blue-400/80"
            icon={Factory}
          />
        )}
        {data.industryEmploymentPct?.value != null && (
          <PercentBar
            label="Industry Employment"
            value={data.industryEmploymentPct.value}
            year={data.industryEmploymentPct.year}
            color="bg-purple-400/80"
            icon={Briefcase}
          />
        )}
      </div>

      {/* Export/Import manufactures balance */}
      {hasBalance && (
        <div
          className="rounded-xl bg-white/[0.03] border border-white/5 p-4 animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <h5 className="text-[10px] text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ArrowLeftRight className="w-3 h-3" />
            Manufactures Trade Composition
          </h5>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 rounded-lg bg-green-400/5 border border-green-400/10">
              <p className="text-[9px] text-muted uppercase tracking-wider mb-1">
                Exports Share
              </p>
              <p className="text-sm font-mono font-bold text-green-400">
                {data.manufacturesExportsPct!.value!.toFixed(1)}%
              </p>
              <p className="text-[9px] text-muted font-mono">
                of merch. ({data.manufacturesExportsPct!.year})
              </p>
            </div>
            <div className="text-center p-2 rounded-lg bg-red-400/5 border border-red-400/10">
              <p className="text-[9px] text-muted uppercase tracking-wider mb-1">
                Imports Share
              </p>
              <p className="text-sm font-mono font-bold text-red-400">
                {data.manufacturesImportsPct!.value!.toFixed(1)}%
              </p>
              <p className="text-[9px] text-muted font-mono">
                of merch. ({data.manufacturesImportsPct!.year})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Attribution */}
      <p className="text-[9px] text-muted/50 text-center font-mono">
        Source: World Bank Open Data
      </p>
    </div>
  );
}

/* ─── Main Industry Tab ─── */
export function IndustryTab({ country }: IndustryTabProps) {
  const stats = country.industryStats;

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <DollarSign className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-muted text-sm">No industry data available</p>
      </div>
    );
  }

  const cards = [
    {
      label: 'Market Size',
      value: formatCurrency(stats.marketSizeUSD * 1e9),
      icon: DollarSign,
      color: 'text-accent',
    },
    {
      label: 'Growth Rate',
      value: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`,
      icon: stats.growthRate >= 0 ? TrendingUp : TrendingDown,
      color: stats.growthRate >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Employment',
      value: `${formatNumber(stats.employmentMillions * 1e6)}`,
      icon: Users,
      color: 'text-blue-400',
    },
    {
      label: 'Sustainability',
      value: `${stats.sustainabilityIndex}/100`,
      icon: Leaf,
      color: stats.sustainabilityIndex >= 60 ? 'text-green-400' : 'text-yellow-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className="glass-panel rounded-xl p-4 animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={cn('w-4 h-4', card.color)} />
              <span className="text-[10px] text-muted uppercase tracking-wider">
                {card.label}
              </span>
            </div>
            <div className={cn('text-xl font-mono font-bold', card.color)}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Trade Overview */}
      <div className="glass-panel rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
        <h4 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">
          Trade Overview
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-green-400" />
              <span className="text-sm">Textile Exports</span>
            </div>
            <span className="font-mono text-sm text-green-400">
              {formatCurrency(stats.textileExportsUSD * 1e9)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
              <span className="text-sm">Textile Imports</span>
            </div>
            <span className="font-mono text-sm text-red-400">
              {formatCurrency(stats.textileImportsUSD * 1e9)}
            </span>
          </div>
          {stats.fashionWeekCity && (
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-sm text-muted">Fashion Week</span>
              <span className="text-sm font-medium">{stats.fashionWeekCity}</span>
            </div>
          )}
        </div>
      </div>

      {/* Trade Partners */}
      {stats.topExportPartners.length > 0 && (
        <div className="glass-panel rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
          <h4 className="text-sm font-medium text-muted uppercase tracking-wider mb-3">
            Top Trade Partners
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                <Package className="w-3 h-3" /> Exports To
              </p>
              <div className="space-y-1">
                {stats.topExportPartners.map((p) => (
                  <div
                    key={p}
                    className="text-xs px-2 py-1 rounded bg-white/5"
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                <Package className="w-3 h-3" /> Imports From
              </p>
              <div className="space-y-1">
                {stats.topImportPartners.map((p) => (
                  <div
                    key={p}
                    className="text-xs px-2 py-1 rounded bg-white/5"
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Economic Profile (World Bank data) */}
      <div className="border-t border-white/10 pt-4">
        <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Globe2 className="w-3.5 h-3.5 text-accent" />
          Economic Profile
        </h4>
        <EconomicProfileSection iso={country.iso} />
      </div>

      {/* Detailed Trade Data (fetched from API) */}
      <div className="border-t border-white/10 pt-4">
        <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-accent" />
          Detailed Trade Intelligence
        </h4>
        <TradeDataSection iso={country.iso} />
      </div>

      {/* Fashion News (fetched from GDELT) */}
      <div className="border-t border-white/10 pt-4">
        <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Newspaper className="w-3.5 h-3.5 text-accent" />
          Latest Fashion News
        </h4>
        <FashionNewsSection iso={country.iso} />
      </div>
    </div>
  );
}
