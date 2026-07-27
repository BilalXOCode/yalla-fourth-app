// Authentication routes.
// POST register / login (writes), GET me (read), POST quiz (write, update level).
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const SkillLevel = require('../lib/SkillLevel.js');
const auth = require('../middleware/auth.js');
const { computeAgeGroup, safeUser } = require('../lib/userUtils.js');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(userId, rememberMe) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : '7d',
  });
}

// POST /api/auth/register  -> create a new account
router.post('/register', async (req, res) => {
  try {
    const b = req.body || {};
    const name = (b.name || '').trim();
    const username = (b.username || '').trim().toLowerCase();
    const email = (b.email || '').trim().toLowerCase();
    const password = b.password || '';

    // Basic validation (the browser also validates field by field).
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'Please fill in name, username, email and password.' });
    }
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    // Uniqueness checks with clear messages.
    if (await User.findOne({ email })) return res.status(409).json({ error: 'That email is already registered.' });
    if (await User.findOne({ username })) return res.status(409).json({ error: 'That username is already taken.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const skillLevel = SkillLevel.isValid(b.skillLevel) ? b.skillLevel : 'beginner';

    const user = await User.create({
      name,
      username,
      email,
      passwordHash,
      dob: b.dob || '',
      ageGroup: computeAgeGroup(b.dob),
      gender: b.gender || '',
      nationality: b.nationality || '',
      city: b.city || '',
      preferredLanguage: b.preferredLanguage === 'ar' ? 'ar' : 'en',
      preferredArea: b.preferredArea || '',
      nearbyVenue: b.nearbyVenue || '',
      preferredGroupType: b.preferredGroupType || 'open',
      usualPlayingTime: b.usualPlayingTime || '',
      playingHand: b.playingHand || '',
      skillLevel,
      quizScore: typeof b.quizScore === 'number' ? b.quizScore : null,
    });

    res.status(201).json({ token: signToken(user._id, b.rememberMe), user: safeUser(user) });
  } catch (err) {
    console.error('register failed:', err.message);
    res.status(500).json({ error: 'Could not create your account. Please try again.' });
  }
});

// POST /api/auth/login  -> verify credentials, return a token
router.post('/login', async (req, res) => {
  try {
    const identifier = (req.body?.identifier || '').trim().toLowerCase();
    const password = req.body?.password || '';
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter your email/username and password.' });
    }

    // The identifier can be either an email or a username.
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user) return res.status(401).json({ error: 'We could not find that account.' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Wrong password. Please try again.' });

    res.json({ token: signToken(user._id, req.body?.rememberMe), user: safeUser(user) });
  } catch (err) {
    console.error('login failed:', err.message);
    res.status(500).json({ error: 'Could not log you in. Please try again.' });
  }
});

// GET /api/auth/me  -> the current logged-in user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    res.json({ user: safeUser(user) });
  } catch (err) {
    console.error('me failed:', err.message);
    res.status(500).json({ error: 'Could not load your account.' });
  }
});

// POST /api/auth/quiz  -> retake the skill quiz (updates level)
router.post('/quiz', auth, async (req, res) => {
  try {
    const skillLevel = SkillLevel.isValid(req.body?.skillLevel) ? req.body.skillLevel : null;
    if (!skillLevel) return res.status(400).json({ error: 'Invalid quiz result.' });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { skillLevel, quizScore: typeof req.body.quizScore === 'number' ? req.body.quizScore : null },
      { new: true },
    );
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    res.json({ user: safeUser(user) });
  } catch (err) {
    console.error('quiz update failed:', err.message);
    res.status(500).json({ error: 'Could not save your quiz result.' });
  }
});

module.exports = router;
