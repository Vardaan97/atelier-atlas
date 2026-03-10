'use client';

import { Palette, Layers, Droplets } from 'lucide-react';
import { ColorPalette } from '@/components/ui/ColorSwatch';
import { TextileCard, FabricChip } from './TextileCard';
import { useImages } from '@/hooks/useImages';
import { ImageGallery } from '@/components/ui/ImageGallery';
import type { CountryBase, CountryProfile } from '@/types/country';

interface ColorsTextilesTabProps {
  country: CountryBase;
  profile?: CountryProfile | null;
}

export function ColorsTextilesTab({ country, profile }: ColorsTextilesTabProps) {
  const colors = country.colorPalette;
  const fabrics = country.primaryFabrics;
  const textiles = profile?.textiles;
  const hasColors = colors && colors.length > 0;
  const hasFabrics = fabrics && fabrics.length > 0;
  const hasTextiles = textiles && textiles.length > 0;

  // Fetch textile/fabric images for the country
  const fabricQuery = hasFabrics
    ? `${fabrics.slice(0, 3).join(' ')} textile fabric ${country.name}`
    : null;
  const { images: fabricImages, loading: fabricLoading } = useImages(fabricQuery, 4);

  if (!hasColors && !hasFabrics && !hasTextiles) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Palette className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-muted text-sm">No color & textile data yet</p>
        <p className="text-muted/50 text-xs mt-1">
          AI-generated profiles coming in Session 3
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Color Palette Section */}
      {hasColors && (
        <section className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              National Color Palette
            </h3>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <ColorPalette colors={colors} />

            {/* Color strip */}
            <div className="mt-5 h-3 rounded-full overflow-hidden flex ring-1 ring-white/10">
              {colors.map((c) => (
                <div
                  key={c.hex}
                  className="flex-1 first:rounded-l-full last:rounded-r-full"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>

            {/* Color meanings */}
            <div className="mt-4 grid gap-2">
              {colors.map((c) => (
                <div key={c.hex} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/10"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-xs font-medium">{c.name}</span>
                  <span className="text-[10px] text-muted flex-1">{c.meaning}</span>
                  <span className="text-[10px] text-accent font-mono">{c.hex}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI-generated Textiles (from profile) */}
      {hasTextiles && (
        <section className="animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Notable Textiles
            </h3>
          </div>

          <div className="grid gap-3">
            {textiles.map((textile, i) => (
              <TextileCard
                key={textile.name}
                textile={textile}
                countryName={country.name}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      {/* Primary Fabrics Section */}
      {hasFabrics && (
        <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Primary Fabrics
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {fabrics.map((fabric) => (
              <FabricChip key={fabric} fabric={fabric} />
            ))}
          </div>

          {/* Fabric imagery */}
          {(fabricLoading || fabricImages.length > 0) && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="w-3.5 h-3.5 text-muted" />
                <span className="text-[10px] text-muted uppercase tracking-wider">
                  Textile Gallery
                </span>
              </div>
              <ImageGallery
                images={fabricImages}
                loading={fabricLoading}
                columns={2}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
