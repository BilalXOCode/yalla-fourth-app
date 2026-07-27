// venues collection. Reference data used to fill the Area and Venue dropdowns
// on the Find Matches and Create Match pages.
const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    emirate: {
      type: String,
      required: true,
      enum: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Venue', venueSchema);
