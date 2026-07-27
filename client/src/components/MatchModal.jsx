// Match details modal. Opens over the Find Matches page (never a separate
// page). Loads the full match from the database via GET /api/matches/:id.
// The Join action prompts to log in for now (real joining arrives in Stage 5).
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import { api } from '../lib/api.js';
import { dayLabel } from '../lib/formatDate.js';
import './MatchModal.css';

export default function MatchModal({ matchId, onClose }) {
  const { t, lang } = useLang();
  const [m, setM] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | error
  const [showLogin, setShowLogin] = useState(false);

  // Load the match details.
  useEffect(() => {
    let active = true;
    setState('loading');
    api
      .getMatch(matchId)
      .then((d) => {
        if (!active) return;
        setM(d.match);
        setState('ready');
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [matchId]);

  // Close on Escape, and lock background scroll while open.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const isFull = m && (m.status === 'full' || m.spotsLeft <= 0);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={t('find.modal.title')} onMouseDown={onClose}>
      <div className="modal__panel" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="modal__close" onClick={onClose} aria-label={t('find.modal.close')}>
          ×
        </button>

        {state === 'loading' && <p className="modal__msg">{t('find.loading')}</p>}
        {state === 'error' && <p className="modal__msg">{t('find.modal.loadError')}</p>}

        {state === 'ready' && m && (
          <div className="modal__body" data-skill={m.skill}>
            <span className="eyebrow">{t('find.modal.title')}</span>
            <h2 className="modal__venue">{m.venue}</h2>
            <p className="modal__loc">{m.location}</p>

            <div className="modal__pills">
              <span className="pill" data-skill={m.skill}>{t(`home.skill.levels.${m.skill}`)}</span>
              <span className="pill pill--muted">{t(`find.groups.${m.groupType}`)}</span>
              <span className="pill pill--muted">{t(`find.ages.${m.ageGroup}`)}</span>
              <span className={`statusbadge statusbadge--${m.status}`}>
                <span className="statusbadge__dot" />
                {t(`find.status.${m.status}`)}
              </span>
            </div>

            <dl className="modal__grid">
              <div>
                <dt>{t('find.modal.when')}</dt>
                <dd>{dayLabel(m.date, lang, t)} · {m.time}</dd>
              </div>
              <div>
                <dt>{t('find.modal.duration')}</dt>
                <dd>{m.durationMinutes} {t('find.modal.minutes')}</dd>
              </div>
              <div>
                <dt>{t('find.modal.host')}</dt>
                <dd className="modal__host">
                  <span className="mcard__avatar">{m.hostInitials}</span> {m.hostName}
                </dd>
              </div>
              <div>
                <dt>{t('find.modal.spots')}</dt>
                <dd>{m.spotsLeft} / {m.capacity}</dd>
              </div>
            </dl>

            {m.notes ? (
              <div className="modal__notes">
                <dt>{t('find.modal.notes')}</dt>
                <p>{m.notes}</p>
              </div>
            ) : null}

            <div className="modal__actions">
              {isFull ? (
                <button type="button" className="btn mcard__joinfull" disabled>
                  {t('find.modal.full')}
                </button>
              ) : showLogin ? (
                <div className="modal__loginnote">
                  {t('find.modal.loginToJoin')}{' '}
                  <NavLink to="/account" className="modal__loginlink" onClick={onClose}>
                    {t('find.modal.login')}
                  </NavLink>
                </div>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setShowLogin(true)}>
                  {t('find.modal.join')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
