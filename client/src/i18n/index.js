// Tiny i18n helper. Dictionaries live in en.js / ar.js.
import en from './en.js';
import ar from './ar.js';

export const dictionaries = { en, ar };

export const LANGS = {
  en: { code: 'en', dir: 'ltr', label: 'EN' },
  ar: { code: 'ar', dir: 'rtl', label: 'ع' },
};

// Look up a dotted key path ("footer.made") in a dictionary object.
// Falls back to English, then to the raw key, so nothing ever renders blank.
export function translate(lang, keyPath) {
  const fromLang = getPath(dictionaries[lang], keyPath);
  if (fromLang != null) return fromLang;
  const fromEn = getPath(dictionaries.en, keyPath);
  return fromEn != null ? fromEn : keyPath;
}

function getPath(obj, keyPath) {
  return keyPath.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}
