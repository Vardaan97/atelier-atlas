#!/usr/bin/env node
/**
 * Pre-generate AI profiles for Tier A countries.
 *
 * Prerequisites:
 *   1. Set OPENROUTER_API_KEY environment variable
 *   2. Start dev server: PORT=3005 npm run dev
 *
 * Usage:
 *   OPENROUTER_API_KEY=your-key node scripts/generate-profiles.js
 *
 * Profiles are saved to src/data/profiles/{iso}.json
 * and reused automatically by the API routes.
 */

const fs = require('fs');
const path = require('path');

const TIER_A = ['FR', 'IT', 'US', 'GB', 'JP', 'CN', 'IN', 'KR', 'DE', 'ES', 'BR', 'AU', 'AE', 'SE', 'TR'];
const API_BASE = process.env.API_BASE || 'http://localhost:3005';
const outputDir = path.join(__dirname, '..', 'src', 'data', 'profiles');

async function main() {
  console.log('Atelier Atlas — AI Profile Pre-Generation');
  console.log('==========================================');
  console.log(`API: ${API_BASE}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Countries: ${TIER_A.length} Tier A\n`);

  fs.mkdirSync(outputDir, { recursive: true });

  let success = 0;
  let failed = 0;

  for (const iso of TIER_A) {
    process.stdout.write(`  ${iso}... `);

    try {
      const res = await fetch(`${API_BASE}/api/ai-profile/${iso}`);
      const json = await res.json();

      if (json.data) {
        fs.writeFileSync(
          path.join(outputDir, `${iso}.json`),
          JSON.stringify(json.data, null, 2)
        );
        console.log('done');
        success++;
      } else {
        console.log(`SKIP (${json.error})`);
        failed++;
      }
    } catch (err) {
      console.log(`ERROR (${err.message})`);
      failed++;
    }

    // Rate limit: 2s between requests
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n${success} generated, ${failed} failed`);
  console.log(`Profiles saved to: ${outputDir}`);
}

main().catch(console.error);
