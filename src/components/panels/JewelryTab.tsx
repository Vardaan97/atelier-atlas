'use client';

import { JewelrySection } from './JewelrySection';
import type { CountryBase } from '@/types/country';

interface JewelryTabProps {
  country: CountryBase;
}

export function JewelryTab({ country }: JewelryTabProps) {
  return (
    <div className="space-y-4">
      <JewelrySection iso={country.iso} />
    </div>
  );
}
