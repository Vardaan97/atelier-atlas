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

const axisLabelsShort: Record<string, string> = {
  traditionalism: 'Trad',
  innovation: 'Innov',
  sustainability: 'Sust',
  luxuryIndex: 'Lux',
  streetwearInfluence: 'Strt',
  craftsmanship: 'Crft',
  globalInfluence: 'Glob',
};

interface FashionDNAChartProps {
  dna: FashionDNA;
  size?: 'sm' | 'md' | 'lg';
}

export function FashionDNAChart({ dna, size = 'md' }: FashionDNAChartProps) {
  const labels = size === 'sm' ? axisLabelsShort : axisLabels;
  const data = FASHION_DNA_AXES.map(axis => ({
    axis: labels[axis] || axis,
    value: dna[axis as keyof FashionDNA],
    fullMark: 100,
  }));

  const heights = { sm: 150, md: 200, lg: 280 };
  const radii = { sm: '55%', md: '70%', lg: '70%' };

  return (
    <ResponsiveContainer width="100%" height={heights[size]}>
      <RechartsRadar data={data} cx="50%" cy="50%" outerRadius={radii[size]}>
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
