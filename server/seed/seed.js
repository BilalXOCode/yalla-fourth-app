// Seed script: fills MongoDB with sample UAE venues and realistic matches.
// Run from the server folder with:  npm run seed
// (or from the app root with:       npm run seed)
require('dotenv').config();
const mongoose = require('mongoose');
const Venue = require('../models/Venue.js');
const Match = require('../models/Match.js');

// --- Sample venues across the UAE (area = neighbourhood) ------------------
const VENUES = [
  { name: 'Just Padel', area: 'Al Quoz', emirate: 'Dubai' },
  { name: 'Matcha Club', area: 'Al Quoz', emirate: 'Dubai' },
  { name: 'The Smash Room', area: 'Umm Suqeim', emirate: 'Dubai' },
  { name: 'Reform Athletica', area: 'Dubai Design District', emirate: 'Dubai' },
  { name: 'Dubai Sports City Padel', area: 'Dubai Sports City', emirate: 'Dubai' },
  { name: 'Yas Padel Hub', area: 'Yas Island', emirate: 'Abu Dhabi' },
  { name: 'Reem Central Padel', area: 'Al Reem Island', emirate: 'Abu Dhabi' },
  { name: 'Zayed Sports City Padel', area: 'Zayed Sports City', emirate: 'Abu Dhabi' },
  { name: 'Padel Point', area: 'Al Majaz', emirate: 'Sharjah' },
  { name: 'Pace by SECC', area: 'Aljada', emirate: 'Sharjah' },
];

// A date N days from today as YYYY-MM-DD.
function ymd(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

// spotsTaken is set so spotsLeft = capacity(4) - spotsTaken lines up with the
// "N left" shown on the cards (status is derived: 1 left = almost full, 0 = full).
function buildMatches() {
  return [
    {
      title: 'Evening game at Zayed Sports City', venue: 'Zayed Sports City Padel',
      area: 'Zayed Sports City', location: 'Zayed Sports City, Abu Dhabi',
      date: ymd(0), time: '16:00', durationMinutes: 90,
      skillLevel: 'intermediate', ageGroup: '30 to 45', groupType: 'mixed',
      capacity: 4, spotsTaken: 3, hostName: 'Khalid Al Falasi', hostInitials: 'KA',
      notes: 'Balls provided, just bring your racket.',
    },
    {
      title: 'After work doubles', venue: 'Just Padel',
      area: 'Al Quoz', location: 'Al Quoz, Dubai · Court 4',
      date: ymd(0), time: '18:30', durationMinutes: 90,
      skillLevel: 'intermediate', ageGroup: '18 to 30', groupType: 'mixed',
      capacity: 4, spotsTaken: 2, hostName: 'Saeed Al Mansoori', hostInitials: 'SA',
      notes: '',
    },
    {
      title: 'Competitive men’s night', venue: 'Matcha Club',
      area: 'Al Quoz', location: 'Al Quoz, Dubai',
      date: ymd(0), time: '20:00', durationMinutes: 60,
      skillLevel: 'advanced', ageGroup: '18 to 30', groupType: 'mens',
      capacity: 4, spotsTaken: 3, hostName: 'Omar Haddad', hostInitials: 'OH',
      notes: 'Fast paced, advanced players only please.',
    },
    {
      title: 'Late night rally', venue: 'Dubai Sports City Padel',
      area: 'Dubai Sports City', location: 'Dubai Sports City, Dubai',
      date: ymd(0), time: '22:00', durationMinutes: 90,
      skillLevel: 'advanced', ageGroup: '18 to 30', groupType: 'mixed',
      capacity: 4, spotsTaken: 4, hostName: 'Rashed Al Nuaimi', hostInitials: 'RA',
      notes: '',
    },
    {
      title: 'Early morning session', venue: 'The Smash Room',
      area: 'Umm Suqeim', location: 'Umm Suqeim, Dubai',
      date: ymd(1), time: '07:00', durationMinutes: 60,
      skillLevel: 'improver', ageGroup: '30 to 45', groupType: 'mixed',
      capacity: 4, spotsTaken: 1, hostName: 'Priya Nair', hostInitials: 'PN',
      notes: 'Relaxed pace, good for warming up the week.',
    },
    {
      title: 'Ladies friendly', venue: 'Reform Athletica',
      area: 'Dubai Design District', location: 'Dubai Design District, Dubai',
      date: ymd(1), time: '19:00', durationMinutes: 90,
      skillLevel: 'beginner', ageGroup: '18 to 30', groupType: 'womens',
      capacity: 4, spotsTaken: 2, hostName: 'Mariam Al Suwaidi', hostInitials: 'MA',
      notes: 'Beginners very welcome.',
    },
    {
      title: 'Yas Island doubles', venue: 'Yas Padel Hub',
      area: 'Yas Island', location: 'Yas Island, Abu Dhabi · Court 4',
      date: ymd(1), time: '21:00', durationMinutes: 90,
      skillLevel: 'advanced', ageGroup: '18 to 30', groupType: 'mixed',
      capacity: 4, spotsTaken: 2, hostName: 'James Whitfield', hostInitials: 'JW',
      notes: '',
    },
    {
      title: 'Junior friendly', venue: 'Padel Point',
      area: 'Al Majaz', location: 'Al Majaz, Sharjah',
      date: ymd(1), time: '17:30', durationMinutes: 60,
      skillLevel: 'beginner', ageGroup: 'under 18', groupType: 'mens',
      capacity: 4, spotsTaken: 2, hostName: 'Yusuf Rahman', hostInitials: 'YR',
      notes: 'Under 18 only.',
    },
    {
      title: 'Weekend warm up', venue: 'Reem Central Padel',
      area: 'Al Reem Island', location: 'Al Reem Island, Abu Dhabi',
      date: ymd(2), time: '09:00', durationMinutes: 90,
      skillLevel: 'improver', ageGroup: '45 plus', groupType: 'mixed',
      capacity: 4, spotsTaken: 1, hostName: 'Aisha Al Ketbi', hostInitials: 'AA',
      notes: '',
    },
    {
      title: 'Sharjah social', venue: 'Pace by SECC',
      area: 'Aljada', location: 'Aljada, Sharjah',
      date: ymd(3), time: '20:30', durationMinutes: 90,
      skillLevel: 'intermediate', ageGroup: '30 to 45', groupType: 'womens',
      capacity: 4, spotsTaken: 3, hostName: 'Elena Petrova', hostInitials: 'EP',
      notes: 'Friendly group, come say hi.',
    },
  ];
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('\n❌  No MONGODB_URI in server/.env. Paste your Atlas connection string first, then run the seed again.\n');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected. Seeding...');

    // Clear only the collections we are reseeding (users are left untouched).
    await Venue.deleteMany({});
    await Match.deleteMany({});

    const venues = await Venue.insertMany(VENUES);
    const matches = await Match.insertMany(buildMatches());

    console.log(`\n✅  Seed complete:`);
    console.log(`    ${venues.length} venues`);
    console.log(`    ${matches.length} matches`);
    console.log('');
  } catch (err) {
    console.error('\n❌  Seed failed:', err.message, '\n');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
