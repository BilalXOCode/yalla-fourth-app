// Match rules shared by the UI. For now this only powers the display-only
// leave-deadline disclaimer; no reliability score or point deduction exists yet.

// How many hours before the start time a player may still leave without a
// penalty. Single source of truth so it is easy to change later.
export const LEAVE_CUTOFF_HOURS = 2;

// Build the match start Date from the stored date (YYYY-MM-DD) + time (HH:MM).
export function matchStart(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const d = new Date(`${dateStr}T${timeStr}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// The latest moment a player may leave without a penalty (start minus cutoff).
export function leaveDeadline(dateStr, timeStr) {
  const start = matchStart(dateStr, timeStr);
  if (!start) return null;
  return new Date(start.getTime() - LEAVE_CUTOFF_HOURS * 60 * 60 * 1000);
}

// Localised clock time, e.g. "7:00 PM" in English or the Arabic equivalent.
export function formatClock(date, lang) {
  if (!date) return '';
  return date.toLocaleTimeString(lang === 'ar' ? 'ar' : 'en', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
