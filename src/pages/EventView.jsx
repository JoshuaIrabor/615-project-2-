import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Calendar, MapPin, Users, AlignLeft, ArrowLeft } from 'lucide-react';
import { eventsApi, TYPE_META, formatEventDate } from '../api.js';
import './EventView.css';

const purpleIcon = L.divIcon({
  className: '',
  html: '<div class="custom-marker"></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function InvalidateSizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => { clearTimeout(t); ro.disconnect(); };
  }, [map]);
  return null;
}

export default function EventView() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await eventsApi.get(id);
        if (!cancelled) setEvent(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load event');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        Loading event…
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="error-state">
        <h3>Couldn't find this event</h3>
        <p>{error || 'It may have been deleted or the link is incorrect.'}</p>
        <Link to="/" className="btn btn-ghost" style={{ marginTop: 16 }}>Go to Campus Events</Link>
      </div>
    );
  }

  const meta = TYPE_META[event.type] || TYPE_META.casual;

  return (
    <div className="event-view">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} strokeWidth={2.2} /> Campus Events
      </Link>

      {/* Hero */}
      <div className="view-hero">
        <div className="view-hero-top">
          <div className="view-emoji">{meta.emoji}</div>
          <span className="event-type-badge">{meta.label}</span>
        </div>
        <h1>{event.name}</h1>
      </div>

      {/* Details */}
      <div className="view-details">
        <div className="view-detail-row">
          <div className="view-detail-icon"><Calendar size={20} strokeWidth={2} /></div>
          <div>
            <div className="view-detail-label">Date & Time</div>
            <div className="view-detail-value">{formatEventDate(event.date, event.time)}</div>
          </div>
        </div>

        <div className="view-detail-row">
          <div className="view-detail-icon" style={{ color: '#ec4899' }}><MapPin size={20} strokeWidth={2} /></div>
          <div>
            <div className="view-detail-label">Location</div>
            <div className="view-detail-value">{event.location}</div>
          </div>
        </div>

        {event.max && (
          <div className="view-detail-row">
            <div className="view-detail-icon" style={{ color: '#10b981' }}><Users size={20} strokeWidth={2} /></div>
            <div>
              <div className="view-detail-label">Max Attendees</div>
              <div className="view-detail-value">{event.max} people</div>
            </div>
          </div>
        )}

        {event.desc && (
          <div className="view-detail-row">
            <div className="view-detail-icon"><AlignLeft size={20} strokeWidth={2} /></div>
            <div>
              <div className="view-detail-label">Description</div>
              <div className="view-detail-value">{event.desc}</div>
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      {event.coords && (
        <div className="view-map-wrap">
          <div className="view-map">
            <MapContainer
              center={[event.coords.lat, event.coords.lng]}
              zoom={16}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[event.coords.lat, event.coords.lng]} icon={purpleIcon} />
              <InvalidateSizeFix />
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
