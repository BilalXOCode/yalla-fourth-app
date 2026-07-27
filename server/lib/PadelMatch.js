// Object-oriented wrapper around a match document. Keeps all the "match
// logic" (how many spots are left, whether it is full, its status label, and
// the shape sent to the browser) in one class instead of scattered helpers.
const SkillLevel = require('./SkillLevel.js');

class PadelMatch {
  // A padel match is always four players.
  static CAPACITY = 4;

  constructor(doc) {
    // Accepts a Mongoose document or a plain object.
    this.doc = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  }

  get capacity() {
    return this.doc.capacity ?? PadelMatch.CAPACITY;
  }

  // How many of the four seats are taken (host + anyone who joined).
  get spotsTaken() {
    return this.doc.spotsTaken ?? 0;
  }

  get spotsLeft() {
    return Math.max(0, this.capacity - this.spotsTaken);
  }

  get isFull() {
    return this.spotsLeft <= 0;
  }

  // Derived status used for the coloured badge on the cards.
  get status() {
    if (this.isFull) return 'full';
    if (this.spotsLeft === 1) return 'almost-full';
    return 'open';
  }

  skill() {
    return new SkillLevel(this.doc.skillLevel);
  }

  // The exact JSON shape the frontend match cards expect.
  toCard() {
    return {
      id: String(this.doc._id),
      title: this.doc.title,
      venue: this.doc.venue,
      area: this.doc.area,
      location: this.doc.location || this.doc.area,
      date: this.doc.date,
      time: this.doc.time,
      durationMinutes: this.doc.durationMinutes,
      skill: this.doc.skillLevel,
      skillColor: this.skill().color,
      groupType: this.doc.groupType,
      ageGroup: this.doc.ageGroup,
      hostName: this.doc.hostName,
      hostInitials: this.doc.hostInitials,
      capacity: this.capacity,
      spotsLeft: this.spotsLeft,
      status: this.status,
      notes: this.doc.notes || '',
    };
  }

  // Turn a list of docs into cards, most upcoming first is handled by the query.
  static toCards(docs) {
    return docs.map((d) => new PadelMatch(d).toCard());
  }
}

module.exports = PadelMatch;
