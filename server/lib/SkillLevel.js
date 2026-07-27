// Object-oriented model of a padel skill level.
// The ordered LEVELS array is the single source of truth for the four levels,
// their display order, bilingual labels and colours. It is reused by the
// Mongoose schemas (as the allowed values) and by the API responses.
class SkillLevel {
  // One meaningful array, used across the whole backend.
  static LEVELS = [
    { key: 'beginner', order: 1, label: { en: 'Beginner', ar: 'مبتدئ' }, color: '#34d399' },
    { key: 'improver', order: 2, label: { en: 'Improver', ar: 'متحسّن' }, color: '#60a5fa' },
    { key: 'intermediate', order: 3, label: { en: 'Intermediate', ar: 'متوسط' }, color: '#f5a623' },
    { key: 'advanced', order: 4, label: { en: 'Advanced', ar: 'متقدم' }, color: '#c6f135' },
  ];

  constructor(key) {
    const found = SkillLevel.LEVELS.find((l) => l.key === key);
    if (!found) throw new Error(`Unknown skill level: ${key}`);
    this.key = found.key;
    this.order = found.order;
    this._label = found.label;
    this.color = found.color;
  }

  label(lang = 'en') {
    return this._label[lang] || this._label.en;
  }

  // Compare two levels: negative if this is lower, positive if higher.
  compareTo(other) {
    return this.order - other.order;
  }

  toJSON() {
    return { key: this.key, order: this.order, label: this._label, color: this.color };
  }

  // --- Helpers built from the array ---
  static keys() {
    return SkillLevel.LEVELS.map((l) => l.key);
  }

  static isValid(key) {
    return SkillLevel.LEVELS.some((l) => l.key === key);
  }

  static all() {
    return SkillLevel.LEVELS.map((l) => new SkillLevel(l.key));
  }
}

module.exports = SkillLevel;
