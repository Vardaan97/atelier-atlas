'use client';

import { Shirt } from 'lucide-react';
import { GarmentCard } from './GarmentCard';
import type { CountryBase } from '@/types/country';

interface TraditionalTabProps {
  country: CountryBase;
}

export function TraditionalTab({ country }: TraditionalTabProps) {
  const garments = country.traditionalGarments;

  if (!garments || garments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Shirt className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-muted text-sm">No traditional garment data yet</p>
        <p className="text-muted/50 text-xs mt-1">
          Data being compiled
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          />
        ))}
      </div>
    </div>
  );
}
