'use client';

import {
  Gem,
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  Package,
  BarChart3,
  Crown,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useMetals } from '@/hooks/useMetals';
import { useJewelryTrade } from '@/hooks/useJewelryTrade';
import type { MetalPrice } from '@/lib/metals';
import type { JewelryTradeProduct, TraditionalJewelryData } from '@/types/jewelry';
import traditionalJewelryJson from '@/data/traditional-jewelry.json';

const traditionalJewelry = traditionalJewelryJson as Record<string, TraditionalJewelryData>;

interface JewelrySectionProps {
  iso: string;
}

/* ── Metals Ticker ──────────────────────────────────────────── */

const METAL_CONFIG = [
  { key: 'gold' as const, symbol: 'Au', label: 'Gold', color: 'text-yellow-400', borderColor: 'border-yellow-400/20', bgColor: 'bg-yellow-400/5' },
  { key: 'silver' as const, symbol: 'Ag', label: 'Silver', color: 'text-gray-300', borderColor: 'border-gray-300/20', bgColor: 'bg-gray-300/5' },
  { key: 'platinum' as const, symbol: 'Pt', label: 'Platinum', color: 'text-blue-300', borderColor: 'border-blue-300/20', bgColor: 'bg-blue-300/5' },
  { key: 'palladium' as const, symbol: 'Pd', label: 'Palladium', color: 'text-orange-300', borderColor: 'border-orange-300/20', bgColor: 'bg-orange-300/5' },
] as const;

function MetalCard({
  symbol,
  label,
  metal,
  color,
  borderColor,
  usdInr,
  delay,
}: {
  symbol: string;
  label: string;
  metal: MetalPrice;
  color: string;
  borderColor: string;
  usdInr: number;
  delay: number;
}) {
  const isUp = metal.change24h > 0;
  const isDown = metal.change24h < 0;
  const changeColor = isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-white/30';
  const inrPerGram = metal.pricePerGram * usdInr;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 transition-all duration-200 hover:bg-white/[0.06] group animate-fade-in-up',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Left accent border on hover */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity', borderColor.replace('border-', 'bg-'))} />

      <div className="flex items-start justify-between mb-1.5">
        <div>
          <span className={cn('text-lg font-mono font-bold', color)}>{symbol}</span>
          <span className="text-[9px] text-white/30 font-mono ml-1.5">{label}</span>
        </div>
        <div className={cn('flex items-center gap-0.5 text-[10px] font-mono', changeColor)}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          <span>
            {isUp ? '+' : ''}{metal.changePct.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className={cn('text-base font-mono font-bold', color)}>
        ${metal.pricePerGram.toFixed(2)}<span className="text-[9px] text-white/30 font-normal">/g</span>
      </div>
      <div className="text-[10px] text-white/30 font-mono mt-0.5">
        ₹{inrPerGram.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/g
      </div>
    </div>
  );
}

function MetalsTicker() {
  const { data, loading, error } = useMetals();

  if (loading) {
    return (
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
        <div className="h-4 w-36 bg-white/10 rounded-lg mb-4 animate-pulse" />
        <div className="h-20 bg-white/5 rounded-xl mb-3 animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-mono tracking-[0.15em] uppercase text-white/40 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          Precious Metals
        </h4>
        <span className={cn(
          'flex items-center gap-1.5 text-[9px] font-mono',
          data.source === 'live' ? 'text-emerald-400' : 'text-white/30'
        )}>
          {data.source === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          {data.source === 'live' ? 'LIVE' : 'INDICATIVE'}
        </span>
      </div>

      {/* Gold India Retail highlight banner */}
      <div className="relative overflow-hidden rounded-xl bg-yellow-400/[0.04] border border-yellow-400/10 p-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-yellow-400/60 via-yellow-400/20 to-transparent" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl font-mono font-bold text-yellow-400">Au</span>
              <span className="text-[9px] text-white/40 uppercase tracking-wider font-mono">Gold 24K India · 10g</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-yellow-400">
                ₹{(data.goldIndiaRetail10g ?? Math.round(data.gold.pricePerGram * 10 * data.usdInr * 1.06)).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-white/30 font-mono">incl. duty</span>
            </div>
            <div className="text-[9px] text-white/25 font-mono mt-1">
              Spot: ${data.gold.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[9px] text-white/30 uppercase tracking-wider font-mono block mb-0.5">USD/INR</span>
            <span className="text-lg font-mono font-bold text-blue-400">
              {data.usdInr.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Metal cards grid */}
      <div className="grid grid-cols-2 gap-2">
        {METAL_CONFIG.map((m, i) => (
          <MetalCard
            key={m.key}
            symbol={m.symbol}
            label={m.label}
            metal={data[m.key]}
            color={m.color}
            borderColor={m.borderColor}
            usdInr={data.usdInr}
            delay={i * 50}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Jewelry Trade Product Table ────────────────────────────── */

function JewelryProductTable({ products }: { products: JewelryTradeProduct[] }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center text-[9px] text-muted uppercase tracking-wider px-2 pb-1">
        <span className="flex-1">Product</span>
        <span className="w-20 text-right">Exports</span>
        <span className="w-20 text-right">Imports</span>
      </div>
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

/* ── Jewelry Trade Balance ──────────────────────────────────── */

function JewelryTradeSection({ iso }: { iso: string }) {
  const { data, loading, error } = useJewelryTrade(iso);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="glass-panel rounded-xl p-4">
          <div className="h-4 w-32 bg-white/10 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
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
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel rounded-xl p-4 text-center">
        <BarChart3 className="w-6 h-6 text-muted/40 mx-auto mb-2" />
        <p className="text-xs text-muted">
          {error || 'Jewelry trade data unavailable'}
        </p>
      </div>
    );
  }

  const isPositive = data.tradeBalance >= 0;

  return (
    <div className="space-y-4">
      {/* Balance */}
      <div className="glass-panel rounded-xl p-4 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-muted uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-3.5 h-3.5" />
            Jewelry Trade ({data.year})
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
              Jewelry Exports
            </p>
            <p className="text-sm font-mono font-bold text-green-400">
              {formatCurrency(data.totalExports)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-400/5 border border-red-400/10">
            <p className="text-[9px] text-muted uppercase tracking-wider mb-1">
              Jewelry Imports
            </p>
            <p className="text-sm font-mono font-bold text-red-400">
              {formatCurrency(data.totalImports)}
            </p>
          </div>
        </div>
      </div>

      {/* Product Breakdown */}
      <div className="glass-panel rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h4 className="text-sm font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Package className="w-3.5 h-3.5" />
          Jewelry Products
        </h4>
        <JewelryProductTable products={data.topProducts} />
      </div>

      {/* 5-Year Trend */}
      {data.yearlyTrend.length > 0 && (
        <div className="glass-panel rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <h4 className="text-sm font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            5-Year Trend
          </h4>
          <JewelryTrendChart trend={data.yearlyTrend} />
          <div className="flex items-center justify-center gap-4 mt-2 text-[9px] text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-yellow-400/80" />
              Exports
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-purple-400/60" />
              Imports
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mini bar chart (jewelry-themed colors) ─────────────────── */

function JewelryTrendChart({
  trend,
}: {
  trend: { year: number; exports: number; imports: number }[];
}) {
  const maxVal = Math.max(
    ...trend.flatMap((t) => [t.exports, t.imports]),
    1
  );

  return (
    <div className="flex items-end gap-2 h-28">
      {trend.map((t) => {
        const exportH = Math.max((t.exports / maxVal) * 100, 4);
        const importH = Math.max((t.imports / maxVal) * 100, 4);
        return (
          <div key={t.year} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 w-full justify-center h-24">
              <div
                className="w-2.5 rounded-t bg-yellow-400/80 transition-all duration-500"
                style={{ height: `${exportH}%` }}
                title={`Exports: ${formatCurrency(t.exports)}`}
              />
              <div
                className="w-2.5 rounded-t bg-purple-400/60 transition-all duration-500"
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

/* ── Traditional Jewelry Card ───────────────────────────────── */

function TraditionalJewelryCard({ iso }: { iso: string }) {
  const info = traditionalJewelry[iso];
  if (!info) return null;

  return (
    <div className="glass-panel rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-muted uppercase tracking-wider flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-yellow-400" />
          Traditional Jewelry
        </h4>
        {info.marketRank != null && info.marketRank <= 10 && (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400">
            #{info.marketRank} Global
          </span>
        )}
      </div>

      {/* Traditions */}
      <div className="mb-3">
        <p className="text-[9px] text-muted uppercase tracking-wider mb-1.5">
          Notable Traditions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {info.traditions.map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Materials */}
      <div className="mb-3">
        <p className="text-[9px] text-muted uppercase tracking-wider mb-1.5">
          Primary Materials
        </p>
        <div className="flex flex-wrap gap-1.5">
          {info.materials.map((m) => (
            <span
              key={m}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted border border-white/10"
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Significance */}
      <p className="text-xs text-muted/80 leading-relaxed italic">
        {info.significance}
      </p>
    </div>
  );
}

/* ── Main Jewelry Section (exported) ────────────────────────── */

export function JewelrySection({ iso }: JewelrySectionProps) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2 pt-2">
        <Gem className="w-4 h-4 text-yellow-400" />
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider">
          Jewelry & Precious Metals
        </h3>
      </div>

      {/* Precious metals ticker (global, not country-specific) */}
      <MetalsTicker />

      {/* Traditional jewelry for this country (if data exists) */}
      <TraditionalJewelryCard iso={iso} />

      {/* Country jewelry trade data */}
      <JewelryTradeSection iso={iso} />
    </div>
  );
}
