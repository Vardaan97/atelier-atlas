/**
 * Device capability detection for adaptive rendering quality.
 * Detects GPU tier, memory, core count to determine rendering quality.
 */

export type QualityTier = 'high' | 'medium' | 'low';

let cached: QualityTier | null = null;

export function getQualityTier(): QualityTier {
  if (cached !== null) return cached;
  if (typeof window === 'undefined') {
    cached = 'medium';
    return cached;
  }

  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const memory: number = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 4;

  let gpuLowEnd = false;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        const gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL).toLowerCase();
        gpuLowEnd = /mali-[4t]|adreno\s*[34]\d|powervr|sgx|vivante|videocore/i.test(gpu);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } else {
      gpuLowEnd = true;
    }
  } catch {
    gpuLowEnd = true;
  }

  if (gpuLowEnd || (isAndroid && memory <= 3) || cores <= 2) {
    cached = 'low';
  } else if (!isMobile || memory >= 6) {
    cached = 'high';
  } else {
    cached = 'medium';
  }

  console.log(
    `[Atelier] Quality: ${cached} (mobile:${isMobile} android:${isAndroid} mem:${memory}GB cores:${cores} gpuLow:${gpuLowEnd})`
  );
  return cached;
}
