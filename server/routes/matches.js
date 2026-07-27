// Match reads. GET only (writing/creating a match is a POST, added in Stage 6).
const express = require('express');
const Match = require('../models/Match.js');
const PadelMatch = require('../lib/PadelMatch.js');

const router = express.Router();

// GET /api/matches
// Optional query filters (all read-only): area, venue, skill, group, age,
// status, q (search), limit. Returns match cards shaped by the PadelMatch class.
router.get('/', async (req, res) => {
  try {
    const { area, venue, skill, group, age, status, q, limit } = req.query;

    const query = {};
    if (area) query.area = area;
    if (venue) query.venue = venue;
    if (skill) query.skillLevel = skill;
    if (group) query.groupType = group;
    if (age) query.ageGroup = age;
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

    // status is derived, so filter it after shaping.
    if (status) cards = cards.filter((c) => c.status === status);

    const max = Number.parseInt(limit, 10);
    if (!Number.isNaN(max) && max > 0) cards = cards.slice(0, max);

    res.json({ count: cards.length, matches: cards });
  } catch (err) {
    console.error('GET /api/matches failed:', err.message);
    res.status(500).json({ error: 'Could not load matches.' });
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

module.exports = router;
