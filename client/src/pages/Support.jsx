// Support page. Two tabs: submit a complaint or share feedback. Both write to
// the supportMessages collection via POST, with inline validation on the
// required fields and loading / error / success states. A small FAQ accordion
// sits at the bottom. All styles are scoped (sp__*). If the user is logged in
// we prefill the contact email as a small convenience.
import { useState } from 'react';
import { useLang } from '../context/LangContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import Reveal from '../components/Reveal.jsx';
import './Support.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPLAINT_CATEGORIES = [
  'inappropriate behaviour',
  'incorrect match info',
  'fake account',
  'safety concern',
  'technical problem',
  'other',
];
const FEEDBACK_CATEGORIES = ['matching', 'app experience', 'venues', 'feature idea', 'other'];
const RECOMMEND = ['yes', 'maybe', 'no'];
const MAX = 600;

export default function Support() {
  const { t } = useLang();
  const { user } = useAuth();

  const [tab, setTab] = useState('complaint'); // 'complaint' | 'feedback'

  // Complaint form state.
  const [c, setC] = useState({
    category: '', subject: '', message: '', matchRef: '', playerName: '',
    contactEmail: user?.email || '',
  });
  const [cErrors, setCErrors] = useState({});

  // Feedback form state.
  const [f, setF] = useState({
    rating: 0, hover: 0, category: '', message: '', wouldRecommend: '', canContact: false,
  });
  const [fErrors, setFErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(null); // 'complaint' | 'feedback'
  const [openFaq, setOpenFaq] = useState(null);

  const faqItems = t('support.faq.items') || [];

  function switchTab(next) {
    if (next === tab) return;
    setTab(next);
    setSubmitError('');
  }

  // ---- Complaint helpers ----
  function setCField(name, value) {
    setC((p) => ({ ...p, [name]: value }));
    if (cErrors[name]) setCErrors((p) => ({ ...p, [name]: '' }));
  }
  function validateComplaint() {
    const errs = {};
    if (!COMPLAINT_CATEGORIES.includes(c.category)) errs.category = t('support.errors.category');
    if (c.subject.trim().length < 3) errs.subject = t('support.errors.subject');
    if (!c.message.trim()) errs.message = t('support.errors.message');
    if (!EMAIL_RE.test(c.contactEmail.trim())) errs.contactEmail = t('support.errors.email');
    setCErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ---- Feedback helpers ----
  function setFField(name, value) {
    setF((p) => ({ ...p, [name]: value }));
    if (fErrors[name]) setFErrors((p) => ({ ...p, [name]: '' }));
  }
  function validateFeedback() {
    const errs = {};
    if (!(f.rating >= 1 && f.rating <= 5)) errs.rating = t('support.errors.rating');
    if (!f.message.trim()) errs.message = t('support.errors.message');
    setFErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submitComplaint(e) {
    e.preventDefault();
    if (submitting) return;
    if (!validateComplaint()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.submitSupport({
        type: 'complaint',
        category: c.category,
        subject: c.subject.trim(),
        message: c.message.trim(),
        matchRef: c.matchRef.trim(),
        playerName: c.playerName.trim(),
        contactEmail: c.contactEmail.trim(),
      });
      setSuccess('complaint');
    } catch (err) {
      setSubmitError(err.message || t('support.submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitFeedback(e) {
    e.preventDefault();
    if (submitting) return;
    if (!validateFeedback()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.submitSupport({
        type: 'feedback',
        rating: f.rating,
        category: f.category,
        message: f.message.trim(),
        wouldRecommend: f.wouldRecommend || null,
        canContact: f.canContact,
        contactEmail: f.canContact ? (user?.email || '') : '',
      });
      setSuccess('feedback');
    } catch (err) {
      setSubmitError(err.message || t('support.submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setC({ category: '', subject: '', message: '', matchRef: '', playerName: '', contactEmail: user?.email || '' });
    setF({ rating: 0, hover: 0, category: '', message: '', wouldRecommend: '', canContact: false });
    setCErrors({});
    setFErrors({});
    setSubmitError('');
    setSuccess(null);
  }

  const cCount = c.message.length;
  const fCount = f.message.length;
  const starView = f.hover || f.rating;

  return (
    <main className="sp">
      <div className="sp__wrap">
        <Reveal className="sp__head">
          <span className="eyebrow">{t('support.eyebrow')}</span>
          <h1 className="sp__title">{t('support.title')}</h1>
          <p className="sp__sub">{t('support.sub')}</p>
        </Reveal>

        {success ? (
          <Reveal className="sp__success">
            <div className="sp__successicon">✓</div>
            <h2 className="sp__successtitle">
              {success === 'complaint' ? t('support.success.complaintTitle') : t('support.success.feedbackTitle')}
            </h2>
            <p className="sp__successsub">
              {success === 'complaint' ? t('support.success.complaintSub') : t('support.success.feedbackSub')}
            </p>
            <button type="button" className="btn btn-primary" onClick={resetAll}>
              {t('support.success.another')}
            </button>
          </Reveal>
        ) : (
          <>
            {/* ---- Tabs ---- */}
            <Reveal className="sp__tabs">
              <button
                type="button"
                className={`sp__tab ${tab === 'complaint' ? 'is-active' : ''}`}
                onClick={() => switchTab('complaint')}
                aria-pressed={tab === 'complaint'}
              >
                <span className="sp__tabicon" aria-hidden="true">⚠</span>
                {t('support.tabs.complaint')}
              </button>
              <button
                type="button"
                className={`sp__tab ${tab === 'feedback' ? 'is-active' : ''}`}
                onClick={() => switchTab('feedback')}
                aria-pressed={tab === 'feedback'}
              >
                <span className="sp__tabicon" aria-hidden="true">★</span>
                {t('support.tabs.feedback')}
              </button>
            </Reveal>

            {/* ---- Complaint form ---- */}
            {tab === 'complaint' && (
              <Reveal className="sp__card">
                <form className="sp__form" onSubmit={submitComplaint} noValidate>
                  {submitError && <p className="sp__submiterror">{submitError}</p>}

                  <div className="sp__field">
                    <label className="sp__label" htmlFor="c-category">{t('support.complaint.categoryLabel')}</label>
                    <select
                      id="c-category"
                      className={`sp__input sp__select ${cErrors.category ? 'is-error' : ''}`}
                      value={c.category}
                      onChange={(e) => setCField('category', e.target.value)}
                    >
                      <option value="">{t('support.complaint.categoryPh')}</option>
                      {COMPLAINT_CATEGORIES.map((k) => (
                        <option key={k} value={k}>{t(`support.complaint.categories.${k}`)}</option>
                      ))}
                    </select>
                    {cErrors.category && <span className="sp__error">{cErrors.category}</span>}
                  </div>

                  <div className="sp__field">
                    <label className="sp__label" htmlFor="c-subject">{t('support.complaint.subjectLabel')}</label>
                    <input
                      id="c-subject"
                      className={`sp__input ${cErrors.subject ? 'is-error' : ''}`}
                      value={c.subject}
                      onChange={(e) => setCField('subject', e.target.value)}
                      placeholder={t('support.complaint.subjectPh')}
                      maxLength={120}
                    />
                    {cErrors.subject && <span className="sp__error">{cErrors.subject}</span>}
                  </div>

                  <div className="sp__field">
                    <label className="sp__label" htmlFor="c-message">{t('support.complaint.messageLabel')}</label>
                    <textarea
                      id="c-message"
                      className={`sp__input sp__textarea ${cErrors.message ? 'is-error' : ''}`}
                      value={c.message}
                      onChange={(e) => setCField('message', e.target.value.slice(0, MAX))}
                      placeholder={t('support.complaint.messagePh')}
                      rows={5}
                    />
                    <div className="sp__belowfield">
                      {cErrors.message ? <span className="sp__error">{cErrors.message}</span> : <span />}
                      <span className="sp__counter">{cCount}{t('support.counter')}</span>
                    </div>
                  </div>

                  <div className="sp__row">
                    <div className="sp__field">
                      <label className="sp__label" htmlFor="c-match">
                        {t('support.complaint.matchLabel')} <span className="sp__optional">({t('support.complaint.matchOptional')})</span>
                      </label>
                      <input
                        id="c-match"
                        className="sp__input"
                        value={c.matchRef}
                        onChange={(e) => setCField('matchRef', e.target.value)}
                        placeholder={t('support.complaint.matchPh')}
                        maxLength={80}
                      />
                    </div>
                    <div className="sp__field">
                      <label className="sp__label" htmlFor="c-player">
                        {t('support.complaint.playerLabel')} <span className="sp__optional">({t('support.complaint.playerOptional')})</span>
                      </label>
                      <input
                        id="c-player"
                        className="sp__input"
                        value={c.playerName}
                        onChange={(e) => setCField('playerName', e.target.value)}
                        placeholder={t('support.complaint.playerPh')}
                        maxLength={80}
                      />
                    </div>
                  </div>

                  <div className="sp__field">
                    <label className="sp__label" htmlFor="c-email">{t('support.complaint.emailLabel')}</label>
                    <input
                      id="c-email"
                      type="email"
                      className={`sp__input ${cErrors.contactEmail ? 'is-error' : ''}`}
                      value={c.contactEmail}
                      onChange={(e) => setCField('contactEmail', e.target.value)}
                      placeholder={t('support.complaint.emailPh')}
                    />
                    {cErrors.contactEmail && <span className="sp__error">{cErrors.contactEmail}</span>}
                  </div>

                  <button type="submit" className="btn btn-primary sp__submit" disabled={submitting}>
                    {submitting ? t('support.complaint.submitting') : t('support.complaint.submit')}
                  </button>
                  <p className="sp__note">{t('support.complaint.note')}</p>
                </form>
              </Reveal>
            )}

            {/* ---- Feedback form ---- */}
            {tab === 'feedback' && (
              <Reveal className="sp__card">
                <form className="sp__form" onSubmit={submitFeedback} noValidate>
                  {submitError && <p className="sp__submiterror">{submitError}</p>}

                  <div className="sp__field">
                    <label className="sp__label">{t('support.feedback.ratingLabel')}</label>
                    <div className="sp__rating" onMouseLeave={() => setF((p) => ({ ...p, hover: 0 }))}>
                      <div className="sp__stars" role="radiogroup">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`sp__star ${n <= starView ? 'is-on' : ''}`}
                            onClick={() => setFField('rating', n)}
                            onMouseEnter={() => setF((p) => ({ ...p, hover: n }))}
                            aria-label={`${n}`}
                            aria-pressed={n <= f.rating}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <span className="sp__ratinglabel">
                        {f.rating ? `${f.rating} ${t('support.feedback.rated')}` : t('support.feedback.notRated')}
                      </span>
                    </div>
                    {fErrors.rating && <span className="sp__error">{fErrors.rating}</span>}
                  </div>

                  <div className="sp__field">
                    <label className="sp__label" htmlFor="f-category">{t('support.feedback.categoryLabel')}</label>
                    <select
                      id="f-category"
                      className="sp__input sp__select"
                      value={f.category}
                      onChange={(e) => setFField('category', e.target.value)}
                    >
                      <option value="">{t('support.feedback.categoryPh')}</option>
                      {FEEDBACK_CATEGORIES.map((k) => (
                        <option key={k} value={k}>{t(`support.feedback.categories.${k}`)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sp__field">
                    <label className="sp__label" htmlFor="f-message">{t('support.feedback.messageLabel')}</label>
                    <textarea
                      id="f-message"
                      className={`sp__input sp__textarea ${fErrors.message ? 'is-error' : ''}`}
                      value={f.message}
                      onChange={(e) => setFField('message', e.target.value.slice(0, MAX))}
                      placeholder={t('support.feedback.messagePh')}
                      rows={5}
                    />
                    <div className="sp__belowfield">
                      {fErrors.message ? <span className="sp__error">{fErrors.message}</span> : <span />}
                      <span className="sp__counter">{fCount}{t('support.counter')}</span>
                    </div>
                  </div>

                  <div className="sp__field">
                    <label className="sp__label">{t('support.feedback.recommendLabel')}</label>
                    <div className="sp__choices">
                      {RECOMMEND.map((k) => (
                        <button
                          key={k}
                          type="button"
                          className={`sp__choice ${f.wouldRecommend === k ? 'is-active' : ''}`}
                          onClick={() => setFField('wouldRecommend', f.wouldRecommend === k ? '' : k)}
                          aria-pressed={f.wouldRecommend === k}
                        >
                          {t(`support.feedback.recommend.${k}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="sp__check">
                    <input
                      type="checkbox"
                      checked={f.canContact}
                      onChange={(e) => setFField('canContact', e.target.checked)}
                    />
                    <span>{t('support.feedback.contactLabel')}</span>
                  </label>

                  <button type="submit" className="btn btn-primary sp__submit" disabled={submitting}>
                    {submitting ? t('support.feedback.submitting') : t('support.feedback.submit')}
                  </button>
                </form>
              </Reveal>
            )}
          </>
        )}

        {/* ---- FAQ ---- */}
        <div className="sp__faq">
          <Reveal>
            <span className="eyebrow">{t('support.faq.eyebrow')}</span>
          </Reveal>
          <div className="sp__faqlist">
            {faqItems.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <Reveal key={i} delay={i * 40}>
                  <div className={`sp__faqitem ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="sp__faqq"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className="sp__faqchevron" aria-hidden="true">⌄</span>
                    </button>
                    {isOpen && <p className="sp__faqa">{item.a}</p>}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
