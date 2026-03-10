/**
 * xAI (Grok) image generation client.
 * Uses OpenAI-compatible /images/generations endpoint.
 */

const XAI_API_BASE = 'https://api.x.ai/v1';

export async function generateImageXAI(
  prompt: string,
  modelId: string = 'grok-2-image'
): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`${XAI_API_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      prompt,
      n: 1,
      size: '1024x1024',
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const imageData = (data.data as Array<{ url?: string; b64_json?: string }>)?.[0];
  if (!imageData) return null;

  if (imageData.url) return imageData.url;
  if (imageData.b64_json) return `data:image/jpeg;base64,${imageData.b64_json}`;
  return null;
}
