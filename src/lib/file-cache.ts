import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const AI_IMAGES_DIR = path.join(process.cwd(), 'src', 'data', 'ai-images');
const PROFILES_DIR = path.join(process.cwd(), 'src', 'data', 'profiles');

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 200);
}

export async function getFileCachedImage(key: string): Promise<string | null> {
  try {
    const filePath = path.join(AI_IMAGES_DIR, `${sanitizeKey(key)}.json`);
    const data = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.url || null;
  } catch {
    return null;
  }
}

export async function setFileCachedImage(
  key: string,
  url: string,
  prompt: string
): Promise<void> {
  try {
    await mkdir(AI_IMAGES_DIR, { recursive: true });
    const filePath = path.join(AI_IMAGES_DIR, `${sanitizeKey(key)}.json`);
    await writeFile(filePath, JSON.stringify({
      url,
      prompt,
      timestamp: Date.now(),
      key,
    }, null, 2));
  } catch (err) {
    console.error('Failed to save AI image to file cache:', err);
  }
}

export async function getFileCachedProfile<T>(iso: string): Promise<T | null> {
  try {
    const filePath = path.join(PROFILES_DIR, `${iso}.json`);
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setFileCachedProfile<T>(iso: string, profile: T): Promise<void> {
  try {
    await mkdir(PROFILES_DIR, { recursive: true });
    const filePath = path.join(PROFILES_DIR, `${iso}.json`);
    await writeFile(filePath, JSON.stringify(profile, null, 2));
  } catch (err) {
    console.error('Failed to save profile to file cache:', err);
  }
}
