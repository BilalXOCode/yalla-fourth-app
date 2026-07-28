// Seed script: fills MongoDB with sample UAE venues and realistic matches.
// Run from the server folder with:  npm run seed
// (or from the app root with:       npm run seed)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
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

// A start slot a given number of hours from right now, rounded up to the next
// half hour so times look natural. Returns { date: 'YYYY-MM-DD', time: 'HH:MM' }
// in local time. Because every slot is anchored to "now", the seeded matches are
// always in the future no matter which day (or time of day) the seed is run.
function slot(hoursFromNow) {
  const d = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const m = d.getMinutes();
  if (m !== 0 && m !== 30) {
    if (m < 30) d.setMinutes(30, 0, 0);
    else d.setHours(d.getHours() + 1, 0, 0, 0); // rolls the day over cleanly at 23:xx
  } else {
    d.setSeconds(0, 0);
  }
  const p = (x) => String(x).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    time: `${p(d.getHours())}:${p(d.getMinutes())}`,
  };
}

// spotsTaken is set so spotsLeft = capacity(4) - spotsTaken lines up with the
// "N left" shown on the cards (status is derived: 1 left = almost full, 0 = full).
function buildMatches() {
  // hoursFromNow spreads the matches across today (later on) and the next few
  // days, with a mix of times. slot() turns each into a real future date/time.
  const defs = [
    {
      title: 'Evening game at Zayed Sports City', venue: 'Zayed Sports City Padel',
      area: 'Zayed Sports City', location: 'Zayed Sports City, Abu Dhabi',
      hoursFromNow: 2, durationMinutes: 90,
      skillLevel: 'intermediate', ageGroup: '30 to 45', groupType: 'mixed',
      capacity: 4, spotsTaken: 3, hostName: 'Khalid Al Falasi', hostInitials: 'KA',
      notes: 'Balls provided, just bring your racket.',
    },
    {
      title: 'After work doubles', venue: 'Just Padel',
      area: 'Al Quoz', location: 'Al Quoz, Dubai · Court 4',
      hoursFromNow: 4, durationMinutes: 90,
      skillLevel: 'intermediate', ageGroup: '18 to 30', groupType: 'mixed',
      capacity: 4, spotsTaken: 2, hostName: 'Saeed Al Mansoori', hostInitials: 'SA',
      notes: '',
    },
    {
      title: 'Competitive men’s night', venue: 'Matcha Club',
      area: 'Al Quoz', location: 'Al Quoz, Dubai',
      hoursFromNow: 6, durationMinutes: 60,
      skillLevel: 'advanced', ageGroup: '18 to 30', groupType: 'mens',
      capacity: 4, spotsTaken: 3, hostName: 'Omar Haddad', hostInitials: 'OH',
      notes: 'Fast paced, advanced players only please.',
    },
    {
      title: 'Late night rally', venue: 'Dubai Sports City Padel',
      area: 'Dubai Sports City', location: 'Dubai Sports City, Dubai',
      hoursFromNow: 8, durationMinutes: 90,
      skillLevel: 'advanced', ageGroup: '18 to 30', groupType: 'mixed',
      capacity: 4, spotsTaken: 4, hostName: 'Rashed Al Nuaimi', hostInitials: 'RA',
      notes: '',
    },
    {
      title: 'Early morning session', venue: 'The Smash Room',
      area: 'Umm Suqeim', location: 'Umm Suqeim, Dubai',
      hoursFromNow: 20, durationMinutes: 60,
      skillLevel: 'improver', ageGroup: '30 to 45', groupType: 'mixed',
      capacity: 4, spotsTaken: 1, hostName: 'Priya Nair', hostInitials: 'PN',
      notes: 'Relaxed pace, good for warming up the week.',
    },
    {
      title: 'Ladies friendly', venue: 'Reform Athletica',
      area: 'Dubai Design District', location: 'Dubai Design District, Dubai',
      hoursFromNow: 23, durationMinutes: 90,
      skillLevel: 'beginner', ageGroup: '18 to 30', groupType: 'womens',
      capacity: 4, spotsTaken: 2, hostName: 'Mariam Al Suwaidi', hostInitials: 'MA',
      notes: 'Beginners very welcome.',
    },
    {
      title: 'Yas Island doubles', venue: 'Yas Padel Hub',
      area: 'Yas Island', location: 'Yas Island, Abu Dhabi · Court 4',
      hoursFromNow: 27, durationMinutes: 90,
      skillLevel: 'advanced', ageGroup: '18 to 30', groupType: 'mixed',
      capacity: 4, spotsTaken: 2, hostName: 'James Whitfield', hostInitials: 'JW',
      notes: '',
    },
    {
      title: 'Junior friendly', venue: 'Padel Point',
      area: 'Al Majaz', location: 'Al Majaz, Sharjah',
      hoursFromNow: 31, durationMinutes: 60,
      skillLevel: 'beginner', ageGroup: 'under 18', groupType: 'mens',
      capacity: 4, spotsTaken: 2, hostName: 'Yusuf Rahman', hostInitials: 'YR',
      notes: 'Under 18 only.',
    },
    {
      title: 'Weekend warm up', venue: 'Reem Central Padel',
      area: 'Al Reem Island', location: 'Al Reem Island, Abu Dhabi',
      hoursFromNow: 46, durationMinutes: 90,
      skillLevel: 'improver', ageGroup: '45 plus', groupType: 'mixed',
      capacity: 4, spotsTaken: 1, hostName: 'Aisha Al Ketbi', hostInitials: 'AA',
      notes: '',
    },
    {
      title: 'Sharjah social', venue: 'Pace by SECC',
      area: 'Aljada', location: 'Aljada, Sharjah',
      hoursFromNow: 70, durationMinutes: 90,
      skillLevel: 'intermediate', ageGroup: '30 to 45', groupType: 'womens',
      capacity: 4, spotsTaken: 3, hostName: 'Elena Petrova', hostInitials: 'EP',
      notes: 'Friendly group, come say hi.',
    },
  ];

  // Turn each hoursFromNow into a real, always-future date + time.
  return defs.map(({ hoursFromNow, ...rest }) => ({ ...rest, ...slot(hoursFromNow) }));
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
