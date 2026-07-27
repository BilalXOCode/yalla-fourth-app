// Match reads. GET only (writing/creating a match is a POST, added in Stage 6).
const express = require('express');
const Match = require('../models/Match.js');
const PadelMatch = require('../lib/PadelMatch.js');
const auth = require('../middleware/auth.js');

const router = express.Router();

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

