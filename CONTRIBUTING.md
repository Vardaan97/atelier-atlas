# Contributing to Atelier Atlas

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/YOUR_USERNAME/atelier-atlas.git
   cd atelier-atlas
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Start development:
   ```bash
   npm run dev
   ```

## Project Conventions

### Code Style
- **TypeScript strict mode** — no `any` types without explicit reason
- **Tailwind CSS 4** — use utility classes, avoid inline styles
- Use `cn()` from `src/lib/utils.ts` for conditional class merging (clsx + tailwind-merge)
- Components are `'use client'` only when they use hooks, event handlers, or browser APIs

### File Organization
- **Components**: `src/components/{category}/{ComponentName}.tsx`
- **Hooks**: `src/hooks/use{HookName}.ts`
- **API routes**: `src/app/api/{endpoint}/route.ts`
- **Types**: `src/types/{domain}.ts`
- **Utilities**: `src/lib/{module}.ts`

### Naming
- Components: PascalCase (`FashionGlobe.tsx`)
- Hooks: camelCase with `use` prefix (`useAiProfile.ts`)
- Utilities: camelCase (`formatCurrency`)
- Types/Interfaces: PascalCase (`CountryProfile`)
- Constants: SCREAMING_SNAKE_CASE (`CACHE_TTL`)

### State Management
- **Global state**: Zustand store (`src/store/useGlobeStore.ts`)
- **Server state**: Custom hooks with `fetch` + `AbortController`
- **Local state**: React `useState` / `useRef`
- Do NOT add new state management libraries without discussion

### API Route Pattern
All API routes follow a consistent pattern:
```typescript
export async function GET(request: NextRequest) {
  // 1. Check memory cache
  // 2. Check file cache (local dev only)
  // 3. Call external API
  // 4. Fallback to static/synthetic data
  // 5. Never return an error screen to the user
}
```

### Glass Panel Pattern
For new UI components, use the glassmorphism pattern:
```tsx
<div className="glass-panel rounded-xl p-4">
  {/* content */}
</div>
```

The `glass-panel` class is defined in `globals.css`.

## Common Tasks

### Adding Country Data
1. Open `src/data/countries.json`
2. Find the country by ISO code
3. Fill in fields: `traditionalGarments`, `colorPalette`, `primaryFabrics`, `keyDesigners`, `industryStats`
4. Update `tier` field: `skeleton` → `C` → `B` → `A` based on completeness
5. Run `npx tsx scripts/compute-similarity.ts` to update similarity
6. Run `npm run build` to verify types

### Adding a New Component
1. Create in appropriate subdirectory under `src/components/`
2. Export from the file (no barrel exports / index.ts needed)
3. Import directly where used

### Modifying the Globe
- Globe component: `src/components/globe/FashionGlobe.tsx`
- Uses `dynamic(() => import('react-globe.gl'), { ssr: false })` — do NOT remove the ssr:false
- GeoJSON source: Natural Earth `ne_110m_admin_0_countries`
- Color mapping: `interpolateColor()` from `src/lib/utils.ts`

### Testing Locally
```bash
npm run build    # Type-check + build
npm run lint     # ESLint
```

## Architecture Decisions

### Why react-globe.gl?
- Mature Three.js wrapper, good React integration
- Built-in polygon/point/arc layers
- Active maintenance, good docs

### Why Zustand (not Redux/Jotai)?
- Minimal boilerplate, no providers needed
- Good TypeScript inference
- Small bundle size

### Why No Database?
- All country data is static JSON (~800KB)
- AI profiles cached as JSON files
- No user accounts or dynamic data in current scope
- Simplifies deployment (no DB migrations, no connection strings)

### Why Synthetic Trade Data Fallback?
- UN Comtrade requires registration and has rate limits
- Seeded PRNG (`seed = sum of char codes`) ensures deterministic output
- Same country always shows the same synthetic data

## Pull Request Guidelines

1. Create a feature branch from `main`
2. Keep changes focused — one feature per PR
3. Run `npm run build` before submitting (must pass cleanly)
4. Describe what changed and why in the PR description
5. Include screenshots for UI changes

## Questions?

Open an issue on GitHub or reach out to the maintainer.
