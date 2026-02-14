const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(__dirname));

/**
 * Telemetry API Endpoint
 */
app.get('/api/telemetry', async (req, res) => {
    const AIO_USER = process.env.AIO_USER;
    const AIO_KEY = process.env.AIO_KEY;
    const FEED_KEY = process.env.FEED_KEY || 'truck-telemetry';

    if (!AIO_USER || !AIO_KEY) {
        return res.status(500).json({ error: 'AIO_USER or AIO_KEY not set in Vercel' });
    }

    try {
        const url = `https://io.adafruit.com/api/v2/${AIO_USER}/feeds/${FEED_KEY}/data/last`;
        const response = await axios.get(url, {
            headers: { 'X-AIO-Key': AIO_KEY }
        });

        const rawValue = response.data.value;
        let telemetry = JSON.parse(rawValue);

        // Normalize engine hours (seconds to hours conversion)
        if (telemetry.engine_hours && telemetry.engine_hours > 5000) {
            telemetry.engine_hours = parseFloat((telemetry.engine_hours / 3600).toFixed(2));
        }

        res.json(telemetry);
    } catch (error) {
        console.error('[API] Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Adafruit IO' });
    }
});

// For any other route, serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server (for local testing, Vercel uses its own wrapper)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
