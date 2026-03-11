'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointerClick } from 'lucide-react';
import { useGlobeStore } from '@/store/useGlobeStore';

const STORAGE_KEY = 'atelier-atlas-onboarded';
const AUTO_DISMISS_MS = 5000;

export function OnboardingHint() {
  const [visible, setVisible] = useState(false);
  const selectedCountry = useGlobeStore((s) => s.selectedCountry);
  const globeReady = useGlobeStore((s) => s.globeReady);

  // Show hint only on first visit, after globe is ready
  useEffect(() => {
    if (!globeReady) return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable -- skip onboarding
    }
  }, [globeReady]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      dismiss();
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Dismiss on first country click
  useEffect(() => {
    if (selectedCountry && visible) {
      dismiss();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // localStorage unavailable -- silently ignore
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-3">
            {/* Glass hint card */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 shadow-lg shadow-black/30">
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <MousePointerClick className="w-4 h-4 text-accent" />
                </motion.div>
                <span className="text-sm text-foreground/90 font-medium tracking-wide">
                  Click any country to explore
                </span>
              </div>
            </div>

            {/* Pulsing arrow pointing down toward the globe */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                fill="none"
                className="text-accent/70"
              >
                <path
                  d="M8 0v14m0 0l-5-5m5 5l5-5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
