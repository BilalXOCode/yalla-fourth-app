// users collection. Passwords are stored only as a bcrypt hash.
// Private fields (dob, nationality) are never exposed in public match data;
// only the owner sees them via /api/auth/me.
const mongoose = require('mongoose');
const SkillLevel = require('../lib/SkillLevel.js');

const AGE_GROUPS = ['under 18', '18 to 30', '30 to 45', '45 plus'];

const userSchema = new mongoose.Schema(
  {
    // --- Account details ---
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // --- Personal details (private) ---
    dob: { type: String, default: '' }, // YYYY-MM-DD, never shown publicly
    ageGroup: { type: String, enum: AGE_GROUPS, default: '18 to 30' },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer-not', ''], default: '' },
    nationality: { type: String, default: '' }, // private
    city: { type: String, default: '' },
    preferredLanguage: { type: String, enum: ['en', 'ar'], default: 'en' },

    // --- Padel preferences ---
    preferredArea: { type: String, default: '' },
    nearbyVenue: { type: String, default: '' },
    preferredGroupType: { type: String, enum: ['open', 'female', 'male', 'mixed', ''], default: 'open' },
    usualPlayingTime: { type: String, enum: ['morning', 'afternoon', 'evening', ''], default: '' },
    playingHand: { type: String, enum: ['right', 'left', ''], default: '' },

    // --- Skill (from the quiz) ---
    skillLevel: { type: String, enum: SkillLevel.keys(), default: 'beginner' },
    quizScore: { type: Number, default: null },
  },
  { timestamps: true },
);

userSchema.statics.AGE_GROUPS = AGE_GROUPS;

module.exports = mongoose.model('User', userSchema);
