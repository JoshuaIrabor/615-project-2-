import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3100;
const DATA_FILE = path.join(__dirname, 'data', 'events.json');

app.use(cors());
app.use(express.json());

/* ---------- Storage helpers ---------- */
async function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '[]', 'utf-8');
  }
}

async function readEvents() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeEvents(events) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2), 'utf-8');
}

function makeId() {
  return 'e_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

function validateEvent(body) {
  const errors = [];
  if (!body.name || typeof body.name !== 'string') errors.push('name is required');
  if (!body.date) errors.push('date is required');
  if (!body.time) errors.push('time is required');
  if (!body.location) errors.push('location is required');
  const validTypes = ['study', 'club', 'birthday', 'casual'];
  if (!validTypes.includes(body.type)) errors.push('type must be one of: ' + validTypes.join(', '));
  return errors;
}

/* ---------- Routes ---------- */

// GET /api/events  — list all events (sorted by date asc)
app.get('/api/events', async (req, res) => {
  try {
    const events = await readEvents();
    events.sort((a, b) => {
      const da = new Date(`${a.date}T${a.time || '00:00'}`);
      const db = new Date(`${b.date}T${b.time || '00:00'}`);
      return da - db;
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read events' });
  }
});

// GET /api/events/:id  — fetch one
app.get('/api/events/:id', async (req, res) => {
  try {
    const events = await readEvents();
    const event = events.find(e => e.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read event' });
  }
});

// POST /api/events  — create
app.post('/api/events', async (req, res) => {
  try {
    const errors = validateEvent(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    const events = await readEvents();
    const event = {
      id: makeId(),
      type: req.body.type,
      name: req.body.name.trim(),
      date: req.body.date,
      time: req.body.time,
      location: req.body.location.trim(),
      coords: req.body.coords || null,
      max: req.body.max ? parseInt(req.body.max, 10) : null,
      desc: (req.body.desc || '').trim(),
      createdAt: new Date().toISOString()
    };
    events.push(event);
    await writeEvents(events);
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id  — update
app.put('/api/events/:id', async (req, res) => {
  try {
    const errors = validateEvent(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(', ') });

    const events = await readEvents();
    const idx = events.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Event not found' });

    const updated = {
      ...events[idx],
      type: req.body.type,
      name: req.body.name.trim(),
      date: req.body.date,
      time: req.body.time,
      location: req.body.location.trim(),
      coords: req.body.coords || null,
      max: req.body.max ? parseInt(req.body.max, 10) : null,
      desc: (req.body.desc || '').trim(),
      updatedAt: new Date().toISOString()
    };
    events[idx] = updated;
    await writeEvents(events);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id
app.delete('/api/events/:id', async (req, res) => {
  try {
    const events = await readEvents();
    const next = events.filter(e => e.id !== req.params.id);
    if (next.length === events.length) return res.status(404).json({ error: 'Event not found' });
    await writeEvents(next);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(` Campus Events API listening on http://localhost:${PORT}`);
});
