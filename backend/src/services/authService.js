const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const { validateRegisterBody, validateLoginBody } = require('../utils/validation');

const SALT_ROUNDS = 10;

async function register(body) {
  const v = validateRegisterBody(body);
  if (!v.ok) {
    return { ok: false, errors: v.errors, values: { name: body.name, email: body.email } };
  }
  const { name, email, password } = v.values;
  const existing = userRepository.findByEmail(email);
  if (existing) {
    return {
      ok: false,
      errors: { email: 'An account with this email already exists.' },
      values: { name, email },
    };
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = userRepository.create({ name, email, passwordHash });
  return { ok: true, user };
}

async function login(body) {
  const v = validateLoginBody(body);
  if (!v.ok) {
    return { ok: false, errors: v.errors, values: { email: v.values.email } };
  }
  const { email, password } = v.values;
  const user = userRepository.findByEmail(email);
  if (!user) {
    return { ok: false, errors: { _form: 'Invalid email or password.' }, values: { email } };
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return { ok: false, errors: { _form: 'Invalid email or password.' }, values: { email } };
  }
  const publicUser = userRepository.findById(user.id);
  return { ok: true, user: publicUser };
}

module.exports = {
  register,
  login,
};
