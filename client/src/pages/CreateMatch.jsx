// Create Match page. The graded page: live, field-by-field AJAX validation
// with visible typing / checking / valid / error states, a live preview, a
// completeness bar, a real server duplicate check, and POST to save.
// Only a logged-in user can create a match. All styles are scoped (cm__*).
import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { dayLabel } from '../lib/formatDate.js';
import './CreateMatch.css';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Local "now" as strings for the not-in-the-past checks.
function nowParts() {
  const n = new Date();
  const p = (x) => String(x).padStart(2, '0');
  return {
    today: `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`,
    time: `${p(n.getHours())}:${p(n.getMinutes())}`,
  };
}

const REQUIRED = ['title', 'area', 'venue', 'date', 'time', 'duration', 'skill', 'age', 'group', 'openSpots'];
const EMPTY = {
  title: '', area: '', venue: '', date: '', time: '', duration: '',
  skill: '', age: '', group: '', openSpots: '', notes: '',
};

// The little status marker shown on each field.
function StatusMark({ state, t }) {
  if (state === 'typing') return <span className="cm__mark cm__mark--typing">• {t('create.status.typing')}</span>;
  if (state === 'checking') return <span className="cm__mark cm__mark--checking"><span className="cm__spinner" /> {t('create.status.checking')}</span>;
  if (state === 'valid') return <span className="cm__mark cm__mark--valid">✓ {t('create.status.valid')}</span>;
  return null;
}

export default function CreateMatch() {
  const { t, lang } = useLang();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState(EMPTY);
  const [state, setState] = useState({}); // name -> idle|typing|checking|valid|error
  const [errors, setErrors] = useState({}); // name -> message
  const [dupState, setDupState] = useState('idle'); // idle|checking|ok|warning
  const [venueData, setVenueData] = useState({ venues: [], areas: [] });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(null);

  // Refs so async validators always read the latest values/states.
  const fieldsRef = useRef(fields);
  const stateRef = useRef(state);
  fieldsRef.current = fields;
  stateRef.current = state;
  const timers = useRef({});
  const dupTimer = useRef(null);

  useEffect(() => {
    api.getVenues().then((d) => setVenueData({ venues: d.venues || [], areas: d.areas || [] })).catch(() => {});
  }, []);

  function setFieldState(name, s) {
    setState((prev) => ({ ...prev, [name]: s }));
  }

  // Pure validation rule for a single field.
  function ruleFor(name, value, all) {
    const { today, time: nowTime } = nowParts();
    switch (name) {
      case 'title':
        if (!value.trim()) return t('create.errors.required');
        if (value.trim().length < 3) return t('create.errors.titleShort');
        return '';
      case 'date':
        if (!value) return t('create.errors.required');
        if (value < today) return t('create.errors.datePast');
        return '';
      case 'time':
        if (!value) return t('create.errors.required');
        if (all.date === today && value < nowTime) return t('create.errors.timePast');
        return '';
      case 'openSpots': {
        const n = Number(value);
        if (!value) return t('create.errors.required');
        if (!(n >= 1 && n <= 4)) return t('create.errors.spotsRange');
        return '';
      }
      default:
        return value ? '' : t('create.errors.required');
    }
  }

  // Validate a field: briefly show "checking", then valid/error.
  async function runValidate(name, value) {
    setFieldState(name, 'checking');
    await sleep(220);
    const msg = ruleFor(name, value, fieldsRef.current);
    setErrors((p) => ({ ...p, [name]: msg }));
    setFieldState(name, msg ? 'error' : 'valid');
    if (!msg && (name === 'venue' || name === 'date' || name === 'time')) scheduleDup();
    if (msg && (name === 'venue' || name === 'date' || name === 'time')) setDupState('idle');
  }

  // Text/number inputs: show "typing", debounce, then validate.
  function onText(name, value) {
    setFields((f) => ({ ...f, [name]: value }));
    if (name === 'notes') return; // optional, not validated/counted
    setFieldState(name, 'typing');
    clearTimeout(timers.current[name]);
    timers.current[name] = setTimeout(() => runValidate(name, value), 450);
    if (name === 'date') {
      // Re-check time against the new date, and refresh the duplicate check.
      clearTimeout(timers.current.time);
      if (fieldsRef.current.time) timers.current.time = setTimeout(() => runValidate('time', fieldsRef.current.time), 500);
    }
  }

  // Selects validate straight away (with a quick "checking" flash).
  function onSelect(name, value) {
    setFields((f) => {
      const next = { ...f, [name]: value };
      if (name === 'area') { next.venue = ''; } // reset venue when area changes
      return next;
    });
    if (name === 'area') {
      setFieldState('venue', 'idle');
      setErrors((p) => ({ ...p, venue: '' }));
      setDupState('idle');
    }
    runValidate(name, value);
  }

  function changeSpots(delta) {
    const cur = fields.openSpots === '' ? 0 : Number(fields.openSpots);
    let next = cur + delta;
    if (next < 1) next = 1;
    if (next > 4) next = 4;
    const v = String(next);
    setFields((f) => ({ ...f, openSpots: v }));
    runValidate('openSpots', v);
  }

  // The real AJAX check: does a match already exist here at this date+time?
  function scheduleDup() {
    clearTimeout(dupTimer.current);
    dupTimer.current = setTimeout(async () => {
      const { venue, date, time } = fieldsRef.current;
      const st = stateRef.current;
      if (!venue || !date || !time) return setDupState('idle');
      if (st.date === 'error' || st.time === 'error' || st.venue === 'error') return setDupState('idle');
      setDupState('checking');
      try {
        const d = await api.checkDuplicate({ venue, date, time });
        setDupState(d.duplicate ? 'warning' : 'ok');
      } catch (_) {
        setDupState('idle');
      }
    }, 500);
  }

  const venueOptions = useMemo(() => {
    const list = fields.area ? venueData.venues.filter((v) => v.area === fields.area) : venueData.venues;
    return list.map((v) => v.name);
  }, [venueData, fields.area]);

  const validCount = REQUIRED.filter((n) => state[n] === 'valid').length;
  const progress = Math.round((validCount / REQUIRED.length) * 100);
  const canSubmit = validCount === REQUIRED.length && !submitting;

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const venueObj = venueData.venues.find((v) => v.name === fields.venue);
      const location = venueObj ? `${venueObj.area}, ${venueObj.emirate}` : fields.area;
      const d = await api.createMatch(
        {
          title: fields.title,
          area: fields.area,
          venue: fields.venue,
          location,
          date: fields.date,
          time: fields.time,
          durationMinutes: Number(fields.duration),
          skillLevel: fields.skill,
          ageGroup: fields.age,
          groupType: fields.group,
          openSpots: Number(fields.openSpots),
          notes: fields.notes,
        },
        token,
      );
      setSuccess(d.match);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setFields(EMPTY);
    setState({});
    setErrors({});
    setDupState('idle');
    setSuccess(null);
    setSubmitError('');
  }

  // ---------- Logged-out gate ----------
  if (!user) {
    return (
      <main className="cm">
        <div className="cm__wrap">
          <span className="eyebrow">{t('create.eyebrow')}</span>
          <h1 className="cm__title">{t('create.title')}</h1>
          <div className="cm__login">
            <p>{t('create.needLogin')}</p>
            <NavLink to="/account" className="btn btn-primary">{t('create.login')}</NavLink>
          </div>
        </div>
      </main>
    );
  }

  // ---------- Success confirmation ----------
  if (success) {
    return (
      <main className="cm">
        <div className="cm__wrap">
          <div className="cm__success" data-skill={success.skill}>
            <div className="cm__successicon">✓</div>
            <h1 className="cm__successtitle">{t('create.success.title')}</h1>
            <p className="cm__successsub">{t('create.success.sub')}</p>
            <div className="cm__successcard">
              <h3 className="cm__successvenue">{success.title}</h3>
              <p className="cm__successline">{success.venue} · {success.location}</p>
              <p className="cm__successline">{dayLabel(success.date, lang, t)} · {success.time}</p>
            </div>
            <div className="cm__successactions">
              <NavLink to="/find" className="btn btn-primary">{t('create.success.viewFind')}</NavLink>
              <button type="button" className="btn btn-ghost" onClick={reset}>{t('create.success.another')}</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ---------- The form ----------
  const previewVenueObj = venueData.venues.find((v) => v.name === fields.venue);
  const previewLoc = previewVenueObj ? `${previewVenueObj.area}, ${previewVenueObj.emirate}` : '';
  const spotsNum = fields.openSpots === '' ? 0 : Number(fields.openSpots);

  return (
    <main className="cm">
      <div className="cm__wrap">
        <span className="eyebrow">{t('create.eyebrow')}</span>
        <h1 className="cm__title">{t('create.title')}</h1>
        <p className="cm__sub">{t('create.sub')}</p>

        {/* Legend of the validation states */}
        <div className="cm__legend">
          <span className="cm__legenditem cm__legenditem--typing">• {t('create.legend.typing')}</span>
          <span className="cm__legenditem cm__legenditem--checking">• {t('create.legend.checking')}</span>
          <span className="cm__legenditem cm__legenditem--valid">• {t('create.legend.valid')}</span>
          <span className="cm__legenditem cm__legenditem--error">• {t('create.legend.error')}</span>
        </div>

        <div className="cm__layout">
          {/* ---- Form ---- */}
          <form className="cm__form" onSubmit={submit} noValidate>
            {submitError && <p className="cm__submiterror">{submitError}</p>}

            <div className="cm__field" data-state={state.title || 'idle'}>
              <div className="cm__labelrow">
                <span className="cm__label">{t('create.fields.title')}</span>
                <StatusMark state={state.title} t={t} />
              </div>
              <input className="cm__input" value={fields.title} onChange={(e) => onText('title', e.target.value)} placeholder={t('create.fields.titlePh')} maxLength={60} />
              {state.title === 'error' && <span className="cm__error">{errors.title}</span>}
            </div>

            <div className="cm__row">
              <div className="cm__field" data-state={state.area || 'idle'}>
                <div className="cm__labelrow">
                  <span className="cm__label">{t('create.fields.area')}</span>
                  <StatusMark state={state.area} t={t} />
                </div>
                <select className="cm__input" value={fields.area} onChange={(e) => onSelect('area', e.target.value)}>
                  <option value="">{t('create.fields.chooseArea')}</option>
                  {venueData.areas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="cm__field" data-state={state.venue || 'idle'}>
                <div className="cm__labelrow">
                  <span className="cm__label">{t('create.fields.venue')}</span>
                  <StatusMark state={state.venue} t={t} />
                </div>
                <select className="cm__input" value={fields.venue} onChange={(e) => onSelect('venue', e.target.value)}>
                  <option value="">{t('create.fields.chooseVenue')}</option>
                  {venueOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="cm__row">
              <div className="cm__field" data-state={state.date || 'idle'}>
                <div className="cm__labelrow">
                  <span className="cm__label">{t('create.fields.date')}</span>
                  <StatusMark state={state.date} t={t} />
                </div>
                <input className="cm__input" type="date" value={fields.date} onChange={(e) => onText('date', e.target.value)} />
                {state.date === 'error' && <span className="cm__error">{errors.date}</span>}
              </div>
              <div className="cm__field" data-state={state.time || 'idle'}>
                <div className="cm__labelrow">
                  <span className="cm__label">{t('create.fields.time')}</span>
                  <StatusMark state={state.time} t={t} />
                </div>
                <input className="cm__input" type="time" value={fields.time} onChange={(e) => onText('time', e.target.value)} />
                {state.time === 'error' && <span className="cm__error">{errors.time}</span>}
              </div>
            </div>

            {/* Duplicate availability check (real AJAX to the server) */}
            {dupState !== 'idle' && (
              <div className={`cm__dup cm__dup--${dupState}`}>
                {dupState === 'checking' && <><span className="cm__spinner" /> {t('create.dup.checking')}</>}
                {dupState === 'ok' && <>✓ {t('create.dup.ok')}</>}
                {dupState === 'warning' && <>⚠ {t('create.dup.warning')}</>}
              </div>
            )}

            <div className="cm__row">
              <div className="cm__field" data-state={state.duration || 'idle'}>
                <div className="cm__labelrow">
                  <span className="cm__label">{t('create.fields.duration')}</span>
                  <StatusMark state={state.duration} t={t} />
                </div>
                <select className="cm__input" value={fields.duration} onChange={(e) => onSelect('duration', e.target.value)}>
                  <option value="">{t('create.fields.chooseDuration')}</option>
                  <option value="60">{t('create.durations.60')}</option>
                  <option value="90">{t('create.durations.90')}</option>
                  <option value="120">{t('create.durations.120')}</option>
                </select>
              </div>
              <div className="cm__field" data-state={state.openSpots || 'idle'}>
                <div className="cm__labelrow">
                  <span className="cm__label">{t('create.fields.openSpots')}</span>
                  <StatusMark state={state.openSpots} t={t} />
                </div>
                <div className="cm__stepper">
                  <button type="button" className="cm__stepbtn" onClick={() => changeSpots(-1)} aria-label="-">−</button>
                  <input className="cm__input cm__stepinput" type="number" min="1" max="4" value={fields.openSpots} onChange={(e) => onText('openSpots', e.target.value)} />
                  <button type="button" className="cm__stepbtn" onClick={() => changeSpots(1)} aria-label="+">+</button>
                </div>
                {state.openSpots === 'error' && <span className="cm__error">{errors.openSpots}</span>}
              </div>
            </div>

            <div className="cm__row">
              <div className="cm__field" data-state={state.skill || 'idle'}>
                <div className="cm__labelrow">
                  <span className="cm__label">{t('create.fields.skill')}</span>
                  <StatusMark state={state.skill} t={t} />
                </div>
                <select className="cm__input" value={fields.skill} onChange={(e) => onSelect('skill', e.target.value)}>
                  <option value="">{t('create.fields.chooseSkill')}</option>
                  <option value="beginner">{t('home.skill.levels.beginner')}</option>
                  <option value="improver">{t('home.skill.levels.improver')}</option>
                  <option value="intermediate">{t('home.skill.levels.intermediate')}</option>
                  <option value="advanced">{t('home.skill.levels.advanced')}</option>
                </select>
              </div>
              <div className="cm__field" data-state={state.age || 'idle'}>
                <div className="cm__labelrow">
                  <span className="cm__label">{t('create.fields.age')}</span>
                  <StatusMark state={state.age} t={t} />
                </div>
                <select className="cm__input" value={fields.age} onChange={(e) => onSelect('age', e.target.value)}>
                  <option value="">{t('create.fields.chooseAge')}</option>
                  <option value="under 18">{t('find.ages.under 18')}</option>
                  <option value="18 to 30">{t('find.ages.18 to 30')}</option>
                  <option value="30 to 45">{t('find.ages.30 to 45')}</option>
                  <option value="45 plus">{t('find.ages.45 plus')}</option>
                </select>
              </div>
            </div>

            <div className="cm__field" data-state={state.group || 'idle'}>
              <div className="cm__labelrow">
                <span className="cm__label">{t('create.fields.group')}</span>
                <StatusMark state={state.group} t={t} />
              </div>
              <select className="cm__input" value={fields.group} onChange={(e) => onSelect('group', e.target.value)}>
                <option value="">{t('create.fields.chooseGroup')}</option>
                <option value="mixed">{t('find.groups.mixed')}</option>
                <option value="mens">{t('find.groups.mens')}</option>
                <option value="womens">{t('find.groups.womens')}</option>
              </select>
            </div>

            <div className="cm__field">
              <div className="cm__labelrow">
                <span className="cm__label">
                  {t('create.fields.notes')} <span className="cm__optional">({t('create.fields.notesOptional')})</span>
                </span>
              </div>
              <textarea className="cm__input cm__textarea" value={fields.notes} onChange={(e) => onText('notes', e.target.value)} placeholder={t('create.fields.notesPh')} maxLength={200} rows={3} />
              <span className="cm__counter">{fields.notes.length}/200</span>
            </div>

            <button type="submit" className="btn btn-primary cm__submit" disabled={!canSubmit}>
              {submitting ? t('create.submitting') : t('create.submit')}
            </button>
            <p className="cm__ready">{validCount} {t('create.ofReady')}</p>
          </form>

          {/* ---- Live preview + checklist ---- */}
          <aside className="cm__side">
            <div className="cm__preview" data-skill={fields.skill || undefined}>
              <div className="cm__previewhead">
                <span className="cm__previewlabel">{t('create.preview.title')}</span>
                <span className="cm__previewpct">{progress}%</span>
              </div>
              <div className="cm__previewbar"><div className="cm__previewbarfill" style={{ width: `${progress}%` }} /></div>
              <div className="cm__previewcard">
                <h3 className="cm__previewtitle">{fields.title || t('create.preview.yourTitle')}</h3>
                <p className="cm__previewvenue">◍ {fields.venue || t('create.preview.chooseVenue')}{previewLoc ? ` · ${previewLoc}` : ''}</p>
                <p className="cm__previewdate">▦ {fields.date && fields.time ? `${dayLabel(fields.date, lang, t)} · ${fields.time}` : t('create.preview.dateTime')}</p>
                <div className="cm__previewspots">
                  <span>{t('create.preview.openSpots')}</span>
                  <span className="cm__previewdots">
                    {[0, 1, 2, 3].map((i) => <span key={i} className={`cm__pdot ${i < spotsNum ? 'is-open' : ''}`} />)}
                  </span>
                </div>
              </div>
            </div>

            <ul className="cm__checklist">
              {REQUIRED.map((n) => (
                <li key={n} className={`cm__checkitem is-${state[n] || 'idle'}`}>
                  <span className="cm__checkicon">
                    {state[n] === 'valid' ? '✓' : state[n] === 'error' ? '✕' : state[n] === 'checking' ? '…' : '—'}
                  </span>
                  <span>{t(`create.checklist.${n}`)}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
