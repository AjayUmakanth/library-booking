import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authHeaders, jsonAuthHeaders } from '../authToken.js';
import { apiUrl } from '../apiBase.js';

/** True if the room has at least one valid 1–6h window within [minStartHour, closeHour). */
function roomHasBookableSlot(row, minStartHour, closeHour) {
  const occupied = new Set();
  for (const slot of row.slots) {
    if (slot.occupied) occupied.add(slot.hour);
  }
  for (let h = minStartHour; h < closeHour; h += 1) {
    for (let d = 1; d <= 6; d += 1) {
      const end = h + d;
      if (end > closeHour) break;
      let ok = true;
      for (let t = h; t < end; t += 1) {
        if (occupied.has(t)) {
          ok = false;
          break;
        }
      }
      if (ok) return true;
    }
  }
  return false;
}

/** Start hours (ascending) that fit at least one duration for this room. */
function selectableStartHoursForRoom(row, minStartHour, closeHour) {
  const occupied = new Set();
  for (const slot of row.slots) {
    if (slot.occupied) occupied.add(slot.hour);
  }
  const out = [];
  for (let h = minStartHour; h < closeHour; h += 1) {
    for (let d = 1; d <= 6; d += 1) {
      const end = h + d;
      if (end > closeHour) break;
      let ok = true;
      for (let t = h; t < end; t += 1) {
        if (occupied.has(t)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        out.push(h);
        break;
      }
    }
  }
  return out;
}

/** Durations (hours) that fit at startHour for this room. */
function validDurationsForRoom(row, startHour, closeHour) {
  const occupied = new Set();
  for (const slot of row.slots) {
    if (slot.occupied) occupied.add(slot.hour);
  }
  const out = [];
  for (let d = 1; d <= 6; d += 1) {
    const end = startHour + d;
    if (end > closeHour) break;
    let ok = true;
    for (let t = startHour; t < end; t += 1) {
      if (occupied.has(t)) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(d);
  }
  return out;
}

export default function Book() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const dateParam = searchParams.get('date') || '';

  const [roomId, setRoomId] = useState('');
  const [startHour, setStartHour] = useState('7');
  const [duration, setDuration] = useState('1');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    let cancelled = false;
    const q = dateParam ? `?date=${encodeURIComponent(dateParam)}` : '';
    (async () => {
      setLoadError('');
      try {
        const res = await fetch(apiUrl(`/api/bookings/available${q}`), {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Could not load availability');
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          if (!dateParam) {
            setSearchParams({ date: json.selectedDate }, { replace: true });
          }
        }
      } catch {
        if (!cancelled) setLoadError('Failed to load availability.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateParam, setSearchParams]);

  useEffect(() => {
    if (!data) return;
    const oh = data.openHour;
    const ch = data.closeHour;
    let minH = oh;
    if (data.isSelectedDateToday && data.minStartHourForToday != null) {
      minH = Math.max(oh, data.minStartHourForToday);
    }

    if (roomId) {
      const row = data.availability.find((r) => String(r.room.id) === String(roomId));
      if (!row || !roomHasBookableSlot(row, minH, ch)) {
        setRoomId('');
        return;
      }
      const allowedStarts = selectableStartHoursForRoom(row, minH, ch);
      const curH = Number(startHour);
      if (allowedStarts.length && !allowedStarts.includes(curH)) {
        setStartHour(String(allowedStarts[0]));
      }
    } else {
      const globalAllowed = [];
      for (let h = oh; h < ch; h += 1) {
        if (h >= minH) globalAllowed.push(h);
      }
      if (globalAllowed.length && !globalAllowed.includes(Number(startHour))) {
        setStartHour(String(globalAllowed[0]));
      }
    }
  }, [
    data,
    data?.selectedDate,
    data?.openHour,
    data?.closeHour,
    data?.isSelectedDateToday,
    data?.minStartHourForToday,
    roomId,
    startHour,
  ]);

  useEffect(() => {
    if (!data || !roomId) return;
    const row = data.availability.find((r) => String(r.room.id) === String(roomId));
    if (!row) return;
    const durs = validDurationsForRoom(row, Number(startHour), data.closeHour);
    const cur = Number(duration);
    if (durs.length && !durs.includes(cur)) {
      setDuration(String(durs[0]));
    }
  }, [data, roomId, startHour, duration]);

  function openBookingModal() {
    setSubmitError(null);
  }

  async function changeDate(iso) {
    setSearchParams({ date: iso }, { replace: false });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!data) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers: jsonAuthHeaders(),
        body: JSON.stringify({
          roomId: Number(roomId),
          bookingDate: data.selectedDate,
          startHour: Number(startHour),
          duration: Number(duration),
          purpose,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(json.errors || { _form: 'Booking failed.' });
        setSubmitting(false);
        return;
      }
      try {
        const el = document.getElementById('bookingModal');
        window.bootstrap?.Modal?.getInstance(el)?.hide();
      } catch {
        /* ignore */
      }
      navigate(`/success/${json.booking.id}`);
    } catch {
      setSubmitError({ _form: 'Network error.' });
    }
    setSubmitting(false);
  }

  if (loadError) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{loadError}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-4 text-muted">Loading availability…</div>
    );
  }

  const oh = data.openHour;
  const ch = data.closeHour;

  let minH = oh;
  if (data.isSelectedDateToday && data.minStartHourForToday != null) {
    minH = Math.max(oh, data.minStartHourForToday);
  }

  const anyRoomBookable = data.availability.some((row) =>
    roomHasBookableSlot(row, minH, ch)
  );
  const noSlotsLeftToday = data.isSelectedDateToday && !anyRoomBookable;

  const selectedRow = roomId
    ? data.availability.find((r) => String(r.room.id) === String(roomId))
    : null;
  const selectableStartHours = selectedRow
    ? selectableStartHoursForRoom(selectedRow, minH, ch)
    : [];
  const validDurations =
    selectedRow && selectableStartHours.includes(Number(startHour))
      ? validDurationsForRoom(selectedRow, Number(startHour), ch)
      : [];

  const formCanSubmit =
    Boolean(roomId) &&
    selectableStartHours.length > 0 &&
    validDurations.length > 0 &&
    validDurations.includes(Number(duration));

  const formErr = submitError || {};

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
        <div>
          <h1 className="h3 mb-1">Book a room</h1>
          <p className="text-muted small mb-0">
            Times use <strong>{data.timeZone}</strong>. Opening hours:{' '}
            {String(oh).padStart(2, '0')}:00–{String(ch).padStart(2, '0')}:00. Full hours only;
            1–6 hours; up to 7 days ahead.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          data-bs-toggle="modal"
          data-bs-target="#bookingModal"
          disabled={!anyRoomBookable}
          onClick={openBookingModal}
        >
          Create booking
        </button>
      </div>

      {data.dateInvalid && (
        <div className="alert alert-warning">
          Invalid date; showing server default instead.
        </div>
      )}

      {noSlotsLeftToday && (
        <div className="alert alert-warning">
          No start times left today in {data.timeZone}. Pick tomorrow or another date.
        </div>
      )}

      <div className="row g-2 align-items-end mb-4">
        <div className="col-auto">
          <label htmlFor="pickDate" className="form-label mb-0">
            Date
          </label>
          <input
            id="pickDate"
            type="date"
            className="form-control"
            value={data.selectedDate}
            min={data.minBookDate}
            max={data.maxBookDate}
            onChange={(e) => changeDate(e.target.value)}
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        {data.availability.map((row) => (
          <div className="col-12" key={row.room.id}>
            <div className="card ub-card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <strong>{row.room.name}</strong>
                {row.room.capacity != null && (
                  <span className="badge bg-secondary">
                    Capacity {row.room.capacity}
                  </span>
                )}
              </div>
              <div className="card-body">
                {row.ongoingSession && (
                  <div className="alert alert-warning py-2 small mb-3">
                    <strong>In progress now</strong> ({data.timeZone}):{' '}
                    {String(row.ongoingSession.start_hour).padStart(2, '0')}:00–
                    {String(row.ongoingSession.end_hour).padStart(2, '0')}:00
                  </div>
                )}
                {row.room.description && (
                  <p className="small text-muted mb-3">{row.room.description}</p>
                )}
                <div className="d-flex flex-wrap gap-1">
                  {row.slots.map((slot) => {
                    let cls = 'bg-primary';
                    let title = 'Available';
                    if (slot.ongoing) {
                      cls = 'bg-warning text-dark';
                      title = 'Ongoing session';
                    } else if (slot.occupied) {
                      cls = 'bg-danger';
                      title = 'Occupied';
                    }
                    return (
                      <span
                        key={slot.hour}
                        className={`badge rounded-pill ${cls}`}
                        title={title}
                      >
                        {slot.label}
                      </span>
                    );
                  })}
                </div>
                <div className="small mt-2">
                  <span className="badge bg-primary">&nbsp;</span> Available &nbsp;
                  <span className="badge bg-danger">&nbsp;</span> Occupied &nbsp;
                  <span className="badge bg-warning text-dark">&nbsp;</span> Ongoing
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="modal fade"
        id="bookingModal"
        tabIndex="-1"
        aria-labelledby="bookingModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="bookingModalLabel">
                Create booking
              </h2>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <form id="bookingForm" onSubmit={handleSubmit}>
              <div className="modal-body">
                {data.isSelectedDateToday && (
                  <p className="small text-muted">
                    For today ({data.timeZone}), only hours from{' '}
                    {String(minH).padStart(2, '0')}:00 onward can be chosen.
                  </p>
                )}
                {formErr._form && (
                  <div className="alert alert-danger">{formErr._form}</div>
                )}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" htmlFor="modalRoomId">
                      Room
                    </label>
                    <select
                      id="modalRoomId"
                      className={`form-select ${formErr.roomId ? 'is-invalid' : ''}`}
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      required
                    >
                      <option value="">Choose…</option>
                      {data.availability.map((row) => {
                        const bookable = roomHasBookableSlot(row, minH, ch);
                        return (
                          <option
                            key={row.room.id}
                            value={row.room.id}
                            disabled={!bookable}
                          >
                            {row.room.name}
                            {!bookable ? ' (fully booked)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {formErr.roomId && (
                      <div className="invalid-feedback d-block">{formErr.roomId}</div>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="modalBookingDate">
                      Date
                    </label>
                    <input
                      id="modalBookingDate"
                      type="text"
                      className="form-control"
                      value={data.selectedDate}
                      disabled
                      readOnly
                    />
                    <div className="form-text">Change the date with the picker on the page.</div>
                    {formErr.bookingDate && (
                      <div className="text-danger small">{formErr.bookingDate}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="modalStartHour">
                      Start hour
                    </label>
                    <select
                      id="modalStartHour"
                      className={`form-select ${formErr.startHour ? 'is-invalid' : ''}`}
                      value={!roomId ? '' : startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      required
                      disabled={!roomId || selectableStartHours.length === 0}
                    >
                      {!roomId && <option value="">Select a room first</option>}
                      {roomId &&
                        selectableStartHours.map((h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, '0')}:00
                          </option>
                        ))}
                    </select>
                    {roomId && selectableStartHours.length === 0 && (
                      <div className="form-text text-warning">
                        No free slots left for this room on this date.
                      </div>
                    )}
                    {formErr.startHour && (
                      <div className="invalid-feedback d-block">
                        {formErr.startHour}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="modalDuration">
                      Duration (hours)
                    </label>
                    <select
                      id="modalDuration"
                      className={`form-select ${formErr.duration ? 'is-invalid' : ''}`}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                      disabled={
                        !roomId ||
                        !selectableStartHours.includes(Number(startHour))
                      }
                    >
                      {[1, 2, 3, 4, 5, 6].map((d) => (
                        <option
                          key={d}
                          value={d}
                          disabled={
                            !validDurations.includes(d)
                          }
                        >
                          {d}
                          {!validDurations.includes(d) ? ' (unavailable)' : ''}
                        </option>
                      ))}
                    </select>
                    {formErr.duration && (
                      <div className="invalid-feedback d-block">
                        {formErr.duration}
                      </div>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label" htmlFor="modalPurpose">
                      Purpose (optional)
                    </label>
                    <input
                      id="modalPurpose"
                      type="text"
                      className="form-control"
                      maxLength={500}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. Team study session"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !formCanSubmit}
                >
                  {submitting ? 'Submitting…' : 'Submit booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
