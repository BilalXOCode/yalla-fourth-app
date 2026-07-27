// users collection. Auth (bcrypt hashing + login) is wired in Stage 5;
// the schema is defined here so the data layer is complete.
const mongoose = require('mongoose');
const SkillLevel = require('../lib/SkillLevel.js');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    skillLevel: {
      type: String,
      enum: SkillLevel.keys(),
      default: 'beginner',
    },
    quizScore: { type: Number, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('User', userSchema);
