import { useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import { UB_LOGO_NEGATIV_DE_URL } from '../ubAssets.js';

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const authOnlyPage = pathname === '/login' || pathname === '/register';

  return (
    <>
      {!authOnlyPage && <Navbar />}
      <main className={authOnlyPage ? 'ub-main-auth' : undefined}>{children}</main>
      <footer className="ub-footer">
        <div className="container ub-footer-inner">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 gap-md-3">
            <div className="d-flex align-items-center gap-2 gap-md-3">
              <a
                href="https://www.uni-paderborn.de/"
                className="d-inline-block lh-0 flex-shrink-0"
                target="_blank"
                rel="noopener noreferrer"
                title="Universität Paderborn"
              >
                <img
                  className="ub-footer-logo img-fluid"
                  src={UB_LOGO_NEGATIV_DE_URL}
                  alt="Universität Paderborn"
                  width={393}
                  height={123}
                  decoding="async"
                />
              </a>
              <div>
                <div className="fw-semibold small mb-0">Universitätsbibliothek</div>
                <a href="https://www.ub.uni-paderborn.de/" className="small">
                  ub.uni-paderborn.de
                </a>
              </div>
            </div>
            <address className="ub-footer-address small mb-0 text-md-end">
              Warburger Str. 100
              <br />
              33098 Paderborn
            </address>
          </div>
        </div>
      </footer>
    </>
  );
}
