// Match reads. GET only (writing/creating a match is a POST, added in Stage 6).
const express = require('express');
const Match = require('../models/Match.js');
const User = require('../models/User.js');
const PadelMatch = require('../lib/PadelMatch.js');
const SkillLevel = require('../lib/SkillLevel.js');
const auth = require('../middleware/auth.js');

const router = express.Router();

// Today's date / current time as local strings, for "not in the past" checks.
function nowParts() {
  const n = new Date();
  const p = (x) => String(x).padStart(2, '0');
  return {
    date: `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`,
    time: `${p(n.getHours())}:${p(n.getMinutes())}`,
  };
}

// GET /api/matches
// Optional query filters (all read-only): area, venue, skill, group, age,
// status, q (search), limit. Returns match cards shaped by the PadelMatch class.
router.get('/', async (req, res) => {
  try {
    const { area, venue, skill, group, age, status, date, time, minOpen, q, limit } = req.query;

    // Fields stored on the document are filtered directly in MongoDB.
    const query = {};
    if (area) query.area = area;
    if (venue) query.venue = venue;
    if (skill) query.skillLevel = skill;
    if (group) query.groupType = group;
    if (age) query.ageGroup = age;
    if (date) query.date = date;
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { venue: { $regex: q, $options: 'i' } },
        { area: { $regex: q, $options: 'i' } },
      ];
    }

    // date + time are zero-padded strings, so a plain sort is chronological.
    const docs = await Match.find(query).sort({ date: 1, time: 1 }).lean();

    let cards = PadelMatch.toCards(docs);

    // Derived / bucketed fields are filtered after shaping.
    if (status) cards = cards.filter((c) => c.status === status);

    // Time of day bucket: morning (<12:00), afternoon (12:00-16:59), evening (>=17:00).
    if (time === 'morning' || time === 'afternoon' || time === 'evening') {
      cards = cards.filter((c) => {
        const hour = Number.parseInt(String(c.time).slice(0, 2), 10);
        if (time === 'morning') return hour < 12;
        if (time === 'afternoon') return hour >= 12 && hour < 17;
        return hour >= 17;
      });
    }

    // Minimum open spots.
    const min = Number.parseInt(minOpen, 10);
    if (!Number.isNaN(min) && min > 0) cards = cards.filter((c) => c.spotsLeft >= min);

    const max = Number.parseInt(limit, 10);
    if (!Number.isNaN(max) && max > 0) cards = cards.slice(0, max);

    res.json({ count: cards.length, matches: cards });
  } catch (err) {
    console.error('GET /api/matches failed:', err.message);
    res.status(500).json({ error: 'Could not load matches.' });
  }
});

// GET /api/matches/mine  -> matches the logged-in user hosts or has joined.
// Defined BEFORE "/:id" so "mine" is not treated as an id.
router.get('/mine', auth, async (req, res) => {
  try {
    const docs = await Match.find({
      $or: [{ host: req.userId }, { players: req.userId }],
    })
      .sort({ date: 1, time: 1 })
      .lean();

    const matches = docs.map((d) => {
      const card = new PadelMatch(d).toCard();
      const isHost = String(d.host) === String(req.userId);
      return { ...card, role: isHost ? 'hosting' : 'joined' };
    });

    res.json({ count: matches.length, matches });
  } catch (err) {
    console.error('GET /api/matches/mine failed:', err.message);
    res.status(500).json({ error: 'Could not load your matches.' });
  }
});

// GET /api/matches/check-duplicate?venue=&date=&time=
// The live AJAX check on the Create Match form: does a match already exist at
// this venue on this date and time? Read-only, so a GET. Defined before "/:id".
router.get('/check-duplicate', async (req, res) => {
  try {
    const { venue, date, time } = req.query;
    if (!venue || !date || !time) return res.json({ duplicate: false });
    const count = await Match.countDocuments({ venue, date, time });
    res.json({ duplicate: count > 0, count });
  } catch (err) {
    console.error('GET /api/matches/check-duplicate failed:', err.message);
    res.status(500).json({ error: 'Could not check availability.' });
  }
});

// GET /api/matches/:id  -> one match (used by the details modal in Stage 4).
router.get('/:id', async (req, res) => {
  try {
    const doc = await Match.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Match not found.' });
    res.json({ match: new PadelMatch(doc).toCard() });
  } catch (err) {
    // A malformed id throws a CastError; treat it as "not found".
    if (err.name === 'CastError') return res.status(404).json({ error: 'Match not found.' });
    console.error('GET /api/matches/:id failed:', err.message);
    res.status(500).json({ error: 'Could not load the match.' });
  }
});

// POST /api/matches  -> the logged-in user creates (hosts) a new match.
router.post('/', auth, async (req, res) => {
  try {
    const b = req.body || {};
    const title = (b.title || '').trim();
    const openSpots = Number(b.openSpots);
    const durationMinutes = Number(b.durationMinutes);
    const { date: todayStr, time: nowTime } = nowParts();

    // Server-side validation (mirrors the live checks in the browser).
    if (title.length < 3) return res.status(400).json({ error: 'Match title must be at least 3 characters.' });
    if (!b.area || !b.venue) return res.status(400).json({ error: 'Please choose an area and a venue.' });
    if (!b.date || !b.time) return res.status(400).json({ error: 'Please choose a date and start time.' });
    if (b.date < todayStr) return res.status(400).json({ error: 'The date cannot be in the past.' });
    if (b.date === todayStr && b.time < nowTime) {
      return res.status(400).json({ error: 'That start time has already passed today.' });
    }
    if (!(durationMinutes > 0)) return res.status(400).json({ error: 'Please choose a duration.' });
    if (!SkillLevel.isValid(b.skillLevel)) return res.status(400).json({ error: 'Please choose a skill level.' });
    if (!Match.AGE_GROUPS.includes(b.ageGroup)) return res.status(400).json({ error: 'Please choose an age group.' });
    if (!Match.GROUP_TYPES.includes(b.groupType)) return res.status(400).json({ error: 'Please choose a group type.' });
    if (!(openSpots >= 1 && openSpots <= 4)) {
      return res.status(400).json({ error: 'Open spots must be between 1 and 4.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'Please log in again.' });
    const initials = user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

    const match = await Match.create({
      title,
      area: b.area,
      venue: b.venue,
      location: b.location || b.area,
      date: b.date,
      time: b.time,
      durationMinutes,
      skillLevel: b.skillLevel,
      ageGroup: b.ageGroup,
      groupType: b.groupType,
      notes: (b.notes || '').slice(0, 200),
      capacity: 4,
      spotsTaken: 4 - openSpots, // openSpots become the spots left to fill
      players: [],
      host: user._id,
      hostName: user.name,
      hostInitials: initials,
    });

    res.status(201).json({ match: new PadelMatch(match).toCard() });
  } catch (err) {
    console.error('POST /api/matches failed:', err.message);
    res.status(500).json({ error: 'Could not create the match. Please try again.' });
  }
});

// POST /api/matches/:id/join  -> the logged-in user joins a match (a write).
router.post('/:id/join', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found.' });

    const info = new PadelMatch(match);

    // Cannot join a full match.
    if (info.isFull) return res.status(409).json({ error: 'This match is already full.' });

    // Cannot join the same match twice.
    const already = match.players.some((p) => String(p) === String(req.userId));
    if (already || String(match.host) === String(req.userId)) {
      return res.status(409).json({ error: 'You are already in this match.' });
    }

    match.players.push(req.userId);
    match.spotsTaken = (match.spotsTaken ?? 0) + 1;
    await match.save();

    res.status(201).json({ match: new PadelMatch(match).toCard() });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ error: 'Match not found.' });
    console.error('POST /api/matches/:id/join failed:', err.message);
    res.status(500).json({ error: 'Could not join the match. Please try again.' });
  }
});

module.exports = router;

