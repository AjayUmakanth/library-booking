import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiUrl, frontendOriginHeader } from '../apiBase.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function Cancel() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [booking, setBooking] = useState(undefined);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [done, setDone] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/cancel/${encodeURIComponent(token)}`), {
          headers: { ...frontendOriginHeader() },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setLoadError(json.error || 'Invalid link.');
            setBooking(null);
          }
          return;
        }
        if (!cancelled) setBooking(json.booking);
      } catch {
        if (!cancelled) {
          setLoadError('Could not load this link.');
          setBooking(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!done) return undefined;
    const t = window.setTimeout(() => {
      navigate('/', { replace: true });
    }, 5000);
    return () => window.clearTimeout(t);
  }, [done, navigate]);

  async function confirmCancel() {
    setActionError('');
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/cancel/${encodeURIComponent(token)}`), {
        method: 'POST',
        headers: { ...frontendOriginHeader() },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(json.error || 'Could not cancel.');
        setSubmitting(false);
        return;
      }
      setDone(json.booking);
    } catch {
      setActionError('Network error.');
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="container py-4">
        <div className="alert alert-info">
          <h1 className="h4 alert-heading">Booking cancelled</h1>
          <p className="mb-2">
            The reservation for <strong>{done.room_name}</strong> on{' '}
            <strong>{done.booking_date}</strong> has been cancelled.
          </p>
          <p className="mb-0 small text-muted">Redirecting to the home page in 5 seconds…</p>
        </div>
      </div>
    );
  }

  if (booking === undefined) {
    return (
      <div className="container py-4 text-muted">Loading…</div>
    );
  }

  if (booking === null) {
    return (
      <div className="container py-5 text-center">
        <h1 className="h4">Link not valid</h1>
        <p className="text-muted">{loadError}</p>
        <Link to="/" className="btn btn-primary">
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-3">Cancel booking</h1>
      {actionError && (
        <div className="alert alert-danger">{actionError}</div>
      )}
      <div className="card ub-card">
        <div className="card-body">
          <p>Are you sure you want to cancel this reservation?</p>
          <ul className="mb-4">
            <li>
              <strong>Room:</strong> {booking.room_name}
            </li>
            <li>
              <strong>Date:</strong> {booking.booking_date}
            </li>
            <li>
              <strong>Time:</strong> {pad(booking.start_hour)}:00 –{' '}
              {pad(booking.end_hour)}:00
            </li>
            {booking.purpose && (
              <li>
                <strong>Purpose:</strong> {booking.purpose}
              </li>
            )}
          </ul>
          <button
            type="button"
            className="btn btn-danger"
            onClick={confirmCancel}
            disabled={submitting}
          >
            {submitting ? 'Working…' : 'Yes, cancel booking'}
          </button>
          <Link to="/" className="btn btn-outline-secondary ms-2">
            Go back
          </Link>
        </div>
      </div>
    </div>
  );
}
