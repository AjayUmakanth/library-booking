const db = require('../db/sqlite');

function findAll() {
  return db.prepare('SELECT * FROM rooms ORDER BY name ASC').all();
}

function findById(id) {
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
}

module.exports = {
  findAll,
  findById,
};
