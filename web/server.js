'use strict';

const express   = require('express');
const rateLimit = require('express-rate-limit');
const mysql     = require('mysql2/promise');
const path      = require('path');

const app  = express();
const PORT = process.env.PORT || 80;

// Parse JSON request bodies
app.use(express.json());

// Create a connection pool for reuse across requests
const pool = mysql.createPool({
    host:               process.env.DB_HOST     || 'db',
    database:           process.env.DB_NAME     || 'webapp',
    user:               process.env.DB_USER     || 'webuser',
    password:           process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit:    10,
});

// Serve static files from the html/ directory
app.use(express.static(path.join(__dirname, 'html')));

// Rate limiter: max 60 requests per IP per minute for the API
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max:      60,
    standardHeaders: true,
    legacyHeaders:   false,
});

app.use('/api/', apiLimiter);

// ── Events ──────────────────────────────────────────────────────────────────

// GET /api/events – alle Events auflisten
app.get('/api/events', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, datum, beschreibung, erstellt_am FROM events ORDER BY datum ASC'
        );
        res.json({ success: true, events: rows });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: 'Datenbankfehler aufgetreten.' });
    }
});

// POST /api/events – neues Event erstellen
app.post('/api/events', async (req, res) => {
    const { name, datum, beschreibung } = req.body || {};
    if (!name || !datum) {
        return res.status(400).json({ success: false, error: 'Name und Datum sind Pflichtfelder.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO events (name, datum, beschreibung) VALUES (?, ?, ?)',
            [name.trim(), datum, (beschreibung || '').trim()]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: 'Datenbankfehler aufgetreten.' });
    }
});

// ── Teilnehmer ───────────────────────────────────────────────────────────────

// GET /api/events/:id/teilnehmer – Teilnehmerliste eines Events
app.get('/api/events/:id/teilnehmer', async (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    if (!Number.isInteger(eventId)) {
        return res.status(400).json({ success: false, error: 'Ungültige Event-ID.' });
    }
    try {
        const [[event]] = await pool.query('SELECT id, name FROM events WHERE id = ?', [eventId]);
        if (!event) {
            return res.status(404).json({ success: false, error: 'Event nicht gefunden.' });
        }
        const [rows] = await pool.query(
            'SELECT id, vorname, nachname, email, angemeldet_am FROM teilnehmer WHERE event_id = ? ORDER BY angemeldet_am ASC',
            [eventId]
        );
        res.json({ success: true, event, teilnehmer: rows });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: 'Datenbankfehler aufgetreten.' });
    }
});

// POST /api/events/:id/teilnehmer – Teilnehmer anmelden
app.post('/api/events/:id/teilnehmer', async (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    if (!Number.isInteger(eventId)) {
        return res.status(400).json({ success: false, error: 'Ungültige Event-ID.' });
    }
    const { vorname, nachname, email } = req.body || {};
    if (!vorname || !nachname || !email) {
        return res.status(400).json({ success: false, error: 'Vorname, Nachname und E-Mail sind Pflichtfelder.' });
    }
    // Basic e-mail format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, error: 'Ungültige E-Mail-Adresse.' });
    }
    try {
        const [[event]] = await pool.query('SELECT id FROM events WHERE id = ?', [eventId]);
        if (!event) {
            return res.status(404).json({ success: false, error: 'Event nicht gefunden.' });
        }
        const [result] = await pool.query(
            'INSERT INTO teilnehmer (event_id, vorname, nachname, email) VALUES (?, ?, ?, ?)',
            [eventId, vorname.trim(), nachname.trim(), email.trim().toLowerCase()]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'Diese E-Mail-Adresse ist für dieses Event bereits registriert.' });
        }
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: 'Datenbankfehler aufgetreten.' });
    }
});

app.listen(PORT, () => {
    console.log(`Event-Management server listening on port ${PORT}`);
});

