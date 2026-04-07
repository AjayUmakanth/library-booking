require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const readline = require('readline');

const db = require('./sqlite');

function parseNumberOfRooms() {
  const raw = process.argv[2];
  if (raw === undefined || raw === '') {
    console.error('Usage: npm run seed -- <numberOfRooms>');
    console.error('Example: npm run seed -- 5   (creates "Room 1" … "Room 5")');
    process.exit(1);
  }
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    console.error('numberOfRooms must be a positive integer.');
    process.exit(1);
  }
  return n;
}

function askLine(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirmProceed(numberOfRooms) {
  const line = await askLine(
    `Bookings and rooms will be DELETED, then ${numberOfRooms} new room(s) (Room 1 … Room ${numberOfRooms}) will be inserted.\n` +
      'Type y and press Enter to continue, or anything else to abort: '
  );
  return line === 'y';
}

async function confirmDeleteUsers() {
  const line = await askLine(
    'Also delete ALL user accounts? Type y for yes, or anything else to keep existing users: '
  );
  return line === 'y';
}

function clearSqliteSequences(tableNames) {
  if (
    !db.prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'`).get()
  ) {
    return;
  }
  const del = db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`);
  for (const name of tableNames) {
    del.run(name);
  }
}

async function seed() {
  const numberOfRooms = parseNumberOfRooms();

  const proceed = await confirmProceed(numberOfRooms);
  if (!proceed) {
    console.log('Aborted. No changes were made.');
    process.exit(0);
  }

  const deleteUsers = await confirmDeleteUsers();

  const txn = db.transaction(() => {
    const bookingsN = db.prepare('DELETE FROM bookings').run().changes;
    const roomsN = db.prepare('DELETE FROM rooms').run().changes;
    let usersN = 0;
    if (deleteUsers) {
      usersN = db.prepare('DELETE FROM users').run().changes;
    }

    const sequences = ['bookings', 'rooms'];
    if (deleteUsers) sequences.push('users');
    clearSqliteSequences(sequences);

    const insertRoom = db.prepare('INSERT INTO rooms (name) VALUES (?)');
    for (let i = 1; i <= numberOfRooms; i += 1) {
      insertRoom.run(`Room ${i}`);
    }

    return { bookingsN, roomsN, usersN, deleteUsers };
  });

  const { bookingsN, roomsN, usersN, deleteUsers: didDeleteUsers } = txn();
  console.log(
    `Removed ${bookingsN} booking(s), ${roomsN} room(s). Inserted ${numberOfRooms} new room(s).`
  );
  if (didDeleteUsers) {
    console.log(`Removed ${usersN} user(s).`);
  } else {
    console.log('User accounts were left unchanged.');
  }
}

seed()
  .then(() => {
    console.log('Seed complete.');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
