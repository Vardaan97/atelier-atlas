# Atelier Atlas - Focused Usability Review

> Give this to Sonnet via Chrome extension while viewing localhost:3010

## App Description (for API signups)

> **Atelier Atlas** is an interactive 3D globe dashboard for global fashion intelligence. It visualizes traditional clothing, textiles, and fashion industry data across 195 countries. The application displays high-quality images of traditional garments, cultural textiles, and fashion photography alongside country profiles, trade data, and AI-generated fashion illustrations.

---

Review this 3D globe dashboard for USABILITY ONLY. Skip visual design opinions. Focus on these 5 areas:

## 1. Controls (Left Sidebar)
- Click each metric (Fashion Index, Market Size, Textile Exports, Sustainability, Population). Does the globe color change visibly for each?
- Click each overlay (Metric, Sustainability, Climate, Fashion Weeks). Does the globe change?
- Can you toggle an overlay OFF by clicking it again?
- Is it clear which control is currently active?

## 2. Country Interaction
- Click 3 different countries. Does the panel open each time?
- Do all 6 tabs load content? (Traditional, Colors, Timeline, Industry, Culture, Contemporary)
- Can you close the panel and return to the globe?
- Does the "Similar Fashion Cultures" section at the bottom work? Click one.

## 3. Search & Filters
- Press Cmd+K. Does search open? Type "silk" — do results appear?
- Click "Filters" on the left. Do filter controls appear? Can you filter by region?
- Click "Compare". Can you add 2 countries and see comparison data?

## 4. Navigation Flow
- Can a first-time user figure out what to do without instructions?
- Are there any dead-end states where you can't get back to the globe?
- Does clicking the globe background close any open panels?

## 5. Broken Elements
- List anything that doesn't respond to clicks
- List any text that overflows or gets cut off
- List any overlapping elements

## 6. AI Studio Tab
- Click a country, then click the "AI Studio" tab. Does it load?
- Are traditional garments listed? Click one — does the detail view open?
- Click "Generate AI Image" — does it start generating? Does an image appear?
- Try the "Fashion Eras" section — click "Generate" on an era. Does it work?
- Try the custom prompt field — type a description and generate.
- Check the Gallery view — do generated images show?

## 7. Images & Media
- Do garment images load in the Traditional tab? Are they relevant to the garment?
- Do textile images load in Colors & Textiles tab?
- Do timeline era images load in Fashion Timeline tab?
- Are any images showing faces instead of garments/outfits?
- Check India → Traditional → Sari — is the first image accurate?

## 8. Trade Intelligence
- Click a country → Industry tab. Does the "Detailed Trade Intelligence" section load?
- Does it show Trade Balance, Product Breakdown, and 5-Year Trend?
- Any JSON errors or broken data displays?

For each issue found, state: WHAT happened, WHERE (which element), and EXPECTED behavior. Keep it concise — bullet points only.

---

# Separate Prompt: Traditional Garment Image Accuracy Review

> Give this to Sonnet via Chrome extension while viewing localhost:3010. Focus ONLY on image relevancy.

Review the **Traditional** tab images for each country listed below. For each country, click the country on the globe, go to the "Traditional" tab, and evaluate EVERY garment image shown.

**Countries to review**: India, Japan, France, Italy, Nigeria, Mexico, China, Morocco, Brazil, South Korea

For EACH garment image, evaluate:
1. **Relevancy**: Does the image actually show the named garment? (e.g., if it says "Sari", is a sari shown?)
2. **Accuracy**: Is it the correct style/region? (e.g., Indian sari vs generic draped fabric)
3. **Focus**: Does the image show the full garment/outfit, or just a face/closeup?
4. **Cultural authenticity**: Does it look like authentic traditional clothing, not a costume or modern interpretation?

**Output format** (for each country):
```
## [Country Name]
- [Garment Name]: [PASS/FAIL] — [brief reason if FAIL, e.g. "Shows face closeup, not the garment" or "Image is of a different garment entirely"]
- Suggested query improvement: "[better search query that would return more accurate results]"
```

After reviewing all countries, provide a summary:
- Total garments reviewed
- Pass rate (%)
- Top 3 most common image issues
- Recommended query pattern improvements to fix accuracy
