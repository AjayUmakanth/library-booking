const authService = require('../services/authService');
const { signAccessToken } = require('../utils/jwt');

async function postRegister(req, res) {
  const result = await authService.register(req.body);
  if (!result.ok) {
    return res.status(400).json({ errors: result.errors, values: result.values });
  }
  const token = signAccessToken(result.user.id);
  return res.status(201).json({ user: result.user, token });
}

async function postLogin(req, res) {
  const result = await authService.login(req.body);
  if (!result.ok) {
    const status = result.errors._form ? 401 : 400;
    return res.status(status).json({ errors: result.errors, values: result.values });
  }
  const token = signAccessToken(result.user.id);
  return res.json({ user: result.user, token });
}

function postLogout(req, res) {
  return res.status(204).end();
}

function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ user: req.user });
}

module.exports = {
  postRegister,
  postLogin,
  postLogout,
  getMe,
};
