const crypto = require('crypto');

function generateCancelToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { generateCancelToken };
