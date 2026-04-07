const {
  OPEN_HOUR,
  CLOSE_HOUR,
  APP_TIMEZONE,
  validateBookingDateString,
  minStartHourForDate,
} = require('./dateUtils');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateRegisterBody(body) {
  const errors = {};
  const name = String(body.name || '').trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const confirm = String(body.confirmPassword || body.confirm_password || '');

  if (!name || name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }
  if (!email || !EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (password !== confirm) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { name, email, password },
  };
}

function validateLoginBody(body) {
  const errors = {};
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email || !EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: { email, password },
  };
}

function validateBookingCreate(body) {
  const errors = {};
  const roomId = parseInt(body.roomId ?? body.room_id, 10);
  const bookingDate = String((body.bookingDate ?? body.booking_date) || '').trim();
  const startHour = parseInt(body.startHour ?? body.start_hour, 10);
  const duration = parseInt(body.duration, 10);
  const purpose = String(body.purpose || '').trim() || null;

  if (!Number.isFinite(roomId) || roomId < 1) {
    errors.roomId = 'Select a valid room.';
  }

  const dateCheck = validateBookingDateString(bookingDate);
  if (!dateCheck.valid) {
    errors.bookingDate = dateCheck.error;
  }

  if (!Number.isFinite(startHour) || startHour < OPEN_HOUR || startHour > CLOSE_HOUR - 1) {
    errors.startHour = `Start hour must be between ${OPEN_HOUR}:00 and ${CLOSE_HOUR - 1}:00.`;
  }

  if (dateCheck.valid && Number.isFinite(startHour)) {
    const minStart = minStartHourForDate(dateCheck.date);
    if (minStart != null && startHour < minStart) {
      errors.startHour = `For today, choose ${String(minStart).padStart(2, '0')}:00 or later (${APP_TIMEZONE}).`;
    }
  }

  if (!Number.isFinite(duration) || duration < 1 || duration > 6) {
    errors.duration = 'Duration must be between 1 and 6 hours.';
  }

  let endHour;
  if (Number.isFinite(startHour) && Number.isFinite(duration)) {
    endHour = startHour + duration;
    if (endHour > CLOSE_HOUR) {
      errors.duration = `Booking must end by ${CLOSE_HOUR}:00.`;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    values: {
      roomId,
      bookingDate: dateCheck.valid ? dateCheck.date : bookingDate,
      startHour,
      duration,
      endHour,
      purpose,
    },
  };
}

module.exports = {
  normalizeEmail,
  validateRegisterBody,
  validateLoginBody,
  validateBookingCreate,
};
