import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { UB_IMAGEMARK_URL } from '../ubAssets.js';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-light ub-header-main">
        <div className="container">
          <div className="d-flex align-items-center flex-wrap gap-2 me-2">
            <a
              className="ub-imagemark-link"
              href="https://www.uni-paderborn.de/"
              target="_blank"
              rel="noopener noreferrer"
              title="Universität Paderborn — Zur Startseite"
            >
              <img src={UB_IMAGEMARK_URL} alt="UPB Bildmarke" decoding="async" />
            </a>
            <Link className="navbar-brand d-flex align-items-center py-1 mb-0" to="/">
              <div className="d-flex flex-column lh-sm text-start">
                <span className="ub-brand-title">Universitätsbibliothek</span>
                <span className="ub-brand-sub">Room booking</span>
              </div>
            </Link>
          </div>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            {user ? (
              <>
                <ul className="navbar-nav me-auto">
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/book">
                      Book a room
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/mine">
                      My bookings
                    </NavLink>
                  </li>
                </ul>
                <ul className="navbar-nav ms-auto align-items-lg-center">
                  <li className="nav-item me-lg-3">
                    <span className="navbar-text">{user.name}</span>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => logout()}
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              </>
            ) : (
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">
                    Sign in
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/register">
                    Register
                  </NavLink>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
