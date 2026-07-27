// About Developers page. Reached from the footer "About developers" link (not
// the top nav). A short intro, then five member cards (three on top, two
// centered below), and a separate full-width supervisor card. Content is
// static and fully bilingual; the only per-member structural data (id, photo,
// lead flag) lives here and is merged by index with the translated text.
// All styles are scoped (ab__*). Photos swap in later with no layout change.
import { useLang } from '../context/LangContext.jsx';
import Reveal from '../components/Reveal.jsx';
import './About.css';

// Structural, non-translated member data. Names, titles and bios come from i18n
// (about.members) and are matched to these by array position.
const MEMBERS = [
  { id: '1088022', photo: '/bilal.jpeg', lead: true },
  { id: '1075413' },
  { id: '1086910' },
  { id: '1086912' },
  { id: '1088314' },
];

// Clean silhouette used when a member has no photo yet.
function Silhouette() {
  return (
    <svg className="ab__silhouette" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
      <circle cx="32" cy="24" r="13" />
      <path d="M11 57c0-11.6 9.4-19 21-19s21 7.4 21 19z" />
    </svg>
  );
}

// Small id-badge glyph shown before "ID #...".
function IdIcon() {
  return (
    <svg className="ab__idicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <circle cx="8.5" cy="11" r="2" />
      <path d="M13 10h5M13 14h5M6 15.2c.5-1.2 1.6-1.7 2.5-1.7s2 .5 2.5 1.7" strokeLinecap="round" />
    </svg>
  );
}

// Graduation-cap glyph for the supervisor card.
function CapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3 1 8l11 5 9-4.09V15h2V8L12 3z" />
      <path d="M5 12.2V16c0 1.66 3.13 3 7 3s7-1.34 7-3v-3.8l-7 3.18-7-3.18z" />
    </svg>
  );
}

export default function About() {
  const { t } = useLang();
  const members = t('about.members') || [];

  return (
    <main className="ab">
      <div className="ab__wrap">
        <Reveal className="ab__head">
          <span className="ab__eyebrow">{t('about.eyebrow')}</span>
          <h1 className="ab__title">{t('about.title')}</h1>
          <p className="ab__intro">{t('about.intro')}</p>
        </Reveal>

        <div className="ab__grid">
          {MEMBERS.map((m, i) => {
            const info = members[i] || {};
            return (
              <Reveal key={m.id} as="article" className={`ab__card ${m.lead ? 'is-lead' : ''}`} delay={i * 80}>
                {m.lead && (
                  <span className="ab__badge">
                    <span className="ab__badgestar" aria-hidden="true">★</span> {t('about.leadBadge')}
                  </span>
                )}
                <div className="ab__avatar">
                  {m.photo ? (
                    <img src={m.photo} alt={`${t('about.photoAlt')} ${info.name}`} className="ab__photo" />
                  ) : (
                    <Silhouette />
                  )}
                </div>
                <h3 className="ab__name">{info.name}</h3>
                <p className="ab__role">{info.title}</p>
                <span className="ab__id">
                  <IdIcon /> {t('about.idLabel')} #{m.id}
                </span>
                <p className="ab__bio">{info.bio}</p>
              </Reveal>
            );
          })}
        </div>

        <Reveal as="aside" className="ab__supervisor" delay={120}>
          <div className="ab__supicon" aria-hidden="true">
            <CapIcon />
          </div>
          <div className="ab__suptext">
            <span className="ab__suplabel">{t('about.supervisor.label')}</span>
            <h3 className="ab__supname">{t('about.supervisor.name')}</h3>
            <p className="ab__supline">{t('about.supervisor.line')}</p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
