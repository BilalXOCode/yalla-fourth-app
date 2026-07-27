// Find Matches page. Two tabs (Discover / My matches), a filter panel that
// filters real matches from the database via GET query parameters, the match
// cards grid, and a details modal. On mobile the filters collapse into a drawer.
import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLang } from '../context/LangContext.jsx';
import Reveal from '../components/Reveal.jsx';
import MatchCard from '../components/MatchCard.jsx';
import MatchModal from '../components/MatchModal.jsx';
import { api } from '../lib/api.js';
import './FindMatches.css';

const EMPTY_FILTERS = {
  area: '',
  venue: '',
  date: '',
  time: '',
  skill: '',
  group: '',
  age: '',
  open: '',
  status: '',
};

// A labelled dropdown used across the filter panel.
function Select({ label, name, value, onChange, children }) {
  return (
    <label className="filter">
      <span className="filter__label">{label}</span>
      <select className="filter__input" name={name} value={value} onChange={onChange}>
        {children}
      </select>
    </label>
  );
}

export default function FindMatches() {
  const { t } = useLang();
  const [tab, setTab] = useState('discover');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [venueData, setVenueData] = useState({ venues: [], areas: [] });
  const [matches, setMatches] = useState([]);
  const [listState, setListState] = useState('loading'); // loading | ready | error
  const [modalId, setModalId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const setFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const resetFilters = () => setFilters(EMPTY_FILTERS);
  const hasFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  // Load venues/areas once for the dropdowns.
  useEffect(() => {
    api
      .getVenues()
      .then((d) => setVenueData({ venues: d.venues || [], areas: d.areas || [] }))
      .catch(() => setVenueData({ venues: [], areas: [] }));
  }, []);

  // Re-read matches from the database whenever a filter changes.
  useEffect(() => {
    if (tab !== 'discover') return;
    let active = true;
    setListState('loading');
    const params = {
      area: filters.area,
      venue: filters.venue,
      date: filters.date,
      time: filters.time,
      skill: filters.skill,
      group: filters.group,
      age: filters.age,
      minOpen: filters.open,
      status: filters.status,
    };
    api
      .getMatches(params)
      .then((d) => {
        if (!active) return;
        setMatches(d.matches || []);
        setListState('ready');
      })
      .catch(() => active && setListState('error'));
    return () => {
      active = false;
    };
  }, [filters, tab]);

  // Venue options narrow down to the chosen area.
  const venueOptions = useMemo(() => {
    const list = filters.area
      ? venueData.venues.filter((v) => v.area === filters.area)
      : venueData.venues;
    return list.map((v) => v.name);
  }, [venueData, filters.area]);

  return (
    <main className="find">
      <div className="container">
        <Reveal className="find__head">
          <span className="eyebrow">{t('find.eyebrow')}</span>
          <h1 className="find__title">{t('find.title')}</h1>
          <p className="find__sub">{t('find.sub')}</p>
        </Reveal>

        {/* Tabs */}
        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'discover'}
            className={`tab ${tab === 'discover' ? 'is-active' : ''}`}
            onClick={() => setTab('discover')}
          >
            {t('find.tabs.discover')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'mine'}
            className={`tab ${tab === 'mine' ? 'is-active' : ''}`}
            onClick={() => setTab('mine')}
          >
            {t('find.tabs.mine')}
          </button>
        </div>

        {tab === 'discover' && (
          <>
            <div className="find__countrow">
              <p className="find__count">
                <strong>{matches.length}</strong> {t('find.count')}{' '}
                <span className="find__countmuted">{t('find.across')}</span>
              </p>
              <button
                type="button"
                className="btn btn-ghost find__filterstoggle"
                onClick={() => setDrawerOpen(true)}
              >
                {t('find.showFilters')}
              </button>
            </div>

            {/* Filter panel (a drawer on mobile) */}
            {drawerOpen && <div className="find__backdrop" onClick={() => setDrawerOpen(false)} />}
            <section className={`filterpanel ${drawerOpen ? 'is-open' : ''}`} aria-label={t('find.filters.title')}>
              <div className="filterpanel__mobilehead">
                <span>{t('find.filters.title')}</span>
                <button type="button" className="filterpanel__closebtn" onClick={() => setDrawerOpen(false)} aria-label={t('find.hideFilters')}>
                  ×
                </button>
              </div>

              <div className="filterpanel__grid">
                <Select label={t('find.filters.area')} name="area" value={filters.area} onChange={setFilter}>
                  <option value="">{t('find.filters.allAreas')}</option>
                  {venueData.areas.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </Select>

                <Select label={t('find.filters.venue')} name="venue" value={filters.venue} onChange={setFilter}>
                  <option value="">{t('find.filters.allVenues')}</option>
                  {venueOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Select>

                <label className="filter">
                  <span className="filter__label">{t('find.filters.date')}</span>
                  <input className="filter__input" type="date" name="date" value={filters.date} onChange={setFilter} />
                </label>

                <Select label={t('find.filters.time')} name="time" value={filters.time} onChange={setFilter}>
                  <option value="">{t('find.filters.anyTime')}</option>
                  <option value="morning">{t('find.filters.morning')}</option>
                  <option value="afternoon">{t('find.filters.afternoon')}</option>
                  <option value="evening">{t('find.filters.evening')}</option>
                </Select>

                <Select label={t('find.filters.skill')} name="skill" value={filters.skill} onChange={setFilter}>
                  <option value="">{t('find.filters.allLevels')}</option>
                  <option value="beginner">{t('home.skill.levels.beginner')}</option>
                  <option value="improver">{t('home.skill.levels.improver')}</option>
                  <option value="intermediate">{t('home.skill.levels.intermediate')}</option>
                  <option value="advanced">{t('home.skill.levels.advanced')}</option>
                </Select>

                <Select label={t('find.filters.group')} name="group" value={filters.group} onChange={setFilter}>
                  <option value="">{t('find.filters.anyGroup')}</option>
                  <option value="mixed">{t('find.groups.mixed')}</option>
                  <option value="mens">{t('find.groups.mens')}</option>
                  <option value="womens">{t('find.groups.womens')}</option>
                </Select>

                <Select label={t('find.filters.age')} name="age" value={filters.age} onChange={setFilter}>
                  <option value="">{t('find.filters.allAges')}</option>
                  <option value="under 18">{t('find.ages.under 18')}</option>
                  <option value="18 to 30">{t('find.ages.18 to 30')}</option>
                  <option value="30 to 45">{t('find.ages.30 to 45')}</option>
                  <option value="45 plus">{t('find.ages.45 plus')}</option>
                </Select>

                <Select label={t('find.filters.open')} name="open" value={filters.open} onChange={setFilter}>
                  <option value="">{t('find.filters.any')}</option>
                  <option value="1">{t('find.filters.open1')}</option>
                  <option value="2">{t('find.filters.open2')}</option>
                  <option value="3">{t('find.filters.open3')}</option>
                </Select>

                <Select label={t('find.filters.status')} name="status" value={filters.status} onChange={setFilter}>
                  <option value="">{t('find.filters.anyStatus')}</option>
                  <option value="open">{t('find.status.open')}</option>
                  <option value="almost-full">{t('find.status.almost-full')}</option>
                  <option value="full">{t('find.status.full')}</option>
                </Select>
              </div>

              <div className="filterpanel__foot">
                {hasFilters && (
                  <button type="button" className="filterpanel__reset" onClick={resetFilters}>
                    ↺ {t('find.filters.reset')}
                  </button>
                )}
                <button type="button" className="btn btn-primary filterpanel__apply" onClick={() => setDrawerOpen(false)}>
                  {t('find.filters.title')}
                </button>
              </div>
            </section>

            {/* Results */}
            {listState === 'loading' && <p className="find__msg">{t('find.loading')}</p>}
            {listState === 'error' && <p className="find__msg">{t('find.error')}</p>}
            {listState === 'ready' && matches.length === 0 && (
              <p className="find__msg">{t('find.empty')}</p>
            )}
            {listState === 'ready' && matches.length > 0 && (
              <div className="find__grid">
                {matches.map((m, idx) => (
                  <Reveal key={m.id} delay={Math.min(idx, 6) * 60}>
                    <MatchCard m={m} variant="full" onDetails={(x) => setModalId(x.id)} onJoin={(x) => setModalId(x.id)} />
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'mine' && (
          <div className="find__mine">
            <p>{t('find.mine.needLogin')}</p>
            <NavLink to="/account" className="btn btn-primary">
              {t('find.mine.login')}
            </NavLink>
          </div>
        )}
      </div>

      {modalId && <MatchModal matchId={modalId} onClose={() => setModalId(null)} />}
    </main>
  );
}
