const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface TextOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export async function generateText(
  messages: ChatMessage[],
  options: TextOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const {
    model = 'google/gemini-3-flash-preview',
    temperature = 0.7,
    maxTokens = 4096,
    jsonMode = false,
  } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://atelier-atlas.vercel.app',
      'X-Title': 'Atelier Atlas',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

/** Generate image via OpenRouter chat completions (for models hosted on OpenRouter). */
export async function generateImageOpenRouter(
  prompt: string,
  modelId: string,
  imageOnly: boolean
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const body: Record<string, unknown> = {
    model: modelId,
    messages: [{ role: 'user', content: prompt }],
  };

  if (imageOnly) {
    body.modalities = ['image'];
  }

  const res = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://atelier-atlas.vercel.app',
      'X-Title': 'Atelier Atlas',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return extractImageFromResponse(data);
}

/** Legacy wrapper using default model — kept for backward compat. */
export async function generateImage(prompt: string): Promise<string | null> {
  return generateImageOpenRouter(prompt, 'google/gemini-3.1-flash-image-preview', false);
}

/** Extract image URL/base64 from various OpenRouter response formats. */
function extractImageFromResponse(data: Record<string, unknown>): string | null {
  const choice = (data.choices as Array<{
    message?: { content?: unknown; images?: unknown };
  }>)?.[0];
  const msg = choice?.message;
  const content = msg?.content;

  // Format 1: content is a base64 string or data URI
  if (typeof content === 'string') {
    if (content.startsWith('data:image')) return content;
    if (/^[A-Za-z0-9+/=]{100,}$/.test(content)) return `data:image/png;base64,${content}`;
  }

  // Format 2: content is an array of parts (OpenAI multimodal format)
  if (Array.isArray(content)) {
    for (const part of content) {
      const p = part as Record<string, unknown>;
      if (p.type === 'image_url') {
        const iu = p.image_url as { url?: string } | undefined;
        if (iu?.url) return iu.url;
      }
      if (p.type === 'image') {
        const im = p.image as { url?: string } | undefined;
        if (im?.url) return im.url;
      }
      if (p.inline_data) {
        const id = p.inline_data as { mime_type?: string; data?: string };
        if (id.data) return `data:${id.mime_type || 'image/png'};base64,${id.data}`;
      }
    }
  }

  // Format 3: message.images array (Gemini via OpenRouter, newer format)
  const images = msg?.images;
  if (Array.isArray(images)) {
    for (const img of images) {
      const i = img as Record<string, unknown>;
      // { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } }
      if (i.type === 'image_url') {
        const iu = i.image_url as { url?: string } | undefined;
        if (iu?.url) return iu.url;
      }
      // Direct URL string
      if (typeof i.url === 'string') return i.url;
      // Direct base64 string
      if (typeof i.data === 'string') {
        const mime = (i.mime_type as string) || 'image/png';
        return `data:${mime};base64,${i.data}`;
      }
    }
  }

  return null;
}
