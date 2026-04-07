const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, secret, { expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, secret);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
