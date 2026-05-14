import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, AlignLeft, Check, Save } from 'lucide-react';
import { eventsApi } from '../api.js';
import { useToast } from '../App.jsx';
import EventTypePicker from '../components/EventTypePicker.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import './EventForm.css';

const blank = {
  type: 'study',
  name: '',
  date: '',
  time: '',
  location: '',
  coords: null,
  max: '',
  desc: '',
};

export default function EventForm({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { show } = useToast();

  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mode !== 'edit') return;
    let cancelled = false;
    (async () => {
      try {
        const ev = await eventsApi.get(id);
        if (cancelled) return;
        setForm({
          type: ev.type || 'study',
          name: ev.name || '',
          date: ev.date || '',
          time: ev.time || '',
          location: ev.location || '',
          coords: ev.coords || null,
          max: ev.max ?? '',
          desc: ev.desc || '',
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load event');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mode, id]);

  function update(patch) {
    setForm(prev => ({ ...prev, ...patch }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) return show('Give your event a name');
    if (!form.date)        return show('Pick a date');
    if (!form.time)        return show('Pick a time');
    if (!form.location.trim()) return show('Add a location');

    setSaving(true);
    try {
      const payload = {
        type: form.type,
        name: form.name.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        coords: form.coords,
        max: form.max ? parseInt(form.max, 10) : null,
        desc: form.desc.trim(),
      };
      if (mode === 'edit') {
        await eventsApi.update(id, payload);
        show('Event updated', true);
      } else {
        await eventsApi.create(payload);
        show('Event created', true);
      }
      navigate('/');
    } catch (err) {
      show(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Couldn't load this event</h3>
        <p>{error}</p>
        <Link to="/" className="btn btn-ghost" style={{ marginTop: 16 }}>Back to events</Link>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div>
        <Link to="/" className="back-link">
          <ArrowLeft size={16} strokeWidth={2.2} /> Back to events
        </Link>
        <div className="form-page-header">
          <h1>{mode === 'edit' ? 'Edit Event' : 'Create New Event'}</h1>
        </div>
      </div>

      <EventTypePicker value={form.type} onChange={(type) => update({ type })} />

      <div className="section-card">
        <div className="section-title">Event Details</div>

        <div className="field field-full">
          <label>Event Name <span className="req">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g., CS 101 Study Group"
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label><Calendar size={16} strokeWidth={2} style={{ color: 'var(--violet-600)' }} /> Date <span className="req">*</span></label>
            <input type="date" value={form.date} onChange={(e) => update({ date: e.target.value })} />
          </div>
          <div className="field">
            <label><Clock size={16} strokeWidth={2} style={{ color: 'var(--violet-600)' }} /> Time <span className="req">*</span></label>
            <input type="time" value={form.time} onChange={(e) => update({ time: e.target.value })} />
          </div>
        </div>

        <div className="field field-full">
          <label><MapPin size={16} strokeWidth={2} style={{ color: '#ec4899' }} /> Location <span className="req">*</span></label>
          <LocationPicker
            value={form.location}
            coords={form.coords}
            onChange={(location) => update({ location })}
            onCoordsChange={(coords) => update({ coords })}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label><Users size={16} strokeWidth={2} style={{ color: '#10b981' }} /> Max Attendees <span className="opt">(optional)</span></label>
            <input
              type="number"
              value={form.max}
              onChange={(e) => update({ max: e.target.value })}
              placeholder="Leave empty for unlimited"
              min="1"
            />
          </div>
          <div className="field">
            <label><AlignLeft size={16} strokeWidth={2} style={{ color: 'var(--violet-600)' }} /> Description <span className="opt">(optional)</span></label>
            <input
              type="text"
              value={form.desc}
              onChange={(e) => update({ desc: e.target.value })}
              placeholder="Add any extra details…"
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Link to="/" className="btn btn-ghost">Cancel</Link>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          {mode === 'edit' ? <Save size={16} strokeWidth={2.5} /> : <Check size={16} strokeWidth={2.5} />}
          {saving ? 'Saving…' : (mode === 'edit' ? 'Save Changes' : 'Create Event')}
        </button>
      </div>
    </div>
  );
}
