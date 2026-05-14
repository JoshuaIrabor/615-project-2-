import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Loader2 } from 'lucide-react';
import './LocationPicker.css';

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

function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 16, { animate: true });
  }, [coords, map]);
  return null;
}

function MapClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/* ---------- Result formatting ---------- */
function formatPrimary(s) {
  const a = s.address || {};
  const placeName =
    a.amenity || a.shop || a.tourism || a.building || a.leisure ||
    a.office || a.historic || a.public_building || a.university || a.college;
  const street = [a.house_number, a.road].filter(Boolean).join(' ');
  const city = a.city || a.town || a.village || a.suburb || a.hamlet;
  if (placeName) return city ? `${placeName} · ${city}` : placeName;
  if (street)    return city ? `${street}, ${city}` : street;
  return s.display_name.split(',').slice(0, 2).join(',').trim();
}
function formatSecondary(s) {
  const a = s.address || {};
  const parts = [
    a.road,
    a.city || a.town || a.village || a.county,
    a.state,
    a.country,
  ].filter(Boolean);
  return [...new Set(parts)].join(', ');
}

/* ---------- Smarter search: try multiple query variants ---------- */
async function searchNominatim(query, signal) {
  const baseUrl = 'https://nominatim.openstreetmap.org/search';
  const headers = { 'Accept-Language': 'en' };

  // Try the raw query AND a few enhanced variants, then merge unique results
  const queries = [
    query,                                 // exact
    `${query} university`,                 // helps short building names
    `${query} college`,
    `${query} campus`,
  ];

  const results = [];
  const seen = new Set();

  for (const q of queries) {
    try {
      const url = `${baseUrl}?format=json&q=${encodeURIComponent(q)}&limit=8&addressdetails=1&extratags=1`;
      const res = await fetch(url, { signal, headers });
      if (!res.ok) continue;
      const data = await res.json();
      for (const r of data) {
        if (!seen.has(r.place_id)) {
          seen.add(r.place_id);
          results.push(r);
          if (results.length >= 10) break;
        }
      }
      if (results.length >= 6) break;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
    }
  }

  // Sort: places with a building/amenity name come first
  results.sort((a, b) => {
    const aHas = a.address?.amenity || a.address?.building || a.address?.university || a.address?.college;
    const bHas = b.address?.amenity || b.address?.building || b.address?.university || b.address?.college;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return 0;
  });

  return results;
}

export default function LocationPicker({ value, coords, onChange, onCoordsChange }) {
  const defaultCenter = coords ? [coords.lat, coords.lng] : [42.0676, -71.3328];

  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const wrapRef = useRef(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (!focused) return;

    const q = (value || '').trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setNoResults(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setOpen(true);
      setNoResults(false);
      try {
        const data = await searchNominatim(q, controller.signal);
        setSuggestions(data);
        setNoResults(data.length === 0);
        setActiveIdx(-1);
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [value, focused]);

  useEffect(() => {
    function onDocDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  function pickSuggestion(s) {
    skipSearchRef.current = true;
    onChange(formatPrimary(s));
    onCoordsChange({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setOpen(false);
    setSuggestions([]);
  }

  function onKeyDown(e) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0) pickSuggestion(suggestions[activeIdx]);
      else if (suggestions[0]) pickSuggestion(suggestions[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  async function handleMapPick(lat, lng) {
    onCoordsChange({ lat, lng });
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data) {
        skipSearchRef.current = true;
        onChange(formatPrimary(data));
      }
    } catch { /* silent */ }
  }

  return (
    <div className="location-wrap">
      <div className="location-search" ref={wrapRef}>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder="Start typing a place — e.g., Harvard Yard, MIT Stata"
          autoComplete="off"
          spellCheck="false"
        />
        <div className="search-indicator" aria-hidden="true">
          {loading
            ? <Loader2 size={16} className="spin" />
            : <Search size={16} strokeWidth={2.5} />}
        </div>

        {open && (
          <div className="suggestions" role="listbox">
            {noResults && !loading && (
              <div className="suggestion-empty">
                No match found. You can still type a location and click the map to pin it.
              </div>
            )}
            {suggestions.map((s, i) => (
              <div
                key={s.place_id ?? i}
                role="option"
                aria-selected={i === activeIdx}
                className={`suggestion ${i === activeIdx ? 'active' : ''}`}
                onMouseDown={(e) => { e.preventDefault(); pickSuggestion(s); }}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <MapPin size={16} strokeWidth={2} className="suggestion-icon" />
                <div className="suggestion-text">
                  <div className="suggestion-primary">{formatPrimary(s)}</div>
                  <div className="suggestion-secondary">{formatSecondary(s)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="map-container">
        <div className="map-hint">Click on the map to pin location</div>
        <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {coords && <Marker position={[coords.lat, coords.lng]} icon={purpleIcon} />}
          <InvalidateSizeFix />
          <RecenterMap coords={coords} />
          <MapClickHandler onPick={handleMapPick} />
        </MapContainer>
      </div>
    </div>
  );
}