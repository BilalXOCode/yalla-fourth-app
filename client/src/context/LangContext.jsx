// Language + direction. Persists the choice and flips the whole document
// to RTL for Arabic. Provides a t() translator to every page.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGS, translate } from '../i18n/index.js';

const STORAGE_KEY = 'yf_lang';
const LangContext = createContext(null);

function readInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS[saved]) return saved;
  } catch (_) {
    /* localStorage may be unavailable; fall through to default */
  }
  return 'en';
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(readInitialLang);

  // Keep <html lang> and <html dir> in sync so CSS + the browser both know.
  useEffect(() => {
    const { dir } = LANGS[lang];
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {
      /* ignore write failures */
    }
  }, [lang]);

  const value = useMemo(() => {
    const isRtl = LANGS[lang].dir === 'rtl';
    return {
      lang,
      isRtl,
      setLang: (next) => LANGS[next] && setLang(next),
      toggleLang: () => setLang((cur) => (cur === 'en' ? 'ar' : 'en')),
      t: (keyPath) => translate(lang, keyPath),
    };
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
