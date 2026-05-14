import { TYPE_META } from '../api.js';
import './EventTypePicker.css';

const TYPES = ['study', 'club', 'birthday', 'casual'];

export default function EventTypePicker({ value, onChange }) {
  return (
    <div className="section-card">
      <div className="section-title">Event Type</div>
      <div className="type-grid">
        {TYPES.map(t => (
          <div
            key={t}
            className={`type-card ${value === t ? 'active' : ''}`}
            onClick={() => onChange(t)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onChange(t); }}
          >
            <div className="emoji">{TYPE_META[t].emoji}</div>
            <div className="label">{TYPE_META[t].label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
