const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

require('./db/sqlite');

const attachCurrentUser = require('./middleware/attachCurrentUser');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const cancelRoutes = require('./routes/cancelRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

/** Dev-friendly defaults; override or extend with comma-separated FRONTEND_ORIGIN in .env */
const defaultDevOrigins = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function buildAllowedOrigins() {
  const fromEnv = process.env.FRONTEND_ORIGIN;
  const set = new Set();
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    for (const o of defaultDevOrigins) set.add(o);
  }
  if (fromEnv) {
    for (const o of fromEnv.split(',')) {
      const t = o.trim();
      if (t) set.add(t);
    }
  }
  if (isProd && set.size === 0) {
    console.warn('FRONTEND_ORIGIN is not set; browser CORS requests will be rejected.');
  }
  return set;
}

const allowedOrigins = buildAllowedOrigins();
const primaryFrontendOrigin = process.env.FRONTEND_ORIGIN?.split(',')?.[0]?.trim()
  || 'http://localhost:3001';

if (!process.env.JWT_SECRET) {
  console.warn(
    'Warning: JWT_SECRET is not set. Using a development default. Set JWT_SECRET in .env for production.'
  );
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      console.warn(`CORS blocked Origin: ${origin} (allowed: ${[...allowedOrigins].join(', ')})`);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(attachCurrentUser);

app.get('/', (req, res) => {
  res.json({
    service: 'library-room-booking-api',
    message: 'This URL is the JSON API only. Open the web app in the browser instead.',
    health: '/api/health',
    frontend: primaryFrontendOrigin,
    corsOrigins: [...allowedOrigins],
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/cancel', cancelRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
