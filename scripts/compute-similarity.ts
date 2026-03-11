/**
 * compute-similarity.ts
 *
 * Standalone script to compute fashion-culture similarity between countries.
 * Reads src/data/countries.json, computes pairwise similarity for all
 * non-skeleton countries, and writes the top-5 results to
 * src/data/similarity.json.
 *
 * Usage:
 *   npx tsx scripts/compute-similarity.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Types ────────────────────────────────────────────────────────────────────

interface ColorEntry {
  name: string;
  hex: string;
  meaning: string;
}

interface CountryRecord {
  iso: string;
  name: string;
  region: string;
  flag: string;
  tier: 'A' | 'B' | 'C' | 'skeleton';
  fashionIndex: number;
  marketSize: number;
  sustainabilityScore: number;
  primaryFabrics: string[];
  colorPalette: ColorEntry[];
}

interface SimilarityEntry {
  iso: string;
  name: string;
  score: number; // 0-100 integer
  sharedFabrics: string[];
  flag: string;
}

type SimilarityMap = Record<string, SimilarityEntry[]>;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse a hex color string (#RRGGBB) into an [R, G, B] tuple. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/**
 * Compute average RGB closeness between two color palettes.
 * For every color in palette A, find the best match in palette B,
 * then average those best-match scores. Repeat symmetrically and
 * average the two directions.
 * Closeness of two RGB colors: 1 - euclideanDist / maxDist (441.67).
 */
function colorSimilarity(aColors: string[], bColors: string[]): number {
  if (aColors.length === 0 || bColors.length === 0) return 0.5; // neutral

  const MAX_DIST = Math.sqrt(255 ** 2 * 3); // ~441.67

  const rgbA = aColors.map(hexToRgb);
  const rgbB = bColors.map(hexToRgb);

  function bestMatchScore(
    source: [number, number, number][],
    target: [number, number, number][]
  ): number {
    let total = 0;
    for (const s of source) {
      let best = 0;
      for (const t of target) {
        const dist = Math.sqrt(
          (s[0] - t[0]) ** 2 + (s[1] - t[1]) ** 2 + (s[2] - t[2]) ** 2
        );
        const closeness = 1 - dist / MAX_DIST;
        if (closeness > best) best = closeness;
      }
      total += best;
    }
    return total / source.length;
  }

  const abScore = bestMatchScore(rgbA, rgbB);
  const baScore = bestMatchScore(rgbB, rgbA);
  return (abScore + baScore) / 2;
}

/** Jaccard similarity of two string arrays (case-insensitive). */
function jaccardFabrics(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  if (setA.size === 0 && setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Fabric intersection (preserving original casing from country A). */
function fabricIntersection(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  return a.filter((f) => setB.has(f.toLowerCase()));
}

// ── Weights ──────────────────────────────────────────────────────────────────

const WEIGHTS = {
  fashionIndex: 0.15,
  sustainability: 0.15,
  fabric: 0.25,
  color: 0.2,
  region: 0.1,
  marketSize: 0.15,
} as const;

// ── Main ─────────────────────────────────────────────────────────────────────

function computeSimilarity(a: CountryRecord, b: CountryRecord): number {
  // 1. Fashion Index distance
  const fid = 1 - Math.abs(a.fashionIndex - b.fashionIndex) / 100;

  // 2. Sustainability Score distance
  const ssd = 1 - Math.abs(a.sustainabilityScore - b.sustainabilityScore) / 100;

  // 3. Fabric Jaccard
  const fj = jaccardFabrics(a.primaryFabrics, b.primaryFabrics);

  // 4. Color similarity
  const aHexes = a.colorPalette.map((c) => c.hex);
  const bHexes = b.colorPalette.map((c) => c.hex);
  const cs = colorSimilarity(aHexes, bHexes);

  // 5. Region bonus
  const rb = a.region === b.region ? 1.0 : 0.3;

  // 6. Market size ratio
  const msA = Math.max(a.marketSize, 0.01);
  const msB = Math.max(b.marketSize, 0.01);
  const msr = Math.min(msA, msB) / Math.max(msA, msB);

  const raw =
    WEIGHTS.fashionIndex * fid +
    WEIGHTS.sustainability * ssd +
    WEIGHTS.fabric * fj +
    WEIGHTS.color * cs +
    WEIGHTS.region * rb +
    WEIGHTS.marketSize * msr;

  // Scale to 0-100
  return Math.round(raw * 100);
}

function main(): void {
  const countriesPath = path.resolve(__dirname, '../src/data/countries.json');
  const outputPath = path.resolve(__dirname, '../src/data/similarity.json');

  const rawData = fs.readFileSync(countriesPath, 'utf-8');
  const countries: CountryRecord[] = JSON.parse(rawData);

  // Only process tier A and B countries
  const eligible = countries.filter(
    (c) => c.tier === 'A' || c.tier === 'B'
  );

  console.log(`Processing ${eligible.length} countries (tier A + B)...`);

  const result: SimilarityMap = {};

  for (const source of eligible) {
    const scores: Array<SimilarityEntry & { rawScore: number }> = [];

    for (const target of eligible) {
      if (target.iso === source.iso) continue;

      const score = computeSimilarity(source, target);
      const shared = fabricIntersection(source.primaryFabrics, target.primaryFabrics);

      scores.push({
        iso: target.iso,
        name: target.name,
        score,
        sharedFabrics: shared,
        flag: target.flag,
        rawScore: score,
      });
    }

    // Sort descending by score, take top 5
    scores.sort((a, b) => b.rawScore - a.rawScore);
    result[source.iso] = scores.slice(0, 5).map(({ rawScore, ...entry }) => entry);
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Wrote similarity data for ${Object.keys(result).length} countries to ${outputPath}`);
}

main();
