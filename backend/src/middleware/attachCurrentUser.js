const userRepository = require('../repositories/userRepository');
const { verifyAccessToken } = require('../utils/jwt');

function attachCurrentUser(req, res, next) {
  req.user = null;
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return next();
  }
  const raw = auth.slice(7).trim();
  if (!raw) {
    return next();
  }
  try {
    const payload = verifyAccessToken(raw);
    const id = parseInt(payload.sub, 10);
    if (!Number.isFinite(id)) {
      return next();
    }
    req.user = userRepository.findById(id) || null;
  } catch {
    req.user = null;
  }
  next();
}

module.exports = attachCurrentUser;
