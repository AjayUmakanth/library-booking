/** Facility opens at OPEN_HOUR, last slot ends at CLOSE_HOUR (exclusive boundary). */
const OPEN_HOUR = 7;
const CLOSE_HOUR = 21;

/** IANA timezone for all booking calendar / “now” rules (default Central European Time). */
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Europe/Berlin';

function formatPartsInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
}

function getNowInAppTimezone(now = new Date()) {
  const parts = formatPartsInZone(now, APP_TIMEZONE);
  const o = {};
  for (const p of parts) {
    if (p.type !== 'literal') o[p.type] = p.value;
  }
  const hour = parseInt(o.hour, 10);
  const minute = parseInt(o.minute, 10);
  const dateIso = `${o.year}-${o.month}-${o.day}`;
  return {
    dateIso,
    hour,
    minute,
    minutesSinceMidnight: hour * 60 + minute,
    timeZone: APP_TIMEZONE,
  };
}

function todayIsoInAppTimezone(now = new Date()) {
  return getNowInAppTimezone(now).dateIso;
}

/** Gregorian calendar add; safe for Y-M-D window checks. */
function addCalendarDaysIso(isoStr, daysToAdd) {
  const [y, m, d] = isoStr.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d + daysToAdd);
  const nd = new Date(t);
  return `${nd.getUTCFullYear()}-${String(nd.getUTCMonth() + 1).padStart(2, '0')}-${String(
    nd.getUTCDate()
  ).padStart(2, '0')}`;
}

function parseIsoDate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mon = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mon, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mon || dt.getUTCDate() !== d) {
    return null;
  }
  return { y, mon, d, str: `${m[1]}-${m[2]}-${m[3]}` };
}

function compareIsoDates(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * @returns {{ valid: true, date: string } | { valid: false, error: string }}
 */
function validateBookingDateString(iso, now = new Date()) {
  const parsed = parseIsoDate(iso);
  if (!parsed) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
  }
  const bookingStr = parsed.str;
  const { dateIso: todayIso } = getNowInAppTimezone(now);
  if (bookingStr < todayIso) {
    return { valid: false, error: 'Booking date cannot be in the past.' };
  }
  const maxStr = addCalendarDaysIso(todayIso, 7);
  if (bookingStr > maxStr) {
    return { valid: false, error: 'Booking date cannot be more than 7 days in the future.' };
  }
  return { valid: true, date: bookingStr };
}

function maxBookableIso(now = new Date()) {
  const todayIso = todayIsoInAppTimezone(now);
  return addCalendarDaysIso(todayIso, 7);
}

/** Earliest allowed start hour (integer) for bookings on `dateIso` if it is “today” in app TZ; else null. */
function minStartHourForDate(dateIso, now = new Date()) {
  const todayIso = todayIsoInAppTimezone(now);
  if (dateIso !== todayIso) return null;
  const { hour: curH } = getNowInAppTimezone(now);
  return Math.max(OPEN_HOUR, curH + 1);
}

module.exports = {
  OPEN_HOUR,
  CLOSE_HOUR,
  APP_TIMEZONE,
  getNowInAppTimezone,
  todayIsoInAppTimezone,
  /** @deprecated alias — use todayIsoInAppTimezone */
  todayIsoInTimezone: todayIsoInAppTimezone,
  parseIsoDate,
  compareIsoDates,
  validateBookingDateString,
  maxBookableIso,
  addCalendarDaysIso,
  minStartHourForDate,
};
