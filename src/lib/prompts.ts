import type { CountryBase } from '@/types/country';

export function buildProfilePrompt(country: CountryBase) {
  const garmentNames = country.traditionalGarments.map(g => g.name).join(', ') || 'none listed';
  const fabricNames = country.primaryFabrics.join(', ') || 'none listed';
  const fashionWeeks = country.fashionWeeks.join(', ') || 'none';
  const designers = country.keyDesigners.map(d => `${d.name} (${d.specialty})`).join(', ') || 'none listed';

  const system = `You are a world-class fashion historian and cultural intelligence analyst. You produce detailed, accurate fashion profiles for countries. Your output must be valid JSON matching the exact schema provided. Be specific, culturally authentic, and avoid stereotypes. Use real historical facts and current industry data.`;

  const user = `Generate a comprehensive fashion intelligence profile for ${country.name}.

Country context:
- Region: ${country.region} (${country.subregion})
- Capital: ${country.capital}
- Population: ${country.population.toLocaleString()}
- Known traditional garments: ${garmentNames}
- Known fabrics: ${fabricNames}
- Fashion weeks: ${fashionWeeks}
- Known designers: ${designers}
- Market size: $${country.marketSize}B
- Sustainability score: ${country.sustainabilityScore}/100

Return a JSON object with this EXACT structure:
{
  "fashionDNA": {
    "traditionalism": <0-100>,
    "innovation": <0-100>,
    "sustainability": <0-100>,
    "luxuryIndex": <0-100>,
    "streetwearInfluence": <0-100>,
    "craftsmanship": <0-100>,
    "globalInfluence": <0-100>
  },
  "eras": [
    {
      "id": "<kebab-case-id>",
      "name": "<Era Name>",
      "yearRange": [<startYear>, <endYear>],
      "description": "<2-3 sentence description of fashion in this era>",
      "keyGarments": ["<garment1>", "<garment2>"],
      "aiImagePrompt": "<detailed prompt for generating an image of typical clothing from this era>"
    }
  ],
  "textiles": [
    {
      "name": "<Textile Name>",
      "type": "<Woven|Knitted|Printed|Dyed|Embroidered|Felted>",
      "description": "<1-2 sentence description>",
      "origin": "<specific region/city>",
      "technique": "<production technique>"
    }
  ],
  "climate": {
    "zone": "<climate zone name>",
    "avgTemp": <average annual temperature in Celsius>,
    "humidity": "<Low|Moderate|High|Very High>",
    "fashionImplication": "<1-2 sentences about how climate shapes fashion choices>"
  },
  "culturalInfluences": ["<influence1>", "<influence2>", "..."],
  "contemporaryScene": {
    "fashionWeeks": [
      {
        "name": "<Fashion Week Name>",
        "city": "<city>",
        "month": "<month(s)>",
        "tier": "<Big Four|Major|Emerging>"
      }
    ],
    "emergingTrends": ["<trend1>", "<trend2>", "..."],
    "digitalPresence": <0-100>,
    "ecommercePenetration": <0-100>,
    "notableEvents": ["<event1>", "<event2>", "..."]
  }
}

Requirements:
- Include 5-8 fashion eras spanning the country's history
- Include 3-5 notable textiles/fabrics
- Include 5-8 cultural influences
- Include 3-5 emerging trends
- fashionDNA values should reflect the country's actual fashion character
- aiImagePrompt should be detailed enough to generate a realistic historical fashion illustration
- All data should be factually accurate`;

  return { system, user };
}

export function buildEraImagePrompt(
  countryName: string,
  eraName: string,
  yearRange: [number, number],
  keyGarments: string[]
): string {
  return `A museum-quality illustration of traditional clothing from ${countryName} during the ${eraName} period (${yearRange[0]}-${yearRange[1]}). Show a person wearing ${keyGarments.join(' and ')}. Historically accurate textile patterns, authentic colors, and period-appropriate details. Soft, warm lighting. Detailed fabric textures visible. Professional fashion illustration style.`;
}
