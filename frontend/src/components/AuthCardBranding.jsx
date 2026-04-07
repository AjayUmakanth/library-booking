import { Link } from 'react-router-dom';
import { UB_IMAGEMARK_URL } from '../ubAssets.js';

export default function AuthCardBranding() {
  return (
    <div className="auth-card-branding text-center mb-4">
      <Link to="/" className="d-inline-block text-decoration-none mb-2" title="Home">
        <img
          src={UB_IMAGEMARK_URL}
          alt="Universität Paderborn — Bildmarke"
          className="auth-card-logo"
          decoding="async"
        />
      </Link>
      <div className="ub-brand-title d-block">Universitätsbibliothek</div>
      <div className="small text-uppercase text-upb-muted letter-spacing-tight">Room booking</div>
    </div>
  );
}
