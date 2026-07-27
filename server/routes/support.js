// Support messages. A read is not needed here; the page only writes, so this
// is a single POST that saves either a complaint or a feedback into the
// supportMessages collection. Validation mirrors the live checks in the browser.
const express = require('express');
const SupportMessage = require('../models/SupportMessage.js');

const router = express.Router();

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

// A light email shape check (the browser checks this too).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/support  -> save one complaint or feedback message.
router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const type = b.type;
    const message = (b.message || '').trim();

    if (type !== 'complaint' && type !== 'feedback') {
      return res.status(400).json({ error: 'Please choose complaint or feedback.' });
    }
    if (!message) return res.status(400).json({ error: 'Please write a message.' });
    if (message.length > 600) return res.status(400).json({ error: 'Message is too long (max 600).' });

    const doc = { type, message };

    if (type === 'complaint') {
      const category = (b.category || '').trim();
      const subject = (b.subject || '').trim();
      const contactEmail = (b.contactEmail || '').trim().toLowerCase();

      if (!COMPLAINT_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Please choose a category.' });
      }
      if (subject.length < 3) return res.status(400).json({ error: 'Please add a short subject.' });
      if (!EMAIL_RE.test(contactEmail)) {
        return res.status(400).json({ error: 'Please enter a valid contact email.' });
      }

      doc.category = category;
      doc.subject = subject;
      doc.contactEmail = contactEmail;
      doc.matchRef = (b.matchRef || '').trim();
      doc.playerName = (b.playerName || '').trim();
    } else {
      const rating = Number(b.rating);
      const category = (b.category || '').trim();
      const wouldRecommend = b.wouldRecommend || null;

      if (!(rating >= 1 && rating <= 5)) {
        return res.status(400).json({ error: 'Please give a star rating.' });
      }
      if (category && !FEEDBACK_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Please choose a valid category.' });
      }
      if (wouldRecommend && !RECOMMEND.includes(wouldRecommend)) {
        return res.status(400).json({ error: 'Please choose a valid option.' });
      }

      doc.rating = rating;
      doc.category = category;
      doc.wouldRecommend = wouldRecommend;
      doc.canContact = !!b.canContact;
      if (doc.canContact) doc.contactEmail = (b.contactEmail || '').trim().toLowerCase();
    }

    const saved = await SupportMessage.create(doc);
    res.status(201).json({ id: saved._id, type: saved.type });
  } catch (err) {
    console.error('POST /api/support failed:', err.message);
    res.status(500).json({ error: 'Could not send your message. Please try again.' });
  }
});

module.exports = router;
