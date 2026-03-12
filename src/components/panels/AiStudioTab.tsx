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
  Clock,
  ArrowRight,
  Eye,
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

/* Era-based left-border accent colors */
const eraColors: Record<string, string> = {
  ancient: '#C9A84C',
  classical: '#7B68EE',
  medieval: '#CD853F',
  colonial: '#4682B4',
  modern: '#E94560',
  contemporary: '#00CED1',
};

function getEraColor(era: string): string {
  const lower = era.toLowerCase();
  for (const [key, color] of Object.entries(eraColors)) {
    if (lower.includes(key)) return color;
  }
  return '#E94560';
}

/* Sparkle particle for the hero section */
function SparkleParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-accent/60"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: '20%',
      }}
      initial={{ opacity: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        y: [0, -30, -60],
        scale: [0, 1, 0.5],
      }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: 'easeOut',
      }}
    />
  );
}

/* Shimmer loading card for generation state */
function GeneratingShimmer({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl overflow-hidden"
    >
      <div className="relative h-48 bg-gradient-to-br from-accent/5 via-secondary/10 to-accent/5 overflow-hidden">
        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ width: '50%' }}
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-8 h-8 text-accent/60" />
          </motion.div>
          <div className="text-center">
            <p className="text-xs font-medium text-accent/80">Creating your vision</p>
            <p className="text-[10px] text-muted/60 mt-0.5">{label}</p>
          </div>
          {/* Pulsing dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-accent/50"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* Suggestion chips for custom prompt */
const PROMPT_SUGGESTIONS = [
  'Traditional wedding',
  'Street style',
  'Royal attire',
  'Festival wear',
  'Ceremonial dress',
  'Modern fusion',
];

export function AiStudioTab({ country, profile, profileLoading }: AiStudioTabProps) {
  const [view, setView] = useState<'menu' | 'garment-detail' | 'gallery'>('menu');
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingLabel, setGeneratingLabel] = useState<string>('');
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
      setGeneratingLabel(label);
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
        setGeneratingLabel('');
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
    const borderColor = getEraColor(selectedGarment.era);
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
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to AI Studio
        </button>

        <div
          className="glass-panel rounded-xl p-5 border-l-2"
          style={{ borderLeftColor: borderColor }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${borderColor}15` }}
            >
              <Shirt className="w-5 h-5" style={{ color: borderColor }} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg leading-tight">
                {selectedGarment.name}
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                {selectedGarment.era} · {selectedGarment.occasion}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted leading-relaxed mb-4">
            {selectedGarment.description}
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
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
            <div className="mt-3 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Generating shimmer */}
        <AnimatePresence>
          {generatingId && <GeneratingShimmer label={selectedGarment.name} />}
        </AnimatePresence>

        {/* Show generated images for this garment */}
        {generatedImages
          .filter((img) => img.label === selectedGarment.name)
          .map((img) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl overflow-hidden group"
            >
              <div className="relative max-h-[500px] overflow-hidden bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.label}
                  className="w-full max-h-[500px] object-contain bg-black/30"
                />
                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        downloadImage(
                          img.url,
                          `${img.label.replace(/\s+/g, '-').toLowerCase()}-${img.id}.png`
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-xs text-white hover:bg-white/20 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                    <button
                      onClick={() => handleGarmentGenerate(selectedGarment)}
                      disabled={!!generatingId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/80 backdrop-blur-sm text-xs text-white hover:bg-accent transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="text-[10px] text-muted font-mono">
                  AI Generated
                </span>
                <div className="flex items-center gap-3 md:hidden">
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
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to AI Studio
        </button>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-accent" />
            Generated Gallery
          </h3>
          <span className="text-[10px] font-mono text-muted/60 bg-white/5 px-2 py-0.5 rounded-full">
            {generatedImages.length} image{generatedImages.length !== 1 ? 's' : ''}
          </span>
        </div>

        {generatedImages.length === 0 ? (
          <div className="glass-panel rounded-xl p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/5 flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-7 h-7 text-muted/30" />
            </div>
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
                className="glass-panel rounded-xl overflow-hidden group relative"
              >
                <div className="overflow-hidden bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full aspect-[3/4] object-cover bg-black/30 group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                    <p className="text-xs font-medium text-white truncate">{img.label}</p>
                    <p className="text-[9px] text-white/60 font-mono capitalize mb-2">
                      {img.source}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(
                            img.url,
                            `${img.label.replace(/\s+/g, '-').toLowerCase()}-${img.id}.png`
                          );
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/15 backdrop-blur-sm text-[10px] text-white hover:bg-white/25 transition-colors"
                      >
                        <Download className="w-2.5 h-2.5" />
                        Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateImage(img.prompt, img.label, img.source);
                        }}
                        disabled={!!generatingId}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/60 backdrop-blur-sm text-[10px] text-white hover:bg-accent/80 transition-colors"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Redo
                      </button>
                    </div>
                  </div>
                  {/* Label badge */}
                  <div className="absolute top-2 left-2 opacity-100 group-hover:opacity-0 transition-opacity">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-[9px] font-medium text-white/80 truncate max-w-[100px]">
                      {img.label}
                    </span>
                  </div>
                </div>
                {/* Mobile fallback info (no hover) */}
                <div className="p-2 flex items-center justify-between md:hidden">
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-secondary/10 to-accent/5 rounded-xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(233,69,96,0.08)_0%,_transparent_70%)]" />
        {/* Sparkle particles */}
        <SparkleParticle delay={0} x={15} size={3} />
        <SparkleParticle delay={0.8} x={45} size={2} />
        <SparkleParticle delay={1.6} x={75} size={4} />
        <SparkleParticle delay={0.4} x={90} size={2} />
        <SparkleParticle delay={1.2} x={30} size={3} />

        <div className="relative px-5 py-5">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-gradient tracking-wide">
                AI Fashion Studio
              </h3>
              <p className="text-[10px] text-muted/70 font-mono">
                Powered by generative AI
              </p>
            </div>
            {generatedImages.length > 0 && (
              <button
                onClick={() => setView('gallery')}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-accent hover:bg-white/10 transition-all group"
              >
                <ImageIcon className="w-3 h-3" />
                <span className="font-mono">Gallery ({generatedImages.length})</span>
                <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
          <p className="text-xs text-muted/80 leading-relaxed max-w-[90%]">
            Generate AI images of traditional garments and fashion from{' '}
            <span className="text-foreground font-medium">{country.name}</span>.
            Click any garment to create historically accurate fashion imagery.
          </p>
        </div>
      </div>

      {/* Garments Section */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
          <Shirt className="w-3.5 h-3.5 text-accent" />
          Traditional Garments
          <span className="text-[9px] text-muted/40 ml-auto font-mono">
            {country.traditionalGarments.length} items
          </span>
        </h4>

        {country.traditionalGarments.length === 0 ? (
          <div className="glass-panel rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-2">
              <Shirt className="w-6 h-6 text-muted/30" />
            </div>
            <p className="text-xs text-muted">No garment data available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {country.traditionalGarments.map((garment, i) => {
              const borderColor = getEraColor(garment.era);
              return (
                <motion.button
                  key={garment.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setSelectedGarment(garment);
                    setView('garment-detail');
                  }}
                  className="w-full glass-panel rounded-xl p-4 text-left flex items-center gap-3 group transition-all duration-200 hover:shadow-[0_0_15px_rgba(233,69,96,0.08)] hover:border-white/15 border-l-2"
                  style={{ borderLeftColor: borderColor }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${borderColor}15, ${borderColor}08)`,
                    }}
                  >
                    <Shirt className="w-5 h-5 transition-colors" style={{ color: borderColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                      {garment.name}
                    </h5>
                    <p className="text-[11px] text-muted truncate">
                      {garment.era} · {garment.occasion}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
                    <Wand2 className="w-3.5 h-3.5 text-muted group-hover:text-accent transition-colors" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Fashion Eras Section (from AI profile) */}
      {profile?.eras && profile.eras.length > 0 && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            Fashion Eras
            <span className="text-[9px] text-muted/40 ml-auto font-mono">
              {profile.eras.length} periods
            </span>
          </h4>
          <div className="space-y-2">
            {profile.eras.map((era, i) => (
              <motion.div
                key={era.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (country.traditionalGarments.length + i) * 0.05 }}
                className="glass-panel rounded-xl p-4 relative overflow-hidden group"
              >
                {/* Gradient accent line at top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/60 via-accent/20 to-transparent" />

                <div className="flex items-center gap-3">
                  {/* Year range badge */}
                  <div className="shrink-0 flex flex-col items-center min-w-[52px]">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 border border-accent/10">
                      <Clock className="w-2.5 h-2.5 text-accent/70" />
                      <span className="text-[9px] font-mono text-accent/80 whitespace-nowrap">
                        {era.yearRange[0]}
                      </span>
                    </div>
                    <div className="w-px h-2 bg-white/10" />
                    <span className="text-[9px] font-mono text-muted/50">
                      {era.yearRange[1]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium truncate">{era.name}</h5>
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
                        : 'bg-accent/10 text-accent hover:bg-accent/20 group-hover:bg-accent/15'
                    )}
                  >
                    {generatingId ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                    )}
                    Generate
                  </button>
                </div>
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
          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() =>
                  setCustomPrompt(
                    `${suggestion} from ${country.name}: `
                  )
                }
                className="px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-[10px] text-muted hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={`Describe a fashion scene from ${country.name}...`}
              rows={3}
              maxLength={500}
              className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted/50 outline-none border border-white/10 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 resize-none transition-colors"
            />
            {/* Character count */}
            <span className="absolute bottom-2 right-2.5 text-[9px] font-mono text-muted/40">
              {customPrompt.length}/500
            </span>
          </div>

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
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="glass-panel rounded-xl p-3 border-red-400/20 bg-gradient-to-r from-red-500/5 to-transparent"
            style={{ borderLeft: '2px solid rgba(248, 113, 113, 0.5)' }}
          >
            <p className="text-xs text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generating shimmer (main menu) */}
      <AnimatePresence>
        {generatingId && <GeneratingShimmer label={generatingLabel} />}
      </AnimatePresence>

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
              className="text-[10px] text-accent hover:text-accent-hover transition-colors flex items-center gap-1 group"
            >
              View All
              <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {generatedImages.slice(0, 3).map((img) => (
              <div
                key={img.id}
                className="glass-panel rounded-lg overflow-hidden cursor-pointer group relative hover:ring-1 hover:ring-accent/40 hover:shadow-[0_0_12px_rgba(233,69,96,0.1)] transition-all"
                onClick={() => setView('gallery')}
              >
                <div className="overflow-hidden bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full aspect-square object-cover bg-black/30 group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Hover overlay with label + download */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                    <p className="text-[10px] font-medium text-white truncate">{img.label}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(
                            img.url,
                            `${img.label.replace(/\s+/g, '-').toLowerCase()}-${img.id}.png`
                          );
                        }}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                        title="Download"
                      >
                        <Download className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
