// Home page. Matches the approved screenshot in English and Arabic.
// Sections: hero (video), how it works, skill matching, open matches, language
// note. The footer is the shared one from the app shell.
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Reveal from '../components/Reveal.jsx';
import MatchCard from '../components/MatchCard.jsx';
import useReducedMotion from '../lib/useReducedMotion.js';
import { api } from '../lib/api.js';
import './Home.css';

// --- Small inline icons for the "how it works" cards ----------------------
function IconLevel() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 20V10M12 20V4M18 20v-6" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 9v6M9 12h6" />
    </svg>
  );
}
const STEP_ICONS = [<IconLevel />, <IconSearch />, <IconPlus />];

// Hero heading revealed word by word (see below). Match cards use the shared
// MatchCard component in its "compact" variant.
function HeroTitle({ lead, highlight }) {
  const reduced = useReducedMotion();
  const [isIn, setIsIn] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setIsIn(true);
      return;
    }
    const id = requestAnimationFrame(() => setIsIn(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  let i = 0;
  const word = (w, cls = '') => {
    const delay = i * 90;
    i += 1;
    return (
      <span key={`${cls}-${i}`} className={`hero-word ${cls}`} style={{ transitionDelay: `${delay}ms` }}>
        {w}
      </span>
    );
  };

  return (
    <h1 className={`hero__title ${isIn ? 'is-in' : ''}`}>
      {lead.split(' ').map((w) => word(w))}
      <span className="hero__hl">
        {highlight.split(' ').map((w) => word(w, 'hero-word--hl'))}
      </span>
    </h1>
  );
}

export default function Home() {
  const { t, lang, setLang } = useLang();
  const { user } = useAuth();
  const reduced = useReducedMotion();

  const steps = t('home.how.steps');
  const levelKeys = ['beginner', 'improver', 'intermediate', 'advanced'];

  // Live preview of the three soonest matches, read from MongoDB via GET.
  const [openMatches, setOpenMatches] = useState([]);
  const [matchesState, setMatchesState] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let active = true;
    api
      .getMatches({ limit: 3 })
      .then((data) => {
        if (!active) return;
        setOpenMatches(data.matches || []);
        setMatchesState('ready');
      })
      .catch(() => active && setMatchesState('error'));
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="home">
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero__media">
          {reduced ? (
            <img className="hero__video" src="/hero-poster.png" alt="" />
          ) : (
            <video
              className="hero__video"
              autoPlay
              loop
              muted
              playsInline
              poster="/hero-poster.png"
            >
              <source src="/hero-loop.mp4" type="video/mp4" />
            </video>
          )}
          <div className="hero__scrim" />
        </div>

        <div className="hero__content">
          <span className="eyebrow">{t('home.hero.eyebrow')}</span>
          <HeroTitle lead={t('home.hero.titleLead')} highlight={t('home.hero.titleHighlight')} />
          <p className="hero__sub">{t('home.hero.sub')}</p>
          <div className="hero__cta">
            {user ? (
              <NavLink to="/find" className="btn btn-primary">
                {t('home.hero.findMatch')}
              </NavLink>
            ) : (
              <>
                <NavLink to="/account" className="btn btn-primary">
                  {t('home.hero.signup')}
                </NavLink>
                <NavLink to="/account" className="btn btn-ghost">
                  {t('home.hero.login')}
                </NavLink>
              </>
            )}
          </div>
        </div>

        <div className="hero__scroll" aria-hidden="true">
          <span>{t('home.hero.scroll')}</span>
          <span className="hero__mouse">
            <span className="hero__wheel" />
          </span>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section container">
        <Reveal>
          <span className="eyebrow">{t('home.how.eyebrow')}</span>
          <h2 className="section__title">{t('home.how.title')}</h2>
          <p className="section__sub">{t('home.how.sub')}</p>
        </Reveal>

        <div className="how__grid">
          {steps.map((step, idx) => (
            <Reveal as="article" className="how__card" key={idx} delay={idx * 90}>
              <div className="how__cardtop">
                <span className="how__icon">{STEP_ICONS[idx]}</span>
                <span className="how__num">0{idx + 1}</span>
              </div>
              <h3 className="how__cardtitle">{step.title}</h3>
              <p className="how__cardtext">{step.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Skill-based matching band ---------- */}
      <section className="section container">
        <Reveal className="skillband">
          <div className="skillband__text">
            <span className="eyebrow">{t('home.skill.eyebrow')}</span>
            <h2 className="skillband__title">{t('home.skill.title')}</h2>
            <p className="skillband__body">{t('home.skill.text')}</p>
          </div>
          <ul className="skillband__levels">
            {levelKeys.map((k) => (
              <li key={k} className="levelbadge" data-skill={k}>
                <span className="levelbadge__dot" />
                {t(`home.skill.levels.${k}`)}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* ---------- Open matches right now ---------- */}
      <section className="section container">
        <Reveal className="open__head">
          <div>
            <h2 className="section__title">{t('home.open.title')}</h2>
            <p className="section__sub">{t('home.open.sub')}</p>
          </div>
          <NavLink to="/find" className="open__seeall">
            {t('home.open.seeAll')} <span className="arrow">→</span>
          </NavLink>
        </Reveal>

        {matchesState === 'ready' && openMatches.length > 0 && (
          <div className="open__grid">
            {openMatches.map((m, idx) => (
              <Reveal key={m.id} delay={idx * 90}>
                <MatchCard m={m} variant="compact" />
              </Reveal>
            ))}
          </div>
        )}
        {matchesState === 'ready' && openMatches.length === 0 && (
          <p className="open__empty">{t('home.open.empty')}</p>
        )}
        {matchesState === 'error' && (
          <p className="open__empty">{t('home.open.error')}</p>
        )}
      </section>

      {/* ---------- Bilingual note band ---------- */}
      <section className="section container">
        <Reveal className="langband">
          <span className="langband__mark">EN / ع</span>
          <div className="langband__text">
            <h3 className="langband__title">{t('home.lang.title')}</h3>
            <p>{t('home.lang.text')}</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost langband__btn"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          >
            {lang === 'en' ? t('home.lang.tryAr') : t('home.lang.tryEn')}
          </button>
        </Reveal>
      </section>
    </main>
  );
}
