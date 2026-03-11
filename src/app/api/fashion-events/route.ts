import { NextRequest, NextResponse } from 'next/server';
import type { FashionEvent } from '@/types/api';
import eventsData from '@/data/fashion-events.json';

const events: FashionEvent[] = eventsData as FashionEvent[];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const country = searchParams.get('country')?.toUpperCase();
  const type = searchParams.get('type');
  const month = searchParams.get('month')?.toLowerCase();

  let filtered = events;

  if (country) {
    filtered = filtered.filter((e) => e.country === country);
  }

  if (type) {
    filtered = filtered.filter((e) => e.type === type);
  }

  if (month) {
    filtered = filtered.filter((e) => e.months.includes(month));
  }

  // Sort by tier (A first), then by established year
  const tierOrder: Record<string, number> = { A: 0, B: 1, C: 2 };
  filtered.sort((a, b) => {
    const tierDiff = (tierOrder[a.tier] ?? 3) - (tierOrder[b.tier] ?? 3);
    if (tierDiff !== 0) return tierDiff;
    return a.established - b.established;
  });

  return NextResponse.json({
    data: filtered,
    error: null,
    count: filtered.length,
    timestamp: Date.now(),
  });
}
