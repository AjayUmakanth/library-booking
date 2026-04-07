import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthCardBranding from '../components/AuthCardBranding.jsx';

export default function Register() {
  const { user, userLoading, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  if (userLoading) {
    return (
      <div className="container py-3 text-center text-muted align-self-center w-100">
        Loading…
      </div>
    );
  }
  if (user) return <Navigate to="/book" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    try {
      await register({
        name,
        email,
        password,
        confirmPassword,
      });
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setErrors({ _form: 'Registration failed.' });
    }
  }

  return (
    <div className="container py-2 w-100">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card ub-card">
            <div className="card-body p-4">
              <AuthCardBranding />
              {errors._form && (
                <div className="alert alert-danger">{errors._form}</div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                  <div className="form-text">At least 8 characters.</div>
                </div>
                <div className="mb-4">
                  <label htmlFor="confirm" className="form-label">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Register
                </button>
              </form>
              <p className="mt-3 mb-0 text-center small text-muted">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
