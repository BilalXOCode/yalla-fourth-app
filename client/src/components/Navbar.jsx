// Top navigation: brand, page links, EN/ع language switch, A- A A+ text
// size control, and the Log in button. Mirrors automatically in RTL because
// the document dir is set to rtl for Arabic.
import { NavLink } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import { useTextSize } from '../context/TextSizeContext.jsx';
import './Navbar.css';

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const { decrease, increase, reset, canDecrease, canIncrease } = useTextSize();

  const links = [
    { to: '/', key: 'home', end: true },
    { to: '/find', key: 'find' },
    { to: '/create', key: 'create' },
    { to: '/support', key: 'support' },
  ];

  return (
    <header className="nav">
      <div className="container nav__inner">
        <NavLink to="/" className="nav__brand" aria-label="Yalla Fourth home">
          YALLA FOURTH
        </NavLink>

        <nav className="nav__links" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.key}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                'nav__link' + (isActive ? ' nav__link--active' : '')
              }
            >
              {t(`nav.${l.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="nav__controls">
          {/* EN / ع language switch */}
          <div className="langswitch" role="group" aria-label="Language">
            <button
              type="button"
              className={'langswitch__btn' + (lang === 'en' ? ' is-active' : '')}
              aria-pressed={lang === 'en'}
              aria-label={t('controls.english')}
              onClick={() => setLang('en')}
            >
              EN
            </button>
            <button
              type="button"
              className={'langswitch__btn' + (lang === 'ar' ? ' is-active' : '')}
              aria-pressed={lang === 'ar'}
              aria-label={t('controls.arabic')}
              onClick={() => setLang('ar')}
            >
              ع
            </button>
          </div>

          {/* A- A A+ text size */}
          <div className="textsize" role="group" aria-label={t('controls.textSize')}>
            <button
              type="button"
              className="textsize__btn"
              aria-label={t('controls.smaller')}
              disabled={!canDecrease}
              onClick={decrease}
            >
              A<span className="textsize__sign">-</span>
            </button>
            <button
              type="button"
              className="textsize__btn textsize__btn--reset"
              aria-label={t('controls.reset')}
              onClick={reset}
            >
              A
            </button>
            <button
              type="button"
              className="textsize__btn"
              aria-label={t('controls.larger')}
              disabled={!canIncrease}
              onClick={increase}
            >
              A<span className="textsize__sign">+</span>
            </button>
          </div>

          <NavLink to="/account" className="btn btn-primary nav__login">
            {t('nav.login')}
          </NavLink>
        </div>
      </div>
    </header>
  );
}
