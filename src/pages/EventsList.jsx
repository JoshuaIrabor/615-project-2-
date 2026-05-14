import { useEffect, useState } from 'react';
import { eventsApi } from '../api.js';
import { useToast } from '../App.jsx';
import EventCard from '../components/EventCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import './EventsList.css';

export default function EventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { show } = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await eventsApi.list();
      setEvents(data);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    try {
      await eventsApi.remove(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      show('Event deleted', true);
    } catch (err) {
      show(err.message || 'Failed to delete');
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Loading events…
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Couldn't load events</h3>
        <p>{error}</p>
        <p style={{ marginTop: 8, fontSize: 13 }}>Make sure the backend is running on port 3001.</p>
      </div>
    );
  }

  if (events.length === 0) return <EmptyState />;

  return (
    <>
      <div className="events-header">
        <h2>Your <span>upcoming</span> events</h2>
        <div className="events-count">
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </div>
      </div>
      <div className="events-grid">
        {events.map((ev, i) => (
          <EventCard key={ev.id} event={ev} index={i} onDelete={handleDelete} />
        ))}
      </div>
    </>
  );
}
