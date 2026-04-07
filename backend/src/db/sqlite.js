const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath =
  process.env.SQLITE_PATH || path.join(__dirname, '..', '..', 'data', 'app.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

/** Drop legacy room columns (description, capacity, created_at) while preserving ids and bookings. */
function migrateRoomsIfLegacy() {
  const exists = db
    .prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name='rooms'`)
    .get();
  if (!exists) return;
  const cols = db.prepare('PRAGMA table_info(rooms)').all();
  const names = new Set(cols.map((c) => c.name));
  const legacy = ['description', 'capacity', 'created_at'].some((n) => names.has(n));
  if (!legacy) return;

  db.pragma('foreign_keys = OFF');
  db.exec(`
    CREATE TABLE rooms__migrated (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
    INSERT INTO rooms__migrated (id, name) SELECT id, name FROM rooms;
    DROP TABLE rooms;
    ALTER TABLE rooms__migrated RENAME TO rooms;
  `);
  db.pragma('foreign_keys = ON');
}

migrateRoomsIfLegacy();

module.exports = db;
