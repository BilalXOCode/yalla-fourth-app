// Account Access page (no screenshot in the design pack, so built to match the
// site's brand). Two tabs: Log In and Create Account. Registration runs in
// short steps and finishes with a short skill quiz. When logged in, it shows
// the account panel with a retake-quiz option.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { QUIZ_LENGTH, scoreToLevel } from '../lib/skillQuiz.js';
import './AccountAccess.css';

// ---------- Reusable field bits ----------
function Field({ label, error, hint, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error">{error}</span>}
    </label>
  );
}

function OptSelect({ label, value, onChange, opts, hint }) {
  return (
    <Field label={label} hint={hint}>
      <select className="field__input" value={value} onChange={onChange}>
        {Object.entries(opts).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </Field>
  );
}

// ---------- Skill quiz (used in registration and for retake) ----------
function SkillQuiz({ onComplete, onBack }) {
  const { t } = useLang();
  const questions = t('account.quiz.questions');
  const [answers, setAnswers] = useState(Array(QUIZ_LENGTH).fill(null));
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null); // { level, total }

  function choose(optIdx) {
    const next = answers.slice();
    next[current] = optIdx;
    setAnswers(next);
    if (current < QUIZ_LENGTH - 1) {
      setCurrent(current + 1);
    } else {
      const total = next.reduce((s, v) => s + (v || 0), 0);
      setResult({ level: scoreToLevel(total), total });
    }
  }

  function restart() {
    setAnswers(Array(QUIZ_LENGTH).fill(null));
    setCurrent(0);
    setResult(null);
  }

  if (result) {
    return (
      <div className="quiz quiz__result">
        <span className="eyebrow">{t('account.quiz.result')}</span>
        <div className="quiz__level" data-skill={result.level}>
          <span className="quiz__leveldot" />
          <span className="quiz__levelname">{t(`home.skill.levels.${result.level}`)}</span>
        </div>
        <p className="quiz__leveldesc">{t(`account.quiz.levelDesc.${result.level}`)}</p>
        <p className="quiz__resultsub">{t('account.quiz.resultSub')}</p>
        <div className="quiz__resultactions">
          <button type="button" className="btn btn-ghost" onClick={restart}>
            {t('account.quiz.retake')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onComplete(result.level, result.total)}>
            {t('account.quiz.continue')}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = (current / QUIZ_LENGTH) * 100;
  return (
    <div className="quiz">
      <p className="quiz__intro">{t('account.quiz.intro')}</p>
      <div className="quiz__progress">
        <div className="quiz__progressbar" style={{ width: `${progress}%` }} />
      </div>
      <p className="quiz__count">
        {t('account.quiz.questionOf')} {current + 1} {t('account.quiz.of')} {QUIZ_LENGTH}
      </p>
      <h3 className="quiz__q">{q.q}</h3>
      <div className="quiz__options">
        {q.options.map((opt, i) => (
          <button key={i} type="button" className="quiz__option" onClick={() => choose(i)}>
            {opt}
          </button>
        ))}
      </div>
      {onBack && current === 0 && (
        <button type="button" className="quiz__back" onClick={onBack}>
          {t('account.register.back')}
        </button>
      )}
    </div>
  );
}

// ---------- Log in ----------
function LoginForm() {
  const { t } = useLang();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(identifier, password, remember);
      navigate('/find');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="authform" onSubmit={submit} noValidate>
      <h2 className="authform__title">{t('account.login.title')}</h2>
      <p className="authform__sub">{t('account.login.sub')}</p>
      {error && <p className="authform__error">{error}</p>}

      <Field label={t('account.login.identifier')}>
        <input
          className="field__input"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={t('account.login.identifierPh')}
          autoComplete="username"
        />
      </Field>

      <Field label={t('account.login.password')}>
        <div className="field__pw">
          <input
            className="field__input"
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('account.login.passwordPh')}
            autoComplete="current-password"
          />
          <button type="button" className="field__pwtoggle" onClick={() => setShowPw((s) => !s)}>
            {showPw ? t('account.login.hide') : t('account.login.show')}
          </button>
        </div>
      </Field>

      <div className="authform__row">
        <label className="checkbox">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>{t('account.login.remember')}</span>
        </label>
        <button type="button" className="authform__link" onClick={() => setShowForgot((s) => !s)}>
          {t('account.login.forgot')}
        </button>
      </div>
      {showForgot && <p className="authform__note">{t('account.login.forgotNote')}</p>}

      <button type="submit" className="btn btn-primary authform__submit" disabled={submitting}>
        {submitting ? t('account.login.submitting') : t('account.login.submit')}
      </button>
    </form>
  );
}

// ---------- Register ----------
const EMPTY_REG = {
  name: '', username: '', email: '', password: '', confirm: '',
  dob: '', gender: '', nationality: '', city: '', preferredLanguage: 'en',
  preferredArea: '', nearbyVenue: '', preferredGroupType: 'open', usualPlayingTime: '', playingHand: '',
};

function RegisterFlow() {
  const { t } = useLang();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 account, 2 personal, 3 prefs, 4 quiz
  const [form, setForm] = useState(EMPTY_REG);
  const [errors, setErrors] = useState({});
  const [venueData, setVenueData] = useState({ venues: [], areas: [] });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    api.getVenues().then((d) => setVenueData({ venues: d.venues || [], areas: d.areas || [] })).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const venueOptions = useMemo(() => {
    const list = form.preferredArea
      ? venueData.venues.filter((v) => v.area === form.preferredArea)
      : venueData.venues;
    return list.map((v) => v.name);
  }, [venueData, form.preferredArea]);

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.name.trim()) e.name = t('account.errors.required');
      if (form.username.trim().length < 3) e.username = t('account.errors.username');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('account.errors.email');
      if (form.password.length < 6) e.password = t('account.errors.password');
      if (form.confirm !== form.password) e.confirm = t('account.errors.passwordMatch');
    }
    if (s === 2 && !form.dob) e.dob = t('account.errors.dob');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => s + 1);
  }
  function back() {
    setErrors({});
    setStep((s) => s - 1);
  }

  async function finish(level, score) {
    setSubmitError('');
    setSubmitting(true);
    try {
      await register({ ...form, skillLevel: level, quizScore: score, rememberMe: true });
      navigate('/find');
    } catch (err) {
      // Server-side problems (e.g. duplicate email) send us back to step 1.
      setSubmitError(err.message);
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  }

  const steps = t('account.register.steps');
  const stepKeys = ['account', 'personal', 'prefs', 'quiz'];

  return (
    <div className="register">
      <h2 className="authform__title">{t('account.register.title')}</h2>
      <p className="authform__sub">{t('account.register.sub')}</p>

      <ol className="stepper">
        {stepKeys.map((key, i) => (
          <li
            key={key}
            className={`stepper__item ${step === i + 1 ? 'is-active' : ''} ${step > i + 1 ? 'is-done' : ''}`}
          >
            <span className="stepper__num">{step > i + 1 ? '✓' : i + 1}</span>
            <span className="stepper__label">{steps[key]}</span>
          </li>
        ))}
      </ol>

      {submitError && <p className="authform__error">{submitError}</p>}

      {step === 1 && (
        <div className="register__step">
          <Field label={t('account.register.account.name')} error={errors.name}>
            <input className="field__input" value={form.name} onChange={set('name')} placeholder={t('account.register.account.namePh')} />
          </Field>
          <div className="field-row">
            <Field label={t('account.register.account.username')} error={errors.username}>
              <input className="field__input" value={form.username} onChange={set('username')} placeholder={t('account.register.account.usernamePh')} />
            </Field>
            <Field label={t('account.register.account.email')} error={errors.email}>
              <input className="field__input" type="email" value={form.email} onChange={set('email')} placeholder={t('account.register.account.emailPh')} />
            </Field>
          </div>
          <div className="field-row">
            <Field label={t('account.register.account.password')} error={errors.password}>
              <div className="field__pw">
                <input className="field__input" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder={t('account.register.account.passwordPh')} />
                <button type="button" className="field__pwtoggle" onClick={() => setShowPw((s) => !s)}>
                  {showPw ? t('account.login.hide') : t('account.login.show')}
                </button>
              </div>
            </Field>
            <Field label={t('account.register.account.confirm')} error={errors.confirm}>
              <input className="field__input" type={showPw ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} placeholder={t('account.register.account.confirmPh')} />
            </Field>
          </div>
          <div className="register__actions">
            <button type="button" className="btn btn-primary" onClick={next}>{t('account.register.next')}</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="register__step">
          <div className="field-row">
            <Field label={t('account.register.personal.dob')} error={errors.dob} hint={t('account.register.personal.dobNote')}>
              <input className="field__input" type="date" value={form.dob} onChange={set('dob')} />
            </Field>
            <OptSelect label={t('account.register.personal.gender')} value={form.gender} onChange={set('gender')} opts={t('account.register.personal.genderOpts')} />
          </div>
          <div className="field-row">
            <Field label={t('account.register.personal.nationality')} hint={t('account.register.personal.nationalityNote')}>
              <input className="field__input" value={form.nationality} onChange={set('nationality')} placeholder={t('account.register.personal.nationalityPh')} />
            </Field>
            <Field label={t('account.register.personal.city')}>
              <input className="field__input" value={form.city} onChange={set('city')} placeholder={t('account.register.personal.cityPh')} />
            </Field>
          </div>
          <OptSelect label={t('account.register.personal.language')} value={form.preferredLanguage} onChange={set('preferredLanguage')} opts={t('account.register.personal.langOpts')} />
          <div className="register__actions">
            <button type="button" className="btn btn-ghost" onClick={back}>{t('account.register.back')}</button>
            <button type="button" className="btn btn-primary" onClick={next}>{t('account.register.next')}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="register__step">
          <div className="field-row">
            <Field label={t('account.register.prefs.area')}>
              <select className="field__input" value={form.preferredArea} onChange={set('preferredArea')}>
                <option value="">{t('account.register.prefs.anyArea')}</option>
                {venueData.areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label={t('account.register.prefs.venue')}>
              <select className="field__input" value={form.nearbyVenue} onChange={set('nearbyVenue')}>
                <option value="">{t('account.register.prefs.anyVenue')}</option>
                {venueOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
          </div>
          <div className="field-row">
            <OptSelect label={t('account.register.prefs.group')} value={form.preferredGroupType} onChange={set('preferredGroupType')} opts={t('account.register.prefs.groupOpts')} />
            <OptSelect label={t('account.register.prefs.time')} value={form.usualPlayingTime} onChange={set('usualPlayingTime')} opts={t('account.register.prefs.timeOpts')} />
          </div>
          <OptSelect label={t('account.register.prefs.hand')} value={form.playingHand} onChange={set('playingHand')} opts={t('account.register.prefs.handOpts')} />
          <div className="register__actions">
            <button type="button" className="btn btn-ghost" onClick={back}>{t('account.register.back')}</button>
            <button type="button" className="btn btn-primary" onClick={next}>{t('account.register.next')}</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="register__step">
          {submitting ? (
            <p className="account__msg">{t('account.register.finishing')}</p>
          ) : (
            <SkillQuiz onComplete={finish} onBack={back} />
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Logged-in account panel ----------
function AccountPanel() {
  const { t } = useLang();
  const { user, logout, saveQuiz } = useAuth();
  const navigate = useNavigate();
  const [retaking, setRetaking] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onQuizComplete(level, score) {
    setSaving(true);
    try {
      await saveQuiz(level, score);
    } finally {
      setSaving(false);
      setRetaking(false);
    }
  }

  if (retaking) {
    return (
      <div className="account__panel">
        {saving ? (
          <p className="account__msg">{t('account.register.finishing')}</p>
        ) : (
          <SkillQuiz onComplete={onQuizComplete} onBack={() => setRetaking(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="account__panel">
      <h2 className="account__hello">
        {t('account.panel.hello')}, {user.name.split(/\s+/)[0]}
      </h2>
      <p className="account__loggedin">{t('account.panel.loggedIn')}</p>

      <div className="account__level" data-skill={user.skillLevel}>
        <span className="account__leveldot" />
        <div>
          <span className="account__levellabel">{t('account.panel.level')}</span>
          <span className="account__levelname">{t(`home.skill.levels.${user.skillLevel}`)}</span>
        </div>
      </div>

      <dl className="account__grid">
        <div><dt>{t('account.panel.username')}</dt><dd>{user.username}</dd></div>
        <div><dt>{t('account.panel.email')}</dt><dd>{user.email}</dd></div>
        <div><dt>{t('account.panel.ageGroup')}</dt><dd>{t(`find.ages.${user.ageGroup}`)}</dd></div>
        {user.city ? <div><dt>{t('account.panel.city')}</dt><dd>{user.city}</dd></div> : null}
      </dl>

      <div className="account__panelactions">
        <button type="button" className="btn btn-primary" onClick={() => navigate('/find')}>
          {t('account.panel.goFind')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setRetaking(true)}>
          {t('account.panel.retake')}
        </button>
        <button type="button" className="btn btn-ghost account__logout" onClick={logout}>
          {t('account.panel.logout')}
        </button>
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function AccountAccess() {
  const { t } = useLang();
  const { isAuthed, loading } = useAuth();
  const [tab, setTab] = useState('login');

  return (
    <main className="account">
      <div className="account__wrap">
        <span className="eyebrow">{t('account.eyebrow')}</span>

        {loading ? (
          <p className="account__msg">…</p>
        ) : isAuthed ? (
          <AccountPanel />
        ) : (
          <>
            <div className="atabs">
              <button type="button" className={`atab ${tab === 'login' ? 'is-active' : ''}`} onClick={() => setTab('login')}>
                {t('account.tabs.login')}
              </button>
              <button type="button" className={`atab ${tab === 'register' ? 'is-active' : ''}`} onClick={() => setTab('register')}>
                {t('account.tabs.register')}
              </button>
            </div>
            {tab === 'login' ? <LoginForm /> : <RegisterFlow />}
          </>
        )}
      </div>
    </main>
  );
}
