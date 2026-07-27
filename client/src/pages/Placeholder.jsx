// Temporary page body used for every route in Stage 1. It shows the design
// system working (eyebrow, heavy italic heading, glow) and is replaced by the
// real page in later stages.
import { useLang } from '../context/LangContext.jsx';
import './Placeholder.css';

export default function Placeholder({ titleKey }) {
  const { t } = useLang();
  return (
    <main className="placeholder">
      <div className="container placeholder__inner">
        <span className="eyebrow">{t('placeholder.eyebrow')}</span>
        <h1 className="placeholder__title">{t(`placeholder.${titleKey}`)}</h1>
        <p className="placeholder__note">{t('placeholder.note')}</p>
        <div className="placeholder__demo">
          <button type="button" className="btn btn-primary">
            {t('nav.login')}
          </button>
          <button type="button" className="btn btn-ghost">
            {t('nav.find')}
          </button>
        </div>
      </div>
    </main>
  );
}
