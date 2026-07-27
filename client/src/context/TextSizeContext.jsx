// Text-size control (A- A A+). Multiplies the root font size and persists
// the choice across pages so the whole site scales together.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'yf_textscale';
const MIN = 0.9;
const MAX = 1.25;
const STEP = 0.1;
const DEFAULT = 1;

const TextSizeContext = createContext(null);

const clamp = (n) => Math.min(MAX, Math.max(MIN, Math.round(n * 100) / 100));

function readInitialScale() {
  try {
    const saved = parseFloat(localStorage.getItem(STORAGE_KEY));
    if (!Number.isNaN(saved)) return clamp(saved);
  } catch (_) {
    /* ignore */
  }
  return DEFAULT;
}

export function TextSizeProvider({ children }) {
  const [scale, setScale] = useState(readInitialScale);

  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(scale));
    try {
      localStorage.setItem(STORAGE_KEY, String(scale));
    } catch (_) {
      /* ignore */
    }
  }, [scale]);

  const value = useMemo(
    () => ({
      scale,
      canDecrease: scale > MIN,
      canIncrease: scale < MAX,
      isDefault: scale === DEFAULT,
      decrease: () => setScale((s) => clamp(s - STEP)),
      increase: () => setScale((s) => clamp(s + STEP)),
      reset: () => setScale(DEFAULT),
    }),
    [scale],
  );

  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
}

export function useTextSize() {
  const ctx = useContext(TextSizeContext);
  if (!ctx) throw new Error('useTextSize must be used inside <TextSizeProvider>');
  return ctx;
}
