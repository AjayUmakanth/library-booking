const db = require('../db/sqlite');

function findByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
}

function findById(id) {
  return db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(id);
}

function create({ name, email, passwordHash }) {
  const info = db
    .prepare(
      `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`
    )
    .run(name, email, passwordHash);
  return findById(info.lastInsertRowid);
}

function getPasswordHashById(id) {
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id);
  return row ? row.password_hash : null;
}

module.exports = {
  findByEmail,
  findById,
  create,
  getPasswordHashById,
};
