// Venue reads. GET only (this route never writes).
const express = require('express');
const Venue = require('../models/Venue.js');

const router = express.Router();

// GET /api/venues  -> all venues, plus the distinct area list for dropdowns.
router.get('/', async (req, res) => {
  try {
    const venues = await Venue.find().sort({ emirate: 1, name: 1 }).lean();
    const areas = [...new Set(venues.map((v) => v.area))].sort();
    res.json({ venues, areas });
  } catch (err) {
    console.error('GET /api/venues failed:', err.message);
    res.status(500).json({ error: 'Could not load venues.' });
  }
});

module.exports = router;
