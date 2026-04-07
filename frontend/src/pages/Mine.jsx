import { useEffect, useState } from 'react';
import { authHeaders } from '../authToken.js';
import { apiUrl } from '../apiBase.js';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function Mine() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    setError('');
    try {
      const res = await fetch(apiUrl('/api/bookings/mine'), { headers: authHeaders() });
      if (!res.ok) throw new Error('Could not load bookings');
      setData(await res.json());
    } catch {
      setError('Failed to load bookings.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelBooking(id) {
    if (!window.confirm('Cancel this booking?')) return;
    setMsg('');
    const res = await fetch(apiUrl(`/api/bookings/${id}/cancel`), {
      method: 'POST',
      headers: authHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(json.error || 'Could not cancel.');
      return;
    }
    setMsg('Booking cancelled.');
    load();
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-4 text-muted">Loading…</div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4">My bookings</h1>
      {msg && (
        <div
          className={`alert ${msg.includes('Could not') ? 'alert-danger' : 'alert-success'}`}
        >
          {msg}
        </div>
      )}

      <h2 className="h5 mb-3">Upcoming</h2>
      {!data.future?.length ? (
        <p className="text-muted">No upcoming bookings.</p>
      ) : (
        <div className="row g-3 mb-5">
          {data.future.map((b) => (
            <div className="col-md-6 col-lg-4" key={b.id}>
              <div
                className={`card h-100 ub-card border-primary border-opacity-50 ${
                  b.isOngoing ? 'border-warning border-2' : ''
                }`}
              >
                <div className="card-body">
                  <h3 className="h6 card-title d-flex justify-content-between align-items-start gap-2">
                    <span>{b.room_name}</span>
                    {b.isOngoing && (
                      <span className="badge bg-warning text-dark flex-shrink-0">Now</span>
                    )}
                  </h3>
                  <p className="mb-1">
                    <strong>{b.booking_date}</strong>
                  </p>
                  <p className="mb-1">
                    {pad(b.start_hour)}:00 – {pad(b.end_hour)}:00
                  </p>
                  <p className="small text-muted mb-3">
                    {b.purpose || 'No purpose noted'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => cancelBooking(b.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="h5 mb-3">Past</h2>
      {!data.past?.length ? (
        <p className="text-muted">No past bookings.</p>
      ) : (
        <div className="row g-3">
          {data.past.map((b) => (
            <div className="col-md-6 col-lg-4" key={b.id}>
              <div className="card h-100 ub-card opacity-75">
                <div className="card-body">
                  <h3 className="h6 card-title">{b.room_name}</h3>
                  <p className="mb-1">
                    <strong>{b.booking_date}</strong>
                  </p>
                  <p className="mb-0">
                    {pad(b.start_hour)}:00 – {pad(b.end_hour)}:00
                  </p>
                  {b.purpose && (
                    <p className="small text-muted mt-2 mb-0">{b.purpose}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
