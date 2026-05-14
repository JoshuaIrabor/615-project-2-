import dotenv from 'dotenv';
dotenv.config();

const BASE = `${import.meta.env.VITE_API_URL}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch { /* noop */ }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const eventsApi = {
  list:   ()       => request('/events'),
  get:    (id)     => request(`/events/${id}`),
  create: (data)   => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, d)  => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id)     => request(`/events/${id}`, { method: 'DELETE' }),
};

export const TYPE_META = {
  study:    { emoji: '📚', label: 'Study Session' },
  club:     { emoji: '🎯', label: 'Club Meeting' },
  birthday: { emoji: '🎂', label: 'Birthday Party' },
  casual:   { emoji: '🎉', label: 'Casual Hangout' },
};

export function formatEventDate(date, time) {
  if (!date) return 'No date';
  const d = new Date(`${date}T${time || '00:00'}`);
  const dateOpts = { weekday: 'short', month: 'short', day: 'numeric' };
  const timeOpts = { hour: 'numeric', minute: '2-digit' };
  return `${d.toLocaleDateString('en-US', dateOpts)} · ${d.toLocaleTimeString('en-US', timeOpts)}`;
}
