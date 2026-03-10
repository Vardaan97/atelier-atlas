'use client';

import {
  RadarChart as RechartsRadar,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { FASHION_DNA_AXES } from '@/lib/constants';
import type { FashionDNA } from '@/types/country';

const axisLabels: Record<string, string> = {
  traditionalism: 'Tradition',
  innovation: 'Innovation',
  sustainability: 'Sustain.',
  luxuryIndex: 'Luxury',
  streetwearInfluence: 'Street',
  craftsmanship: 'Craft',
  globalInfluence: 'Global',
};

interface FashionDNAChartProps {
  dna: FashionDNA;
  size?: 'sm' | 'md' | 'lg';
}

export function FashionDNAChart({ dna, size = 'md' }: FashionDNAChartProps) {
  const data = FASHION_DNA_AXES.map(axis => ({
    axis: axisLabels[axis] || axis,
    value: dna[axis as keyof FashionDNA],
    fullMark: 100,
  }));

  const heights = { sm: 150, md: 200, lg: 280 };

  return (
    <ResponsiveContainer width="100%" height={heights[size]}>
      <RechartsRadar data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: '#8B8FA3', fontSize: size === 'sm' ? 8 : 10 }}
        />
        <Radar
          name="Fashion DNA"
          dataKey="value"
          stroke="#E94560"
          fill="#E94560"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
