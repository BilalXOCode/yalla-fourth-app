// Helpers for user data: computing the age group from a birth date and
// producing a "safe" user object (never includes the password hash).

// Turn a YYYY-MM-DD birth date into one of the four age groups.
function computeAgeGroup(dob) {
  if (!dob) return '18 to 30';
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return '18 to 30';
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;

  if (age < 18) return 'under 18';
  if (age <= 30) return '18 to 30';
  if (age <= 45) return '30 to 45';
  return '45 plus';
}

// The user object sent back to its owner (no password hash).
function safeUser(u) {
  return {
    id: String(u._id),
    name: u.name,
    username: u.username,
    email: u.email,
    dob: u.dob,
    ageGroup: u.ageGroup,
    gender: u.gender,
    nationality: u.nationality,
    city: u.city,
    preferredLanguage: u.preferredLanguage,
    preferredArea: u.preferredArea,
    nearbyVenue: u.nearbyVenue,
    preferredGroupType: u.preferredGroupType,
    usualPlayingTime: u.usualPlayingTime,
    playingHand: u.playingHand,
    skillLevel: u.skillLevel,
    quizScore: u.quizScore,
  };
}

module.exports = { computeAgeGroup, safeUser };
