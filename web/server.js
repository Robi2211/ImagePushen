'use strict';

const express   = require('express');
const rateLimit = require('express-rate-limit');
const mysql     = require('mysql2/promise');
const path      = require('path');

const app  = express();
const PORT = process.env.PORT || 80;

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

// API endpoint: record a visit and return visit statistics
app.get('/api/visits', apiLimiter, async (req, res) => {
    try {
        // Record this visit
        await pool.query('INSERT INTO besuche (zeitstempel) VALUES (NOW())');

        // Fetch total visit count
        const [[{ anzahl }]] = await pool.query(
            'SELECT COUNT(*) AS anzahl FROM besuche'
        );

        // Fetch last 5 visits
        const [visits] = await pool.query(
            'SELECT zeitstempel FROM besuche ORDER BY id DESC LIMIT 5'
        );

        res.json({
            success: true,
            count:   anzahl,
            visits:  visits.map(v => v.zeitstempel),
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: 'Datenbankfehler aufgetreten.' });
    }
});

app.listen(PORT, () => {
    console.log(`ImagePushen server listening on port ${PORT}`);
});
