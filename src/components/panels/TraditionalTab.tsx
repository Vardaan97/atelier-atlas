'use client';

import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Shirt } from 'lucide-react';
import { GarmentCard } from './GarmentCard';
import { GarmentDetailView } from './GarmentDetailView';
import { MuseumSection } from './MuseumSection';
import { useTrends } from '@/hooks/useTrends';
import { useGlobeStore } from '@/store/useGlobeStore';
import { getGarmentTrendScore } from '@/lib/googletrends';
import type { CountryBase, Garment } from '@/types/country';

interface TraditionalTabProps {
  country: CountryBase;
}

export function TraditionalTab({ country }: TraditionalTabProps) {
  const garments = country.traditionalGarments;
  const { data: trendsData } = useTrends(country.iso, 'all');
  const setActiveTab = useGlobeStore((s) => s.setActiveTab);

  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);

  // Build a map of garment name -> trend info
  const garmentTrends = useMemo(() => {
    if (!trendsData?.garmentInterest) return {};
    const map: Record<string, { trending: boolean; direction: 'up' | 'down' | 'stable'; score: number }> = {};
    for (const [name, points] of Object.entries(trendsData.garmentInterest)) {
      map[name] = getGarmentTrendScore(points);
    }
    return map;
  }, [trendsData]);

  const handleGarmentClick = useCallback((garment: Garment) => {
    setSelectedGarment(garment);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedGarment(null);
  }, []);

  const handleOpenAiStudio = useCallback(
    () => {
      // Switch to AI Studio tab -- the AiStudioTab will show garment generation
      setActiveTab('ai-studio');
    },
    [setActiveTab]
  );

  if (!garments || garments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Shirt className="w-10 h-10 text-muted/40 mb-3" />
          <p className="text-muted text-sm">No traditional garment data yet</p>
          <p className="text-muted/50 text-xs mt-1">
            Data being compiled
          </p>
        </div>

        {/* Still show museum items even without local garment data */}
        <MuseumSection countryName={country.name} />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {selectedGarment ? (
        <GarmentDetailView
          key={`detail-${selectedGarment.name}`}
          garment={selectedGarment}
          countryName={country.name}
          onBack={handleBack}
          onOpenAiStudio={handleOpenAiStudio}
          trendInfo={garmentTrends[selectedGarment.name]}
        />
      ) : (
        <div key="garment-grid" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
              Traditional Garments
            </h3>
            <span className="text-xs text-muted font-mono">
              {garments.length} item{garments.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid gap-4">
            {garments.map((garment, i) => (
              <GarmentCard
                key={garment.name}
                garment={garment}
                countryName={country.name}
                index={i}
                trendInfo={garmentTrends[garment.name]}
                onClick={handleGarmentClick}
              />
            ))}
          </div>

          {/* Museum Collection -- real garments from the Met */}
          <MuseumSection
            countryName={country.name}
            garmentName={garments[0]?.name}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
