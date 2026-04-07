require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const db = require('./sqlite');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

function seed() {
  const roomCount = db.prepare('SELECT COUNT(*) AS c FROM rooms').get().c;
  if (roomCount === 0) {
    const insert = db.prepare(
      `INSERT INTO rooms (name, description, capacity) VALUES (?, ?, ?)`
    );
    insert.run('Study Room A', 'Quiet individual study, 2 desks', 2);
    insert.run('Collaboration Lab', 'Whiteboards and large table', 8);
    insert.run('Seminar Room', 'Projector and seating for 12', 12);
    console.log('Seeded 3 rooms.');
  } else {
    console.log('Rooms already exist; skipping room seed.');
  }

  const demoEmail = 'demo@example.com';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail);
  if (!existing) {
    const hash = bcrypt.hashSync('Demo123!', SALT_ROUNDS);
    db.prepare(
      `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`
    ).run('Demo User', demoEmail, hash);
    console.log(`Seeded demo user: ${demoEmail} / Demo123!`);
  } else {
    console.log('Demo user already exists; skipping user seed.');
  }
}

seed();
console.log('Seed complete.');
