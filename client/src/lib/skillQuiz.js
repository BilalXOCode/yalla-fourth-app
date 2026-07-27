// Skill quiz logic. The five questions and their four options live in the i18n
// files (account.quiz.questions) so they are bilingual. Each option is ordered
// from least to most experienced, so its index (0..3) is its score.
// Total score (0..15) maps to a skill level.

export const QUIZ_LENGTH = 5;

// Sum an array of chosen option indexes into a level.
export function scoreToLevel(total) {
  if (total <= 3) return 'beginner';
  if (total <= 7) return 'improver';
  if (total <= 11) return 'intermediate';
  return 'advanced';
}
