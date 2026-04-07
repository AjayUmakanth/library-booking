const bookingService = require('../services/bookingService');
const { OPEN_HOUR, CLOSE_HOUR } = bookingService;
const bookingRepository = require('../repositories/bookingRepository');
const {
  todayIsoInTimezone,
  validateBookingDateString,
  maxBookableIso,
  APP_TIMEZONE,
  todayIsoInAppTimezone,
  minStartHourForDate,
} = require('../utils/dateUtils');

function frontendBase() {
  return process.env.FRONTEND_URL || 'http://localhost:3001';
}

/**
 * Prefer X-Frontend-Origin from the SPA (always matches the tab’s port), then Origin / Referer, then FRONTEND_URL.
 */
function resolveFrontendBase(req) {
  const fromClient = req.get('x-frontend-origin');
  if (fromClient && /^https?:\/\//i.test(fromClient.trim())) {
    try {
      return new URL(fromClient.trim()).origin.replace(/\/$/, '');
    } catch {
      /* ignore */
    }
  }
  const origin = req.get('origin');
  if (origin && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/$/, '');
  }
  const referer = req.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin.replace(/\/$/, '');
    } catch {
      /* ignore */
    }
  }
  return frontendBase();
}

function cancelUrlForToken(req, token) {
  return `${resolveFrontendBase(req)}/cancel/${token}`;
}

function sanitizeBookingList(rows) {
  return rows.map((b) => {
    const { cancel_token: _t, password_hash: _p, ...rest } = b;
    return rest;
  });
}

function omitCancelToken(booking) {
  if (!booking) return null;
  const { cancel_token: _c, ...rest } = booking;
  return rest;
}

function getAvailable(req, res) {
  const selectedDate = req.query.date || todayIsoInTimezone();
  const dateCheck = validateBookingDateString(selectedDate);
  const effectiveDate = dateCheck.valid ? dateCheck.date : todayIsoInAppTimezone();
  const availability = bookingService.getAvailabilityForDate(effectiveDate);
  const todayIso = todayIsoInAppTimezone();
  const isSelectedDateToday = effectiveDate === todayIso;
  const minStart = minStartHourForDate(effectiveDate);
  const hasBookableSlotsToday =
    !isSelectedDateToday || (minStart != null && minStart <= CLOSE_HOUR - 1);
  return res.json({
    selectedDate: effectiveDate,
    dateInvalid: !dateCheck.valid,
    minBookDate: todayIsoInAppTimezone(),
    maxBookDate: maxBookableIso(),
    openHour: OPEN_HOUR,
    closeHour: CLOSE_HOUR,
    timeZone: APP_TIMEZONE,
    isSelectedDateToday,
    minStartHourForToday: isSelectedDateToday ? minStart : null,
    hasBookableSlotsToday,
    availability,
  });
}

function postCreate(req, res) {
  const result = bookingService.createBooking(req.user.id, req.body);
  if (!result.ok) {
    return res.status(400).json({ errors: result.errors });
  }
  const cancelUrl = cancelUrlForToken(req, result.booking.cancel_token);
  return res.status(201).json({
    booking: omitCancelToken(result.booking),
    cancelUrl,
  });
}

function getSuccess(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Invalid booking.' });
  }
  const booking = bookingRepository.findById(id);
  if (!booking || booking.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Booking not found.' });
  }
  const cancelUrl = cancelUrlForToken(req, booking.cancel_token);
  return res.json({
    booking: omitCancelToken(booking),
    cancelUrl,
  });
}

function mineBookingPublicFields(b, req) {
  const { cancel_token, ...rest } = b;
  const out = { ...rest };
  if (cancel_token) {
    out.cancelUrl = cancelUrlForToken(req, cancel_token);
  }
  return out;
}

function getMine(req, res) {
  const { future, past } = bookingService.listMine(req.user.id);
  return res.json({
    future: future.map((b) => mineBookingPublicFields(b, req)),
    past: sanitizeBookingList(past),
  });
}

function getCancelToken(req, res) {
  const token = req.params.token;
  const preview = bookingService.getCancelPreview(token);
  if (!preview.ok && preview.error === 'not_found') {
    return res.status(404).json({
      error: 'This cancellation link is invalid or the booking was already cancelled.',
    });
  }
  if (!preview.ok) {
    return res.status(404).json({ error: 'This cancellation link is not valid.' });
  }
  return res.json({ booking: omitCancelToken(preview.booking) });
}

function postCancelToken(req, res) {
  const token = req.params.token;
  const result = bookingService.cancelByToken(token);
  if (!result.ok) {
    if (result.error === 'not_found') {
      return res.status(404).json({
        error: 'This booking could not be found. It may have already been cancelled.',
      });
    }
    return res.status(400).json({ error: 'This cancellation link is not valid.' });
  }
  return res.json({
    ok: true,
    booking: omitCancelToken(result.booking),
  });
}

module.exports = {
  getAvailable,
  postCreate,
  getSuccess,
  getMine,
  getCancelToken,
  postCancelToken,
};
