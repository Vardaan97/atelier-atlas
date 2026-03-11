'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Wand2,
  Loader2,
  Image as ImageIcon,
  ChevronLeft,
  Shirt,
  Calendar,
  Tag,
  Layers,
  Download,
  RefreshCw,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CountryBase, CountryProfile, Garment, FashionEra } from '@/types/country';

interface AiStudioTabProps {
  country: CountryBase;
  profile: CountryProfile | null;
  profileLoading: boolean;
}

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  label: string;
  source: 'garment' | 'era' | 'custom';
  timestamp: number;
}

// Client-side gallery cache so generated images persist across tab switches
const galleryCache = new Map<string, GeneratedImage[]>();

/** Download a base64 data-URI (or regular URL) as a file */
function downloadImage(url: string, filename: string) {
  // For base64 data URIs, convert to blob for a cleaner download
  if (url.startsWith('data:')) {
    const [header, b64] = url.split(',');
    const mime = header.match(/data:(.*?);/)?.[1] || 'image/png';
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export function AiStudioTab({ country, profile, profileLoading }: AiStudioTabProps) {
  const [view, setView] = useState<'menu' | 'garment-detail' | 'gallery'>('menu');
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(
    () => galleryCache.get(country.iso) || []
  );
  const [error, setError] = useState<string | null>(null);

  // Ref to always read the latest images — avoids stale closure in generateImage
  const imagesRef = useRef(generatedImages);
  imagesRef.current = generatedImages;

  const saveToCache = useCallback(
    (updater: (prev: GeneratedImage[]) => GeneratedImage[]) => {
      setGeneratedImages((prev) => {
        const next = updater(prev);
        galleryCache.set(country.iso, next);
        return next;
      });
    },
    [country.iso]
  );

  const generateImage = useCallback(
    async (prompt: string, label: string, source: GeneratedImage['source']) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setGeneratingId(id);
      setError(null);

      try {
        const res = await fetch('/api/ai-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            cacheKey: `ai-studio:${country.iso}:${prompt.slice(0, 80)}`,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Generation failed (${res.status}): ${text.slice(0, 100)}`);
        }

        const json = await res.json();
        if (json.data?.url) {
          const img: GeneratedImage = {
            id,
            prompt,
            url: json.data.url,
            label,
            source,
            timestamp: Date.now(),
          };
          saveToCache((prev) => [img, ...prev]);
        } else {
          throw new Error(json.error || 'No image returned');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed');
      } finally {
        // Small delay before allowing next generation to prevent double-clicks
        await new Promise((r) => setTimeout(r, 100));
        setGeneratingId(null);
      }
    },
    [country.iso, saveToCache]
  );

  const handleGarmentGenerate = useCallback(
    (garment: Garment) => {
      const prompt = `Professional fashion studio photograph of a ${garment.name} from ${country.name}. Full-length view showing the complete garment on a person standing against a clean neutral gray studio backdrop. Sharp focus on fabric texture, draping, embroidery details, and traditional patterns. The ${garment.name} is made from ${garment.materials.join(' and ')}. Era: ${garment.era}. Soft diffused studio lighting, fashion catalog style, white/gray seamless background. No distracting scenery.`;
      generateImage(prompt, garment.name, 'garment');
    },
    [country.name, generateImage]
  );

  const handleEraGenerate = useCallback(
    (era: FashionEra) => {
      const prompt =
        era.aiImagePrompt ||
        `Fashion catalog photograph showing traditional ${country.name} clothing from the ${era.name} period (${era.yearRange[0]}-${era.yearRange[1]}). A person wearing ${era.keyGarments.join(' and ')} standing full-length against a clean neutral studio backdrop. Focus entirely on the garments: fabric details, traditional patterns, colors, layering, and accessories. Professional studio lighting on a seamless gray/white background. No environmental scenery, no buildings, no landscapes.`;
      generateImage(prompt, `${era.name} (${era.yearRange[0]}-${era.yearRange[1]})`, 'era');
    },
    [country.name, generateImage]
  );

  const handleCustomGenerate = useCallback(() => {
    if (!customPrompt.trim()) return;
    generateImage(customPrompt.trim(), 'Custom', 'custom');
    setCustomPrompt('');
  }, [customPrompt, generateImage]);

  // ---- Garment Detail View ----
  if (view === 'garment-detail' && selectedGarment) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <button
          onClick={() => {
            setView('menu');
            setSelectedGarment(null);
          }}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to AI Studio
        </button>

        <div className="glass-panel rounded-xl p-5">
          <h3 className="font-heading font-bold text-lg mb-1">
            {selectedGarment.name}
          </h3>
          <p className="text-sm text-muted leading-relaxed mb-4">
            {selectedGarment.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-muted">
              <Calendar className="w-3 h-3" />
              {selectedGarment.era}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-muted">
              <Tag className="w-3 h-3" />
              {selectedGarment.occasion}
            </span>
            {selectedGarment.materials.map((mat) => (
              <span
                key={mat}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-[11px] text-accent"
              >
                <Layers className="w-3 h-3" />
                {mat}
              </span>
            ))}
          </div>

          <button
            onClick={() => handleGarmentGenerate(selectedGarment)}
            disabled={!!generatingId}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all',
              generatingId
                ? 'bg-accent/20 text-accent/60 cursor-wait'
                : 'bg-accent hover:bg-accent-hover text-white glow-accent'
            )}
          >
            {generatingId ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate AI Image
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
          )}
        </div>

        {/* Show generated images for this garment */}
        {generatedImages
          .filter((img) => img.label === selectedGarment.name)
          .map((img) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl overflow-hidden"
            >
              <div className="max-h-[500px] overflow-hidden bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full max-h-[500px] object-contain bg-black/30"
                />
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-[10px] text-muted font-mono">
                  AI Generated
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      downloadImage(
                        img.url,
                        `${img.label.replace(/\s+/g, '-').toLowerCase()}-${img.id}.png`
                      )
                    }
                    className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                  <button
                    onClick={() => handleGarmentGenerate(selectedGarment)}
                    disabled={!!generatingId}
                    className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
      </motion.div>
    );
  }

  // ---- Gallery View ----
  if (view === 'gallery') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <button
          onClick={() => setView('menu')}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to AI Studio
        </button>

        <h3 className="text-sm font-medium text-muted uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-accent" />
          Generated Gallery ({generatedImages.length})
        </h3>

        {generatedImages.length === 0 ? (
          <div className="glass-panel rounded-xl p-8 text-center">
            <ImageIcon className="w-8 h-8 text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">No images generated yet</p>
            <p className="text-xs text-muted/50 mt-1">
              Select a garment or era to generate AI fashion images
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {generatedImages.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel rounded-xl overflow-hidden group"
              >
                <div className="max-h-[280px] overflow-hidden bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full max-h-[280px] object-contain bg-black/30"
                  />
                </div>
                <div className="p-2 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{img.label}</p>
                    <p className="text-[9px] text-muted font-mono capitalize">
                      {img.source}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(
                        img.url,
                        `${img.label.replace(/\s+/g, '-').toLowerCase()}-${img.id}.png`
                      );
                    }}
                    className="shrink-0 ml-2 text-muted hover:text-foreground transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // ---- Main Menu View ----
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          AI Fashion Studio
        </h3>
        {generatedImages.length > 0 && (
          <button
            onClick={() => setView('gallery')}
            className="ml-auto text-[10px] text-accent hover:text-accent-hover transition-colors font-mono flex items-center gap-1"
          >
            <ImageIcon className="w-3 h-3" />
            Gallery ({generatedImages.length})
          </button>
        )}
      </div>

      <p className="text-xs text-muted leading-relaxed">
        Generate AI images of traditional garments and fashion from {country.name}.
        Click any garment to see details and create accurate historical fashion imagery.
      </p>

      {/* Garments Section */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
          <Shirt className="w-3.5 h-3.5 text-accent" />
          Traditional Garments
        </h4>

        {country.traditionalGarments.length === 0 ? (
          <div className="glass-panel rounded-xl p-4 text-center">
            <Shirt className="w-6 h-6 text-muted/30 mx-auto mb-1" />
            <p className="text-xs text-muted">No garment data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {country.traditionalGarments.map((garment, i) => (
              <motion.button
                key={garment.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setSelectedGarment(garment);
                  setView('garment-detail');
                }}
                className="w-full glass-panel glass-panel-hover rounded-xl p-4 text-left flex items-center gap-3 group transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                  <Shirt className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                    {garment.name}
                  </h5>
                  <p className="text-[11px] text-muted truncate">
                    {garment.era} · {garment.occasion}
                  </p>
                </div>
                <Wand2 className="w-4 h-4 text-muted/40 group-hover:text-accent transition-colors shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Fashion Eras Section (from AI profile) */}
      {profile?.eras && profile.eras.length > 0 && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            Fashion Eras
          </h4>
          <div className="space-y-2">
            {profile.eras.map((era, i) => (
              <motion.div
                key={era.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (country.traditionalGarments.length + i) * 0.05 }}
                className="glass-panel rounded-xl p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium truncate">{era.name}</h5>
                  <p className="text-[10px] text-muted font-mono">
                    {era.yearRange[0]} — {era.yearRange[1]}
                  </p>
                  <p className="text-[11px] text-muted truncate mt-0.5">
                    {era.keyGarments.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => handleEraGenerate(era)}
                  disabled={!!generatingId}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    generatingId
                      ? 'bg-white/5 text-muted cursor-wait'
                      : 'bg-accent/10 text-accent hover:bg-accent/20'
                  )}
                >
                  {generatingId ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  Generate
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {profileLoading && (
        <div className="glass-panel rounded-xl p-4 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 text-accent animate-spin" />
          <span className="text-xs text-muted">Loading AI profile for era data...</span>
        </div>
      )}

      {/* Custom Prompt Section */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-accent" />
          Custom Prompt
        </h4>
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={`Describe a fashion scene from ${country.name}...`}
            rows={3}
            className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/50 outline-none border border-white/10 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 resize-none transition-colors"
          />
          <button
            onClick={handleCustomGenerate}
            disabled={!!generatingId || !customPrompt.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              generatingId || !customPrompt.trim()
                ? 'bg-white/5 text-muted cursor-not-allowed'
                : 'bg-accent hover:bg-accent-hover text-white glow-accent'
            )}
          >
            {generatingId ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Image
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="glass-panel rounded-xl p-3 border-red-400/20 bg-red-400/5">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Recent generations preview */}
      {generatedImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-accent" />
              Recent Generations
            </h4>
            <button
              onClick={() => setView('gallery')}
              className="text-[10px] text-accent hover:text-accent-hover transition-colors"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {generatedImages.slice(0, 3).map((img) => (
              <div
                key={img.id}
                className="glass-panel rounded-lg overflow-hidden cursor-pointer hover:ring-1 hover:ring-accent/40 transition-all"
                onClick={() => setView('gallery')}
              >
                <div className="max-h-[120px] overflow-hidden bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full max-h-[120px] object-contain bg-black/30"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
