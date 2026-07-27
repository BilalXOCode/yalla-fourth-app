// supportMessages collection. Handles both complaint and feedback submissions
// (Stage 7). Defined now so the data layer is complete.
const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['complaint', 'feedback'], required: true },
    category: { type: String, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 600 },

    // Complaint-only optional context.
    matchRef: { type: String, trim: true },
    playerName: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },

    // Feedback-only fields.
    rating: { type: Number, min: 0, max: 5, default: null },
    wouldRecommend: { type: String, enum: ['yes', 'maybe', 'no', null], default: null },
    canContact: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SupportMessage', supportSchema);
