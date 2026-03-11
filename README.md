# Atelier Atlas

**Bloomberg-style interactive 3D globe for global fashion intelligence.**

Explore traditional clothing, textile heritage, industry data, AI-generated fashion profiles, and cultural intelligence across 195 countries — all rendered on an interactive WebGL globe.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

### Interactive 3D Globe
- **WebGL globe** powered by [react-globe.gl](https://github.com/vasturiano/react-globe.gl) with Natural Earth GeoJSON
- Heat map coloring by metric (Fashion Index, Market Size, Textile Exports, Sustainability, Population)
- Auto-rotation, click-to-zoom, hover tooltips with country flag + stats
- **Mobile fallback**: SVG equirectangular flat map for devices without WebGL

### Country Intelligence Panel
Click any country to open a detailed panel with 6 tabs:

| Tab | Content |
|-----|---------|
| **Traditional** | Traditional garments with stock images from Unsplash/Pexels/Wikimedia |
| **Colors & Textiles** | Color palette swatches (Pantone-style) + textile/fabric cards |
| **Fashion Timeline** | AI-generated era-by-era fashion history with illustrations |
| **Industry** | Market size, growth rate, employment, trade data (UN Comtrade) |
| **Culture & Climate** | Climate zones, cultural influences, sustainability analysis |
| **Contemporary** | Designers, fashion weeks, emerging trends, digital metrics |

### AI-Powered Profiles
- **Fashion DNA**: 7-axis radar chart (Traditionalism, Innovation, Sustainability, Luxury, Streetwear, Craftsmanship, Global Influence)
- **AI text profiles** via Gemini 3 Flash (OpenRouter) — cached for 30 days
- **AI image generation**: 9 models supported (Nano Banana 2, GPT-5 Image, Seedream, Riverflow, Grok)
- Pre-generated profiles ship with the build for instant loading

### Exploration Tools
- **10-axis filter system**: Region, Tier, Fashion Index range, Market Size, Sustainability, Fabric type, Fashion Week city, Climate zone, Textile Heritage toggle, Color proximity
- **Comparison mode**: Side-by-side view of 2-3 countries with matched data
- **AI search**: Natural language queries like "countries famous for silk" (Cmd/Ctrl+K)
- **Globe overlays**: Metric heat map, Sustainability gradient, Climate zones, Fashion Week markers
- **Era timeline slider**: Filter content by historical period
- **Style Similarity**: Pre-computed similarity scores showing 5 most related fashion cultures per country

### Trade Data
- **UN Comtrade API** integration for textile trade data (HS codes 50-63)
- 5-year trend charts with import/export balance indicators
- Synthetic fallback data with seeded PRNG for consistent results without API key

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| 3D Globe | react-globe.gl + Three.js |
| Styling | Tailwind CSS 4 + custom dark theme |
| Components | Radix UI primitives |
| Charts | Recharts (radar, sparklines, bar charts) |
| Animations | Framer Motion |
| State | Zustand |
| AI | OpenRouter API (Gemini 3 Flash text, 9 image models) |
| Images | Unsplash + Pexels + Wikimedia Commons APIs |
| Icons | Lucide React |

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm 9+

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/atelier-atlas.git
cd atelier-atlas
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys (see [Environment Variables](#environment-variables)).

### Development

```bash
npm run dev
# Opens at http://localhost:3000
```

### Build

```bash
npm run build
npm start
```

---

## Environment Variables

Create `.env.local` from `.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | For AI features | OpenRouter API key for text/image generation |
| `IMAGE_GEN_MODEL` | No | Image model ID (default: `nano-banana-2`). See `src/lib/image-models.ts` |
| `XAI_API_KEY` | No | xAI API key (only for Grok image models) |
| `UNSPLASH_ACCESS_KEY` | No | Unsplash API key for stock images |
| `PEXELS_API_KEY` | No | Pexels API key for stock images |

**The app works without any API keys** — it degrades gracefully with static data, no stock images, and no AI profiles.

### Available Image Generation Models

Set `IMAGE_GEN_MODEL` in `.env.local`:

| Model ID | Provider | Cost | Notes |
|----------|----------|------|-------|
| `nano-banana-2` | OpenRouter | ~$0.50/M in | Default, Gemini 3.1 Flash |
| `nano-banana-pro` | OpenRouter | $2/M in | Higher quality |
| `gpt5-image` | OpenRouter | $10/M in | Top tier quality |
| `gpt5-image-mini` | OpenRouter | Cheaper | GPT-5 Mini variant |
| `seedream-4.5` | OpenRouter | $0.04/img | ByteDance, image-only |
| `riverflow-v2-fast` | OpenRouter | $0.02/img | Fastest generation |
| `riverflow-v2-pro` | OpenRouter | $0.15/img | Best Riverflow quality |
| `grok-2-image` | xAI | $0.07/img | Requires `XAI_API_KEY` |
| `grok-imagine` | xAI | ~$0.07/img | Requires `XAI_API_KEY` |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── ai-image/route.ts     # AI image generation endpoint
│   │   ├── ai-profile/[iso]/     # AI country profile generation
│   │   ├── images/route.ts       # Stock image aggregation (Unsplash/Pexels/Wikimedia)
│   │   ├── search/route.ts       # AI-powered natural language search
│   │   └── trade/[iso]/route.ts  # UN Comtrade trade data
│   ├── country/[iso]/page.tsx    # SSR country pages (35 pre-rendered)
│   ├── layout.tsx                # Root layout (dark theme, fonts, SEO, JSON-LD)
│   ├── page.tsx                  # Home — renders GlobeView
│   ├── robots.ts                 # robots.txt generation
│   └── sitemap.ts                # XML sitemap generation
│
├── components/
│   ├── GlobeView.tsx             # Main orchestrator (globe + controls + panels)
│   ├── charts/
│   │   ├── RadarChart.tsx        # 7-axis Fashion DNA radar chart
│   │   └── Sparkline.tsx         # Inline sparkline for trends
│   ├── filters/
│   │   └── FilterSidebar.tsx     # 10-axis filter panel
│   ├── globe/
│   │   ├── FashionGlobe.tsx      # 3D WebGL globe (dynamic import, ssr:false)
│   │   ├── FlatMap.tsx           # 2D SVG map (mobile fallback)
│   │   ├── GlobeControls.tsx     # Metric selector, overlay modes, filter/compare/search toggles
│   │   └── GlobeTooltip.tsx      # Hover tooltip
│   ├── panels/
│   │   ├── CountryPanel.tsx      # Slide-in panel with 6 tabs + similarity
│   │   ├── ComparisonView.tsx    # Side-by-side country comparison
│   │   ├── SimilaritySection.tsx # Style similarity cards (clickable)
│   │   ├── TraditionalTab.tsx    # Traditional garments + stock images
│   │   ├── ColorsTextilesTab.tsx # Color palette + textile cards
│   │   ├── TimelineTab.tsx       # Fashion era timeline + AI images
│   │   ├── IndustryTab.tsx       # Trade data, stats, 5yr trends
│   │   ├── CultureClimateTab.tsx # Climate, cultural influences
│   │   ├── ContemporaryTab.tsx   # Designers, fashion weeks, trends
│   │   ├── GarmentCard.tsx       # Individual garment display
│   │   └── TextileCard.tsx       # Individual textile display
│   ├── search/
│   │   └── SearchBar.tsx         # Cmd+K AI search bar
│   └── ui/
│       ├── BottomTicker.tsx      # Scrolling fashion facts ticker
│       ├── ColorSwatch.tsx       # Pantone-style color swatch
│       ├── ImageGallery.tsx      # Masonry grid + lightbox
│       ├── Skeleton.tsx          # Loading skeleton components
│       ├── StatCard.tsx          # Stat display card
│       └── TimelineSlider.tsx    # Historical era slider
│
├── data/
│   ├── countries.json            # 195 countries baseline data (~800KB)
│   ├── similarity.json           # Pre-computed similarity scores (35 countries)
│   ├── profiles/                 # Pre-generated AI profiles (cached JSON)
│   └── trade-cache/              # Cached trade data (local dev only)
│
├── hooks/
│   ├── useAiProfile.ts           # Fetch/cache AI profile for a country
│   ├── useComparisonProfiles.ts  # Profiles for comparison mode
│   ├── useImages.ts              # Stock image fetching
│   ├── useIsMobile.ts            # Responsive breakpoint hook (< 768px)
│   └── useTradeData.ts           # Trade data fetching
│
├── lib/
│   ├── api/
│   │   ├── comtrade.ts           # UN Comtrade API client + synthetic fallback
│   │   ├── images.ts             # Image API aggregator
│   │   ├── openrouter.ts         # OpenRouter text + image generation
│   │   ├── pexels.ts             # Pexels API client
│   │   ├── unsplash.ts           # Unsplash API client
│   │   ├── wikimedia.ts          # Wikimedia Commons API client
│   │   └── xai.ts                # xAI/Grok image generation
│   ├── cache.ts                  # In-memory cache (dev) abstraction
│   ├── constants.ts              # Theme colors, globe config, tab definitions
│   ├── file-cache.ts             # Persistent file cache (skips on Vercel)
│   ├── filters.ts                # 10-axis filter logic + climate inference
│   ├── image-models.ts           # 9-model image generation registry
│   ├── prompts.ts                # AI prompt templates
│   └── utils.ts                  # cn(), formatCurrency, interpolateColor, debounce
│
├── store/
│   └── useGlobeStore.ts          # Zustand store (selection, filters, comparison, search, overlays)
│
└── types/
    ├── api.ts                    # API response types
    ├── country.ts                # Country, Profile, FashionDNA, Era, Textile types
    └── globe.ts                  # Globe tooltip, GeoJSON feature types

scripts/
├── compute-similarity.ts        # Pre-compute style similarity (npx tsx scripts/compute-similarity.ts)
└── generate-profiles.js         # Batch pre-generate AI profiles for Tier A countries

public/
└── (static assets)
```

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYERS                                     │
├──────────────┬──────────────┬──────────────────┬────────────────────────┤
│  Layer 1     │  Layer 2     │  Layer 3         │  Layer 4               │
│  Static JSON │  Stock APIs  │  AI Generation   │  Live Trade Data       │
│  ~800KB      │  On-click    │  On-click        │  On-click              │
│  Ships w/    │  Cached 7d   │  Cached 30d      │  Cached 30d            │
│  build       │              │                  │                        │
│              │  Unsplash    │  Gemini 3 Flash  │  UN Comtrade           │
│  countries.  │  Pexels      │  (text profiles) │  (HS codes 50-63)     │
│  json        │  Wikimedia   │  Nano Banana 2+  │  Synthetic fallback   │
│              │              │  (images)        │                        │
└──────────────┴──────────────┴──────────────────┴────────────────────────┘

Caching: Memory Map → File Cache (local) → API call → Static fallback
         (Vercel: Memory Map → API call → Static fallback)
```

### State Management

All global state lives in `useGlobeStore` (Zustand):

- **Selection**: `selectedCountry`, `panelOpen`, `activeTab`
- **Globe**: `activeMetric`, `autoRotate`, `overlayMode`, `globeReady`
- **Filters**: 10 filter axes + `getFilteredCountries()` computed
- **Comparison**: `comparisonMode`, `comparedCountries[]` (max 3)
- **Search**: `searchQuery`, `searchResults[]`
- **Cache**: `profileCache` (Map<string, CountryProfile>)

### Country Data Tiers

| Tier | Count | Data Quality | Examples |
|------|-------|-------------|----------|
| A | 15 | Full profiles, all fields populated | FR, IT, US, GB, JP, CN, IN |
| B | 20 | Good profiles, most fields | NG, EG, ZA, CO, PH |
| C | 18 | Basic data, some fields empty | Many smaller nations |
| Skeleton | 142 | Minimal — name, flag, region only | Remaining countries |

### Key Technical Notes

- **react-globe.gl** must be dynamically imported with `ssr: false` (Three.js requires browser APIs)
- **GeoJSON** uses Natural Earth `ne_110m_admin_0_countries` — some territories have `ISO_A3 = -99`
- **File cache** writes to filesystem — read-only on Vercel (auto-skipped via `IS_VERCEL` detection)
- **Mobile detection** uses `window.matchMedia('(max-width: 767px)')` — SSR-safe with default `false`
- **All API routes** follow cache-first pattern: memory → file → API → fallback → never show error

---

## Pre-generating Data

### AI Profiles

Generate profiles for the top 15 countries before deployment:

```bash
# Start dev server
PORT=3010 npm run dev

# In another terminal
OPENROUTER_API_KEY=your-key API_BASE=http://localhost:3010 node scripts/generate-profiles.js
```

Profiles are saved to `src/data/profiles/{ISO}.json` and ship with the build.

### Similarity Scores

Re-compute after changing country data:

```bash
npx tsx scripts/compute-similarity.ts
```

Outputs `src/data/similarity.json` with top-5 similar countries for each Tier A+B country.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Set environment variables in Vercel dashboard:
   - `OPENROUTER_API_KEY` (for AI features)
   - `IMAGE_GEN_MODEL` (optional, default: `nano-banana-2`)
4. Deploy — auto-deploys on push to `main`

**Vercel Notes**:
- File cache is auto-disabled (read-only filesystem)
- Pre-generated profiles in `src/data/profiles/` work fine (shipped with build)
- In-memory cache is lost on cold starts
- 35 country pages + home are statically generated at build time

### Environment on Vercel

```
OPENROUTER_API_KEY=sk-or-v1-...
IMAGE_GEN_MODEL=nano-banana-2
```

---

## Design System

### Theme

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0A0A1A` | Page background |
| Text | `#F0F0F5` | Primary text |
| Muted | `#8B8FA3` | Secondary text |
| Accent | `#E94560` | Highlights, buttons, active states |
| Secondary | `#0F3460` | Cards, panels |
| Success | `#00C48C` | Positive indicators |
| Warning | `#FFB800` | Caution states |
| Error | `#FF4757` | Error states |

### Typography

| Font | Variable | Usage |
|------|----------|-------|
| Playfair Display | `--font-playfair` | Headings (`font-heading`) |
| Inter | `--font-inter` | Body text (`font-sans`) |
| JetBrains Mono | `--font-jetbrains` | Statistics, codes (`font-mono`) |

### Glassmorphism Pattern

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Adding a New Country Profile

1. Edit `src/data/countries.json` — find the country entry and fill in missing fields
2. Change `tier` from `"skeleton"` to `"C"`, `"B"`, or `"A"` based on data completeness
3. Run `npx tsx scripts/compute-similarity.ts` to update similarity scores
4. Run `npm run build` to verify

### Adding a New Tab

1. Create component in `src/components/panels/NewTab.tsx`
2. Add tab entry to `PANEL_TABS` in `src/lib/constants.ts`
3. Add `<Tabs.Content>` in `src/components/panels/CountryPanel.tsx`

### Adding a New Image Model

1. Add model config to `IMAGE_MODELS` in `src/lib/image-models.ts`
2. If using a new provider (not OpenRouter/xAI), create a client in `src/lib/api/`
3. Wire it into `src/app/api/ai-image/route.ts`

---

## Known Limitations

- **No persistent cache on Vercel** — in-memory cache resets on cold starts. Consider Vercel KV (Redis) for production scale.
- **Stock image rate limits** — Unsplash (50 req/hr), Pexels (200 req/hr). Images are cached but limits apply on first load.
- **Skeleton countries** (142 of 195) have minimal data — only name, flag, region. Full profiles need manual curation or AI generation.
- **UN Comtrade API** requires registration for real data — app uses deterministic synthetic fallback without a key.
- **Mobile**: Uses 2D flat map instead of 3D globe (WebGL performance).

---

## License

MIT

---

Built for fashion studies research. Powered by AI.
