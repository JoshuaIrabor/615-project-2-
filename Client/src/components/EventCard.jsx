import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, MapPin, Users, Pencil, Trash2, Share2, Copy, Download, X, Mail } from 'lucide-react';
import { TYPE_META, formatEventDate } from '../api.js';
import { useToast } from '../App.jsx';
import './EventCard.css';

export default function EventCard({ event, index, onDelete }) {
  const navigate = useNavigate();
  const { show } = useToast();
  const [shareOpen, setShareOpen] = useState(false);

  const meta = TYPE_META[event.type] || TYPE_META.casual;
  const eventUrl = `${window.location.origin}/event/${event.id}`;

  /* ---------- Hide page chrome while modal is open ---------- */
  useEffect(() => {
    if (shareOpen) {
      document.body.classList.add('share-modal-active');
    } else {
      document.body.classList.remove('share-modal-active');
    }
    // Clean up on unmount in case the card disappears while modal is open
    return () => document.body.classList.remove('share-modal-active');
  }, [shareOpen]);

  /* ---------- Card actions ---------- */
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/edit/${event.id}`);
  };
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this event?')) onDelete(event.id);
  };
  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShareOpen(true);
  };
  const handleCardClick = () => navigate(`/edit/${event.id}`);

  /* ---------- Build a friendly email body ---------- */
  function buildEmailBody() {
    const date = formatEventDate(event.date, event.time);
    const lines = [
      `You're invited to: ${event.name}`,
      '',
      `${meta.emoji} ${meta.label}`,
      `📅 ${date}`,
      `📍 ${event.location}`,
    ];
    if (event.max) lines.push(`👥 Up to ${event.max} people`);
    if (event.desc) {
      lines.push('');
      lines.push(event.desc);
    }
    lines.push('');
    lines.push('View the event and full details here:');
    lines.push(eventUrl);
    lines.push('');
    lines.push('— Sent from Campus Events');
    return lines.join('\n');
  }

  /* ---------- Share actions ---------- */
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(eventUrl);
      show('Link copied to clipboard', true);
    } catch {
      show('Could not copy link');
    }
  }

  function shareViaEmail() {
    const subject = encodeURIComponent(`Event: ${event.name}`);
    const body = encodeURIComponent(buildEmailBody());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function downloadQr() {
    const svg = document.getElementById(`qr-${event.id}`);
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    show('QR code downloaded', true);
  }

  return (
    <>
      <div
        className="event-card"
        style={{ animationDelay: `${index * 60}ms` }}
        onClick={handleCardClick}
      >
        <div className="event-card-top">
          <div className="event-emoji">{meta.emoji}</div>
          <div className="event-actions">
            <button type="button" className="icon-btn" onClick={handleShare} title="Share" aria-label="Share">
              <Share2 size={14} strokeWidth={2} />
            </button>
            <button type="button" className="icon-btn" onClick={handleEdit} title="Edit" aria-label="Edit">
              <Pencil size={14} strokeWidth={2} />
            </button>
            <button type="button" className="icon-btn danger" onClick={handleDelete} title="Delete" aria-label="Delete">
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        <h3>{event.name}</h3>
        <span className="event-type-badge">{meta.label}</span>

        <div className="event-meta">
          <div className="event-meta-row">
            <Calendar size={16} strokeWidth={2} />
            {formatEventDate(event.date, event.time)}
          </div>
          <div className="event-meta-row">
            <MapPin size={16} strokeWidth={2} />
            {event.location}
          </div>
          {event.max && (
            <div className="event-meta-row">
              <Users size={16} strokeWidth={2} />
              Up to {event.max} people
            </div>
          )}
        </div>

        {event.desc && <div className="event-desc">{event.desc}</div>}
      </div>

      {/* ---------- SHARE MODAL ---------- */}
      {shareOpen && (
        <div className="share-modal-backdrop" onClick={() => setShareOpen(false)}>
          <div
            className="share-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="share-modal-close"
              onClick={() => setShareOpen(false)}
              aria-label="Close"
            >
              <X size={18} strokeWidth={2.2} />
            </button>

            <div className="share-modal-header">
              <div className="share-modal-emoji">{meta.emoji}</div>
              <h3>Share this event</h3>
              <p>{event.name}</p>
            </div>

            <div className="qr-box">
              <QRCodeSVG
                id={`qr-${event.id}`}
                value={eventUrl}
                size={200}
                level="M"
                bgColor="#ffffff"
                fgColor="#4c1d95"
                includeMargin={false}
              />
            </div>
            <div className="qr-caption">Scan with a phone camera to open</div>

            <div className="link-box">
              <input
                type="text"
                value={eventUrl}
                readOnly
                onFocus={(e) => e.target.select()}
                className="link-input"
              />
              <button
                type="button"
                className="link-copy-btn"
                onClick={copyLink}
                title="Copy link"
              >
                <Copy size={16} strokeWidth={2} />
              </button>
            </div>

            <button type="button" className="btn btn-primary share-email-btn" onClick={shareViaEmail}>
              <Mail size={16} strokeWidth={2.5} /> Send via Email
            </button>

            <div className="share-modal-actions">
              <button type="button" className="btn btn-ghost" onClick={copyLink}>
                <Copy size={16} strokeWidth={2.2} /> Copy Link
              </button>
              <button type="button" className="btn btn-ghost" onClick={downloadQr}>
                <Download size={16} strokeWidth={2.2} /> Download QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}