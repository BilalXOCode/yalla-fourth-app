// Turns a YYYY-MM-DD string into a friendly, localised day label:
// "Today" / "Tomorrow" (via the translator) or a short weekday + date.
export function dayLabel(dateStr, lang, t) {
  if (!dateStr) return '';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  const diffDays = Math.round((target - startOfToday) / 86400000);

  if (diffDays === 0) return t('home.open.today');
  if (diffDays === 1) return t('home.open.tomorrow');

  return target.toLocaleDateString(lang === 'ar' ? 'ar' : 'en', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
