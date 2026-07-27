// Shared match card. Two looks from the same styling:
//   variant="compact" — the small Home preview card (single Join button)
//   variant="full"    — the Find Matches card (status badge, pills, Details + Join)
import { NavLink } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import { dayLabel } from '../lib/formatDate.js';
import './MatchCard.css';

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}
function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}

// The four-player court indicator: filled dots = taken seats.
function CourtDots({ capacity, spotsLeft }) {
  const cap = capacity || 4;
  const dots = Array.from({ length: cap }, (_, i) => i < cap - spotsLeft);
  return (
    <span className="mcard__courtdots" aria-hidden="true">
      {dots.map((filled, i) => (
        <span key={i} className={`cdot ${filled ? 'is-filled' : ''}`} />
      ))}
    </span>
  );
}

export default function MatchCard({ m, variant = 'full', onDetails, onJoin }) {
  const { t, lang } = useLang();
  const isFull = m.status === 'full' || m.spotsLeft <= 0;

  if (variant === 'compact') {
    return (
      <article className="mcard" data-skill={m.skill}>
        <div className="mcard__toprow">
          <span className="mcard__time">
            <span className="mcard__dot" /> {dayLabel(m.date, lang, t)} · {m.time}
          </span>
          <span className="pill" data-skill={m.skill}>
            {t(`home.skill.levels.${m.skill}`)}
          </span>
        </div>
        <h3 className="mcard__venue">{m.venue}</h3>
        <p className="mcard__loc">{m.location}</p>
        <div className="mcard__hostrow">
          <span className="mcard__avatar">{m.hostInitials}</span>
          <span className="mcard__hostname">
            <span className="mcard__hostlabel">{t('home.open.host')}</span> {m.hostName}
          </span>
          <span className="mcard__left">
            <CourtDots capacity={m.capacity} spotsLeft={m.spotsLeft} />
            {m.spotsLeft} {t('home.open.left')}
          </span>
        </div>
        <NavLink to="/find" className="btn btn-primary mcard__join">
          {t('home.open.join')}
        </NavLink>
      </article>
    );
  }

  // --- Full (Find Matches) variant ---
  return (
    <article className="mcard mcard--full" data-skill={m.skill} data-status={m.status}>
      <div className="mcard__head">
        <h3 className="mcard__venue">{m.venue}</h3>
        <span className={`statusbadge statusbadge--${m.status}`}>
          <span className="statusbadge__dot" />
          {t(`find.status.${m.status}`)}
        </span>
      </div>

      <p className="mcard__loc">
        <span className="mcard__ico"><PinIcon /></span> {m.location}
      </p>

      <div className="mcard__pills">
        <span className="pill" data-skill={m.skill}>{t(`home.skill.levels.${m.skill}`)}</span>
        <span className="pill pill--muted">{t(`find.groups.${m.groupType}`)}</span>
        <span className="pill pill--muted">{t(`find.ages.${m.ageGroup}`)}</span>
      </div>

      <div className="mcard__when">
        <span className="mcard__ico"><CalIcon /></span> {dayLabel(m.date, lang, t)} · {m.time}
      </div>

      <div className="mcard__hostrow">
        <span className="mcard__avatar">{m.hostInitials}</span>
        <span className="mcard__hostname">
          <span className="mcard__hostlabel">{t('find.card.host')}</span> {m.hostName}
        </span>
        <span className="mcard__left">
          <CourtDots capacity={m.capacity} spotsLeft={m.spotsLeft} />
          {m.spotsLeft} {t('find.card.open')}
        </span>
      </div>

      <div className="mcard__actions">
        <button type="button" className="btn btn-ghost" onClick={() => onDetails?.(m)}>
          {t('find.card.details')}
        </button>
        {isFull ? (
          <button type="button" className="btn mcard__joinfull" disabled>
            {t('find.card.full')}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => onJoin?.(m)}>
            {t('find.card.join')}
          </button>
        )}
      </div>
    </article>
  );
}
