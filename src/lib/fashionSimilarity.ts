/**
 * Fashion Similarity Engine
 *
 * Computes cultural fashion similarity between countries using
 * multi-dimensional analysis of silhouettes, materials, techniques,
 * color palettes, aesthetic philosophies, and cultural context.
 *
 * Uses Jaccard similarity for set-based dimensions and normalized
 * inverse difference for numeric dimensions, with weighted aggregation.
 */

import fashionChars from '@/data/fashion-characteristics.json';
import countriesJson from '@/data/countries.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FashionCharacteristics {
  silhouette: string[];
  colorPalette: string[];
  materials: string[];
  techniques: string[];
  aestheticPhilosophy: string[];
  drapingStyle: string;
  embellishmentLevel: number; // 1-5
  modesty: number; // 1-5
  genderDistinction: number; // 1-5
  influenceRegion: string;
  climateAdaptation: string;
  colonialInfluence: string;
  religiousInfluence: string[];
  fashionEra: string;
}

export interface SimilarityResult {
  iso: string;
  name: string;
  flag: string;
  score: number; // 0-100
  explanation: string;
  sharedTraits: string[];
  breakdown: DimensionBreakdown;
}

export interface DimensionBreakdown {
  silhouette: number;
  colorPalette: number;
  materials: number;
  techniques: number;
  aesthetic: number;
  embellishment: number;
  modesty: number;
  region: number;
  climate: number;
  culturalInfluence: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const characteristics = fashionChars as Record<string, FashionCharacteristics>;

/** Weights for each similarity dimension — must sum to 1.0 */
const WEIGHTS: Record<keyof DimensionBreakdown, number> = {
  silhouette: 0.18,
  colorPalette: 0.13,
  materials: 0.15,
  techniques: 0.15,
  aesthetic: 0.12,
  embellishment: 0.05,
  modesty: 0.05,
  region: 0.07,
  climate: 0.05,
  culturalInfluence: 0.05,
};

/**
 * Region adjacency map — regions that share cultural fashion exchange.
 * Each region maps to its "adjacent" regions that get a partial bonus.
 */
const REGION_ADJACENCY: Record<string, string[]> = {
  'east-asia': ['southeast-asia', 'central-asia'],
  'southeast-asia': ['east-asia', 'south-asia', 'oceania'],
  'south-asia': ['southeast-asia', 'middle-east', 'central-asia'],
  'central-asia': ['middle-east', 'east-asia', 'south-asia', 'eastern-europe'],
  'middle-east': ['north-africa', 'south-asia', 'central-asia', 'southern-europe'],
  'north-africa': ['middle-east', 'west-africa', 'southern-europe'],
  'west-africa': ['north-africa', 'east-africa', 'southern-africa'],
  'east-africa': ['west-africa', 'southern-africa', 'north-africa'],
  'southern-africa': ['east-africa', 'west-africa'],
  'western-europe': ['central-europe', 'northern-europe', 'southern-europe'],
  'central-europe': ['western-europe', 'eastern-europe', 'northern-europe', 'southern-europe'],
  'northern-europe': ['western-europe', 'central-europe', 'eastern-europe'],
  'eastern-europe': ['central-europe', 'northern-europe', 'caucasus', 'central-asia'],
  'southern-europe': ['western-europe', 'central-europe', 'north-africa', 'middle-east'],
  'caucasus': ['eastern-europe', 'middle-east', 'central-asia'],
  'north-america': ['caribbean', 'mesoamerica'],
  'mesoamerica': ['north-america', 'south-america', 'caribbean'],
  'south-america': ['mesoamerica', 'caribbean'],
  'south-america-andean': ['south-america', 'mesoamerica'],
  'caribbean': ['north-america', 'mesoamerica', 'south-america'],
  'oceania': ['southeast-asia'],
};

/**
 * Climate similarity groupings.
 */
const CLIMATE_GROUPS: Record<string, string[]> = {
  tropical: ['tropical', 'tropical-subtropical', 'tropical-monsoon', 'tropical-varied', 'tropical-highland', 'arid-tropical', 'varied-tropical'],
  arid: ['arid-hot', 'arid-continental', 'arid-mediterranean', 'arid-subtropical', 'arid-tropical'],
  temperate: ['temperate', 'temperate-seasonal', 'temperate-cool', 'temperate-continental', 'temperate-varied', 'temperate-maritime', 'temperate-alpine', 'mediterranean-continental'],
  cold: ['cold-nordic', 'cold-continental', 'cold-varied'],
  mediterranean: ['mediterranean', 'mediterranean-continental', 'arid-mediterranean'],
  highland: ['highland-varied', 'tropical-highland'],
};

// ---------------------------------------------------------------------------
// Core similarity functions
// ---------------------------------------------------------------------------

/**
 * Extract base stems from a hyphenated tag.
 * e.g. "silk-weaving" -> ["silk", "weaving"]
 *      "embroidery-elaborate" -> ["embroidery", "elaborate"]
 */
function stems(tag: string): string[] {
  return tag.split('-').filter((s) => s.length > 2);
}

/**
 * Enhanced Jaccard similarity that considers both exact matches
 * and partial stem overlap. This handles cases like "weaving" vs
 * "silk-weaving" or "embroidery-fine" vs "embroidery-elaborate".
 *
 * Score = (exactMatches + 0.4 * partialStemMatches) / unionSize
 */
function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const setA = new Set(a);
  const setB = new Set(b);

  // Count exact matches
  let exactMatches = 0;
  const matchedA = new Set<string>();
  const matchedB = new Set<string>();

  for (const item of setA) {
    if (setB.has(item)) {
      exactMatches++;
      matchedA.add(item);
      matchedB.add(item);
    }
  }

  // Count partial stem matches for unmatched items
  let partialMatches = 0;
  const unmatchedA = a.filter((t) => !matchedA.has(t));
  const unmatchedB = b.filter((t) => !matchedB.has(t));

  const partialMatchedB = new Set<string>();
  for (const tagA of unmatchedA) {
    const stemsA = stems(tagA);
    for (const tagB of unmatchedB) {
      if (partialMatchedB.has(tagB)) continue;
      const stemsB = stems(tagB);
      // Check if any stem overlaps
      const sharedStems = stemsA.filter((s) => stemsB.includes(s));
      if (sharedStems.length > 0) {
        partialMatches++;
        partialMatchedB.add(tagB);
        break;
      }
    }
  }

  const union = new Set([...a, ...b]).size;
  return (exactMatches + 0.4 * partialMatches) / union;
}

/** Normalized inverse difference for numeric values on a given scale */
function numericSimilarity(a: number, b: number, maxDiff: number): number {
  return 1 - Math.abs(a - b) / maxDiff;
}

/** Region similarity: 1.0 if same, 0.5 if adjacent, 0 otherwise */
function regionSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const adjacent = REGION_ADJACENCY[a] || [];
  return adjacent.includes(b) ? 0.5 : 0;
}

/** Climate similarity: 1.0 if same, 0.7 if in same group, 0.3 if groups overlap, 0 otherwise */
function climateSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;

  // Find groups each climate belongs to
  const groupsA: string[] = [];
  const groupsB: string[] = [];
  for (const [group, members] of Object.entries(CLIMATE_GROUPS)) {
    if (members.includes(a)) groupsA.push(group);
    if (members.includes(b)) groupsB.push(group);
  }

  // Check for shared groups
  const shared = groupsA.filter((g) => groupsB.includes(g));
  if (shared.length > 0) return 0.7;

  return 0;
}

/** Draping style similarity */
function drapingSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  // Extract base style keywords
  const wordsA = new Set(a.split('-'));
  const wordsB = new Set(b.split('-'));
  let shared = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) shared++;
  }
  const total = new Set([...wordsA, ...wordsB]).size;
  return total === 0 ? 0 : shared / total;
}

// ---------------------------------------------------------------------------
// Compute full breakdown between two countries
// ---------------------------------------------------------------------------

export function computeBreakdown(
  isoA: string,
  isoB: string
): DimensionBreakdown | null {
  const a = characteristics[isoA];
  const b = characteristics[isoB];
  if (!a || !b) return null;

  return {
    silhouette: jaccard(a.silhouette, b.silhouette),
    colorPalette: jaccard(a.colorPalette, b.colorPalette),
    materials: jaccard(a.materials, b.materials),
    techniques: jaccard(a.techniques, b.techniques),
    aesthetic: jaccard(a.aestheticPhilosophy, b.aestheticPhilosophy),
    embellishment: numericSimilarity(a.embellishmentLevel, b.embellishmentLevel, 4),
    modesty: numericSimilarity(a.modesty, b.modesty, 4),
    region: regionSimilarity(a.influenceRegion, b.influenceRegion),
    climate: climateSimilarity(a.climateAdaptation, b.climateAdaptation),
    culturalInfluence:
      (jaccard(a.religiousInfluence, b.religiousInfluence) +
        drapingSimilarity(a.drapingStyle, b.drapingStyle)) /
      2,
  };
}

/**
 * Compute weighted aggregate score from a breakdown (0-100 scale).
 *
 * The raw weighted sum typically ranges from 0.05 to 0.65 due to
 * Jaccard's strictness on diverse arrays. We apply a calibrated
 * scaling to map this to a user-friendly 0-95 range where:
 *   - Top cultural siblings (India-Pakistan, Nigeria-Ghana) ~ 80-90%
 *   - Same-region matches (Japan-Korea, France-Italy) ~ 55-70%
 *   - Cross-region/cross-culture pairs ~ 10-30%
 */
export function scoreFromBreakdown(bd: DimensionBreakdown): number {
  let total = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    total += bd[key as keyof DimensionBreakdown] * weight;
  }
  // Scale: raw 0.05-0.65 → display 5-95
  // Using power curve for natural separation
  const scaled = Math.pow(total, 0.75) * 130;
  return Math.min(95, Math.max(0, Math.round(scaled)));
}

// ---------------------------------------------------------------------------
// Explanation generator
// ---------------------------------------------------------------------------

function generateExplanation(
  a: FashionCharacteristics,
  b: FashionCharacteristics,
  bd: DimensionBreakdown
): { explanation: string; sharedTraits: string[] } {
  const traits: string[] = [];
  const reasons: string[] = [];

  // Find strongest dimensions
  type DimEntry = [keyof DimensionBreakdown, number];
  const dims: DimEntry[] = Object.entries(bd) as DimEntry[];
  dims.sort((x, y) => y[1] - x[1]);

  // Shared materials
  const sharedMaterials = a.materials.filter((m) => b.materials.includes(m));
  if (sharedMaterials.length > 0) {
    const materialNames = sharedMaterials
      .slice(0, 3)
      .map((m) => m.replace(/-/g, ' '));
    traits.push(...materialNames.map((m) => capitalizeFirst(m)));
  }

  // Shared techniques
  const sharedTechniques = a.techniques.filter((t) => b.techniques.includes(t));
  if (sharedTechniques.length > 0) {
    const techniqueNames = sharedTechniques
      .slice(0, 2)
      .map((t) => t.replace(/-/g, ' '));
    traits.push(
      ...techniqueNames.map((t) => capitalizeFirst(t))
    );
  }

  // Shared aesthetics
  const sharedAesthetics = a.aestheticPhilosophy.filter((ae) =>
    b.aestheticPhilosophy.includes(ae)
  );
  if (sharedAesthetics.length > 0) {
    traits.push(
      ...sharedAesthetics
        .slice(0, 2)
        .map((ae) => capitalizeFirst(ae.replace(/-/g, ' ')))
    );
  }

  // Build explanation based on top scoring dimensions
  for (const [dim, score] of dims.slice(0, 3)) {
    if (score < 0.3) continue;
    switch (dim) {
      case 'silhouette':
        if (score >= 0.5) reasons.push('similar silhouette traditions');
        break;
      case 'colorPalette':
        if (score >= 0.4) reasons.push('shared color sensibilities');
        break;
      case 'materials':
        if (score >= 0.3 && sharedMaterials.length > 0)
          reasons.push(`shared ${sharedMaterials.slice(0, 2).join(' & ').replace(/-/g, ' ')} traditions`);
        break;
      case 'techniques':
        if (score >= 0.3 && sharedTechniques.length > 0)
          reasons.push(`common ${sharedTechniques[0].replace(/-/g, ' ')} techniques`);
        break;
      case 'aesthetic':
        if (score >= 0.3 && sharedAesthetics.length > 0)
          reasons.push(`${sharedAesthetics[0].replace(/-/g, ' ')} aesthetic philosophy`);
        break;
      case 'region':
        if (score >= 1.0) reasons.push('same cultural region');
        else if (score >= 0.5) reasons.push('neighboring cultural regions');
        break;
      case 'embellishment':
        if (score >= 0.75) reasons.push('similar embellishment levels');
        break;
      case 'modesty':
        if (score >= 0.75) reasons.push('aligned modesty conventions');
        break;
      case 'climate':
        if (score >= 0.7) reasons.push('similar climate-driven design');
        break;
      case 'culturalInfluence':
        if (score >= 0.5) reasons.push('shared cultural and religious influences');
        break;
    }
  }

  // Fallback explanation
  if (reasons.length === 0) {
    reasons.push('some overlapping fashion elements');
  }

  const explanation = capitalizeFirst(reasons.slice(0, 2).join(' and '));

  return {
    explanation,
    sharedTraits: traits.slice(0, 5),
  };
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Country metadata lookup (for names/flags)
// ---------------------------------------------------------------------------

const _countryLookup = new Map<string, { name: string; flag: string }>();

for (const c of countriesJson as Array<{ iso: string; name: string; flag: string }>) {
  _countryLookup.set(c.iso, { name: c.name, flag: c.flag });
}

function getCountryLookup(): Map<string, { name: string; flag: string }> {
  return _countryLookup;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the top N similar countries for a given ISO code.
 * Returns culturally-accurate results based on fashion characteristics.
 */
export function getSimilarCountries(
  iso: string,
  topN = 5
): SimilarityResult[] {
  const source = characteristics[iso];
  if (!source) return [];

  const lookup = getCountryLookup();
  const results: SimilarityResult[] = [];

  for (const otherIso of Object.keys(characteristics)) {
    if (otherIso === iso) continue;

    const bd = computeBreakdown(iso, otherIso);
    if (!bd) continue;

    const score = scoreFromBreakdown(bd);
    const other = characteristics[otherIso];
    const { explanation, sharedTraits } = generateExplanation(source, other, bd);
    const meta = lookup.get(otherIso);

    results.push({
      iso: otherIso,
      name: meta?.name || otherIso,
      flag: meta?.flag || '',
      score,
      explanation,
      sharedTraits,
      breakdown: bd,
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topN);
}

/**
 * Get the similarity score and breakdown between two specific countries.
 * Used in the ComparisonView.
 */
export function getCountryPairSimilarity(
  isoA: string,
  isoB: string
): { score: number; breakdown: DimensionBreakdown; explanation: string; sharedTraits: string[] } | null {
  const a = characteristics[isoA];
  const b = characteristics[isoB];
  if (!a || !b) return null;

  const bd = computeBreakdown(isoA, isoB);
  if (!bd) return null;

  const score = scoreFromBreakdown(bd);
  const { explanation, sharedTraits } = generateExplanation(a, b, bd);

  return { score, breakdown: bd, explanation, sharedTraits };
}

/**
 * Check if a country has fashion characteristics data.
 */
export function hasCharacteristics(iso: string): boolean {
  return iso in characteristics;
}

/**
 * Get raw fashion characteristics for a country.
 */
export function getCharacteristics(iso: string): FashionCharacteristics | null {
  return characteristics[iso] || null;
}
