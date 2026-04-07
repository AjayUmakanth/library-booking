const db = require('../db/sqlite');

/**
 * Intervals are [start_hour, end_hour). Conflict if newStart < existingEnd AND newEnd > existingStart.
 */
function countOverlapping(roomId, bookingDate, startHour, endHour, excludeBookingId = null) {
  let sql = `
    SELECT COUNT(*) AS c FROM bookings
    WHERE room_id = ?
      AND booking_date = ?
      AND start_hour < ?
      AND end_hour > ?
  `;
  const params = [roomId, bookingDate, endHour, startHour];
  if (excludeBookingId != null) {
    sql += ' AND id != ?';
    params.push(excludeBookingId);
  }
  return db.prepare(sql).get(...params).c;
}

function findByRoomAndDate(roomId, bookingDate) {
  return db
    .prepare(
      `SELECT b.*, u.name AS user_name, u.email AS user_email
       FROM bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.room_id = ? AND b.booking_date = ?
       ORDER BY b.start_hour ASC`
    )
    .all(roomId, bookingDate);
}

function create({
  userId,
  roomId,
  bookingDate,
  startHour,
  endHour,
  purpose,
  cancelToken,
}) {
  const info = db
    .prepare(
      `INSERT INTO bookings (user_id, room_id, booking_date, start_hour, end_hour, purpose, cancel_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(userId, roomId, bookingDate, startHour, endHour, purpose, cancelToken);
  return findById(info.lastInsertRowid);
}

function findById(id) {
  return db
    .prepare(
      `SELECT b.*, r.name AS room_name
       FROM bookings b
       JOIN rooms r ON r.id = b.room_id
       WHERE b.id = ?`
    )
    .get(id);
}

function findByCancelToken(token) {
  return db
    .prepare(
      `SELECT b.*, r.name AS room_name, u.email AS user_email
       FROM bookings b
       JOIN rooms r ON r.id = b.room_id
       JOIN users u ON u.id = b.user_id
       WHERE b.cancel_token = ?`
    )
    .get(token);
}

function findByUserId(userId) {
  return db
    .prepare(
      `SELECT b.*, r.name AS room_name
       FROM bookings b
       JOIN rooms r ON r.id = b.room_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date ASC, b.start_hour ASC`
    )
    .all(userId);
}

function deleteById(id) {
  const info = db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = {
  countOverlapping,
  findByRoomAndDate,
  create,
  findById,
  findByCancelToken,
  findByUserId,
  deleteById,
};
