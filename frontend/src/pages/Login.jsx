import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthCardBranding from '../components/AuthCardBranding.jsx';

export default function Login() {
  const { user, userLoading, login } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/book';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  if (userLoading) {
    return (
      <div className="container py-3 text-center text-muted align-self-center w-100">
        Loading…
      </div>
    );
  }
  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});
    try {
      await login({ email, password });
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors);
        if (err.errors._form) setFormError(err.errors._form);
      } else {
        setFormError('Could not sign in.');
      }
    }
  }

  return (
    <div className="container py-2 w-100">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card ub-card">
            <div className="card-body p-4">
              <AuthCardBranding />
              {formError && (
                <div className="alert alert-danger">{formError}</div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                  {fieldErrors.email && (
                    <div className="invalid-feedback">{fieldErrors.email}</div>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  {fieldErrors.password && (
                    <div className="invalid-feedback">
                      {fieldErrors.password}
                    </div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Sign in
                </button>
              </form>
              <p className="mt-3 mb-0 text-center small text-muted">
                New here? <Link to="/register">Create an account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
