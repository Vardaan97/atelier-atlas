/**
 * Image generation model registry.
 *
 * Set IMAGE_GEN_MODEL in .env.local to switch.
 * Set XAI_API_KEY for Grok models.
 */

export interface ImageModel {
  id: string;
  name: string;
  provider: 'openrouter' | 'xai';
  modelId: string;
  /** 'chat' = OpenRouter-style chat completions, 'images' = OpenAI-style /images/generations */
  apiFormat: 'chat' | 'images';
  /** true if the model only outputs images (no text), requires modalities: ["image"] */
  imageOnly: boolean;
  costNote: string;
}

export const IMAGE_MODELS: Record<string, ImageModel> = {
  'nano-banana-2': {
    id: 'nano-banana-2',
    name: 'Nano Banana 2 (Gemini 3.1 Flash)',
    provider: 'openrouter',
    modelId: 'google/gemini-3.1-flash-image-preview',
    apiFormat: 'chat',
    imageOnly: false,
    costNote: '~$0.50/M in, $3/M out',
  },
  'nano-banana-pro': {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro (Gemini 3 Pro)',
    provider: 'openrouter',
    modelId: 'google/gemini-3-pro-image-preview',
    apiFormat: 'chat',
    imageOnly: false,
    costNote: '$2/M in, $12/M out — 2K/4K support',
  },
  'gpt5-image': {
    id: 'gpt5-image',
    name: 'GPT-5 Image',
    provider: 'openrouter',
    modelId: 'openai/gpt-5-image',
    apiFormat: 'chat',
    imageOnly: false,
    costNote: '$10/M in, $10/M out — top tier',
  },
  'gpt5-image-mini': {
    id: 'gpt5-image-mini',
    name: 'GPT-5 Image Mini',
    provider: 'openrouter',
    modelId: 'openai/gpt-5-image-mini',
    apiFormat: 'chat',
    imageOnly: false,
    costNote: 'Cheaper than GPT-5 Image',
  },
  'seedream-4.5': {
    id: 'seedream-4.5',
    name: 'Seedream 4.5 (ByteDance)',
    provider: 'openrouter',
    modelId: 'bytedance-seed/seedream-4.5',
    apiFormat: 'chat',
    imageOnly: true,
    costNote: '$0.04/image',
  },
  'riverflow-v2-fast': {
    id: 'riverflow-v2-fast',
    name: 'Riverflow V2 Fast',
    provider: 'openrouter',
    modelId: 'sourceful/riverflow-v2-fast',
    apiFormat: 'chat',
    imageOnly: true,
    costNote: '$0.02/image — fastest',
  },
  'riverflow-v2-pro': {
    id: 'riverflow-v2-pro',
    name: 'Riverflow V2 Pro',
    provider: 'openrouter',
    modelId: 'sourceful/riverflow-v2-pro',
    apiFormat: 'chat',
    imageOnly: true,
    costNote: '$0.15/image — best Riverflow',
  },
  'grok-2-image': {
    id: 'grok-2-image',
    name: 'Grok 2 Image (xAI Aurora)',
    provider: 'xai',
    modelId: 'grok-2-image',
    apiFormat: 'images',
    imageOnly: true,
    costNote: '$0.07/image — needs XAI_API_KEY',
  },
  'grok-imagine': {
    id: 'grok-imagine',
    name: 'Grok Imagine Image (xAI)',
    provider: 'xai',
    modelId: 'grok-imagine-image',
    apiFormat: 'images',
    imageOnly: true,
    costNote: '~$0.07/image — newer, needs XAI_API_KEY',
  },
};

const DEFAULT_MODEL = 'nano-banana-2';

export function getActiveImageModel(): ImageModel {
  const envModel = process.env.IMAGE_GEN_MODEL;
  if (envModel && IMAGE_MODELS[envModel]) return IMAGE_MODELS[envModel];
  return IMAGE_MODELS[DEFAULT_MODEL];
}

export function listImageModels(): ImageModel[] {
  return Object.values(IMAGE_MODELS);
}
