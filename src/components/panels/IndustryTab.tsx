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
} from 'lucide-react';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
import { useTradeData } from '@/hooks/useTradeData';
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

      {/* Detailed Trade Data (fetched from API) */}
      <div className="border-t border-white/10 pt-4">
        <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-accent" />
          Detailed Trade Intelligence
        </h4>
        <TradeDataSection iso={country.iso} />
      </div>
    </div>
  );
}
