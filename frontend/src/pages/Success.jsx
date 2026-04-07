import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authHeaders } from '../authToken.js';
import { apiUrl } from '../apiBase.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function Success() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/bookings/success/${id}`), {
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(json.error || 'Not found');
          return;
        }
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError('Could not load booking.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
        <Link to="/book" className="btn btn-primary">
          Book a room
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-4 text-muted">Loading…</div>
    );
  }

  const { booking, cancelUrl } = data;

  return (
    <div className="container py-4">
      <div className="alert alert-success">
        <h1 className="h4 alert-heading">Booking confirmed</h1>
        <p className="mb-0">
          Save your private cancellation link below, or cancel anytime from{' '}
          <Link to="/mine" className="alert-link">
            My bookings
          </Link>
          .
        </p>
      </div>

      <div className="card ub-card">
        <div className="card-body">
          <dl className="row mb-0">
            <dt className="col-sm-3">Room</dt>
            <dd className="col-sm-9">{booking.room_name}</dd>
            <dt className="col-sm-3">Date</dt>
            <dd className="col-sm-9">{booking.booking_date}</dd>
            <dt className="col-sm-3">Time</dt>
            <dd className="col-sm-9">
              {pad(booking.start_hour)}:00 – {pad(booking.end_hour)}:00
            </dd>
            {booking.purpose && (
              <>
                <dt className="col-sm-3">Purpose</dt>
                <dd className="col-sm-9">{booking.purpose}</dd>
              </>
            )}
            <dt className="col-sm-3">Cancel link</dt>
            <dd className="col-sm-9">
              <a href={cancelUrl}>{cancelUrl}</a>
              <div className="form-text">
                Anyone with this link can cancel the booking.
              </div>
            </dd>
          </dl>
        </div>
      </div>

      <p className="mt-3">
        <Link to="/book" className="btn btn-primary">
          Book another slot
        </Link>
        <Link to="/mine" className="btn btn-outline-secondary ms-2">
          My bookings
        </Link>
      </p>
    </div>
  );
}
