// matches collection.
const mongoose = require('mongoose');
const SkillLevel = require('../lib/SkillLevel.js');

const AGE_GROUPS = ['under 18', '18 to 30', '30 to 45', '45 plus'];
const GROUP_TYPES = ['mixed', 'mens', 'womens'];

const matchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    // Free-text venue line shown on the card, e.g. "Yas Island, Abu Dhabi · Court 4".
    location: { type: String, trim: true },

    // Stored as simple strings to match the form fields and make the
    // venue + date + time duplicate check (Stage 6) straightforward.
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:MM (24h)
    durationMinutes: { type: Number, default: 90 },

    skillLevel: { type: String, enum: SkillLevel.keys(), required: true },
    ageGroup: { type: String, enum: AGE_GROUPS, required: true },
    groupType: { type: String, enum: GROUP_TYPES, required: true },

    notes: { type: String, default: '', maxlength: 200 },

    // Match logic. A padel match seats four. spotsTaken counts the host plus
    // anyone who has joined; players holds the real users who joined (Stage 5).
    capacity: { type: Number, default: 4 },
    spotsTaken: { type: Number, default: 1 },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Denormalised host display fields (seed hosts are sample people).
    hostName: { type: String, required: true },
    hostInitials: { type: String, required: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

matchSchema.statics.AGE_GROUPS = AGE_GROUPS;
matchSchema.statics.GROUP_TYPES = GROUP_TYPES;

module.exports = mongoose.model('Match', matchSchema);
