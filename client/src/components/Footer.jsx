// Site footer, present on every page. Never mentions a course, university
// or student project — just the brand, links and the UAE line.
import { NavLink } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import './Footer.css';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="footer">
      <div className="container footer__top">
        <div className="footer__brandcol">
          <NavLink to="/" className="footer__brand">
            YALLA FOURTH
          </NavLink>
          <p className="footer__blurb">{t('footer.blurb')}</p>
        </div>

        <nav className="footer__col" aria-label={t('footer.explore')}>
          <h4 className="footer__heading">{t('footer.explore')}</h4>
          <NavLink to="/find" className="footer__link">
            {t('footer.find')}
          </NavLink>
          <NavLink to="/create" className="footer__link">
            {t('footer.create')}
          </NavLink>
          <NavLink to="/account" className="footer__link">
            {t('footer.loginSignup')}
          </NavLink>
        </nav>

        <nav className="footer__col" aria-label={t('footer.company')}>
          <h4 className="footer__heading">{t('footer.company')}</h4>
          <NavLink to="/support" className="footer__link">
            {t('footer.support')}
          </NavLink>
          <NavLink to="/about" className="footer__link">
            {t('footer.about')}
          </NavLink>
        </nav>
      </div>

      <div className="container footer__bottom">
        <span>{t('footer.copyright')}</span>
        <span>{t('footer.made')}</span>
      </div>
    </footer>
  );
}
