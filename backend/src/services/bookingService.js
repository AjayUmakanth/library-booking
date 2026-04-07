const bookingRepository = require('../repositories/bookingRepository');
const roomRepository = require('../repositories/roomRepository');
const { validateBookingCreate } = require('../utils/validation');
const { generateCancelToken } = require('../utils/token');
const {
  todayIsoInAppTimezone,
  getNowInAppTimezone,
  OPEN_HOUR,
  CLOSE_HOUR,
} = require('../utils/dateUtils');

function findOngoingBounds(bookings, nowMinutes) {
  for (const b of bookings) {
    const startM = b.start_hour * 60;
    const endM = b.end_hour * 60;
    if (nowMinutes >= startM && nowMinutes < endM) {
      return { start_hour: b.start_hour, end_hour: b.end_hour };
    }
  }
  return null;
}

function buildSlotsForRoom(bookingsForRoom, ongoingBounds) {
  const occupied = new Set();
  for (const b of bookingsForRoom) {
    for (let h = b.start_hour; h < b.end_hour; h += 1) {
      occupied.add(h);
    }
  }
  const slots = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h += 1) {
    const inOngoing =
      ongoingBounds != null && h >= ongoingBounds.start_hour && h < ongoingBounds.end_hour;
    slots.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      occupied: occupied.has(h),
      ongoing: inOngoing,
    });
  }
  return slots;
}

function getAvailabilityForDate(isoDate) {
  const todayIso = todayIsoInAppTimezone();
  const { minutesSinceMidnight } = getNowInAppTimezone();
  const isToday = isoDate === todayIso;
  const rooms = roomRepository.findAll();
  return rooms.map((room) => {
    const bookings = bookingRepository.findByRoomAndDate(room.id, isoDate);
    const ongoingBounds = isToday ? findOngoingBounds(bookings, minutesSinceMidnight) : null;
    return {
      room,
      ongoingSession: ongoingBounds,
      slots: buildSlotsForRoom(bookings, ongoingBounds),
    };
  });
}

function createBooking(userId, body) {
  const v = validateBookingCreate(body);
  if (!v.ok) {
    return { ok: false, errors: v.errors };
  }
  const { roomId, bookingDate, startHour, duration, endHour, purpose } = v.values;
  const room = roomRepository.findById(roomId);
  if (!room) {
    return { ok: false, errors: { roomId: 'Room not found.' } };
  }

  const overlaps = bookingRepository.countOverlapping(roomId, bookingDate, startHour, endHour);
  if (overlaps > 0) {
    return {
      ok: false,
      errors: { _form: 'That time slot is no longer available for this room.' },
    };
  }

  const cancelToken = generateCancelToken();
  const booking = bookingRepository.create({
    userId,
    roomId,
    bookingDate,
    startHour,
    endHour,
    purpose,
    cancelToken,
  });
  return { ok: true, booking };
}

function listMine(userId) {
  const all = bookingRepository.findByUserId(userId);
  const today = todayIsoInAppTimezone();
  const { minutesSinceMidnight } = getNowInAppTimezone();
  const future = [];
  const past = [];
  for (const b of all) {
    const isPast =
      b.booking_date < today ||
      (b.booking_date === today && b.end_hour * 60 <= minutesSinceMidnight);
    const isOngoing =
      b.booking_date === today &&
      b.start_hour * 60 <= minutesSinceMidnight &&
      b.end_hour * 60 > minutesSinceMidnight;
    if (isPast) {
      past.push(b);
    } else {
      future.push({ ...b, isOngoing: !!isOngoing });
    }
  }
  past.sort((a, b) => {
    if (a.booking_date !== b.booking_date) return b.booking_date.localeCompare(a.booking_date);
    return b.start_hour - a.start_hour;
  });
  future.sort((a, b) => {
    if (a.booking_date !== b.booking_date) return a.booking_date.localeCompare(b.booking_date);
    return a.start_hour - b.start_hour;
  });
  return { future, past };
}

function cancelForUser(bookingId, userId) {
  const id = parseInt(bookingId, 10);
  if (!Number.isFinite(id)) {
    return { ok: false, error: 'Invalid booking.' };
  }
  const booking = bookingRepository.findById(id);
  if (!booking || booking.user_id !== userId) {
    return { ok: false, error: 'Booking not found or you do not have permission to cancel it.' };
  }
  const deleted = bookingRepository.deleteByIdAndUserId(id, userId);
  if (!deleted) {
    return { ok: false, error: 'Could not cancel this booking.' };
  }
  return { ok: true };
}

function getCancelPreview(token) {
  if (!token || typeof token !== 'string' || token.length < 16) {
    return { ok: false, error: 'invalid' };
  }
  const booking = bookingRepository.findByCancelToken(token.trim());
  if (!booking) {
    return { ok: false, error: 'not_found' };
  }
  return { ok: true, booking };
}

function cancelByToken(token) {
  const preview = getCancelPreview(token);
  if (!preview.ok) {
    return preview;
  }
  const deleted = bookingRepository.deleteById(preview.booking.id);
  if (!deleted) {
    return { ok: false, error: 'not_found' };
  }
  return { ok: true, booking: preview.booking };
}

module.exports = {
  getAvailabilityForDate,
  buildSlotsForRoom,
  createBooking,
  listMine,
  cancelForUser,
  getCancelPreview,
  cancelByToken,
  OPEN_HOUR,
  CLOSE_HOUR,
};
