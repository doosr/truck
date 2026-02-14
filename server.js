const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const AIO_USER = process.env.AIO_USER || 'YOUR_USER';
const AIO_KEY = process.env.AIO_KEY || 'YOUR_KEY';
const FEED_KEY = process.env.FEED_KEY || 'truck-telemetry';

/**
 * Convert seconds to hours if necessary
 * The local dashboard expects engine_hours to be in hours.
 */
function normalizeTelemetry(data) {
    if (data.engine_hours && data.engine_hours > 5000) {
        data.engine_hours = parseFloat((data.engine_hours / 3600).toFixed(2));
    }
    return data;
}

app.get('/telemetry', async (req, res) => {
    try {
        console.log(`[API] Fetching latest data from Adafruit for ${AIO_USER}...`);
        const response = await axios.get(`https://io.adafruit.com/api/v2/${AIO_USER}/feeds/${FEED_KEY}/data/last`, {
            headers: { 'X-AIO-Key': AIO_KEY }
        });

        const rawValue = response.data.value;
        let telemetry = {};

        try {
            telemetry = JSON.parse(rawValue);
        } catch (e) {
            console.error('[API] Failed to parse JSON from Adafruit:', rawValue);
            return res.status(500).json({ error: 'Value from Adafruit is not valid JSON' });
        }

        // Normalize (fix engine hours if they are in seconds)
        telemetry = normalizeTelemetry(telemetry);

        res.json(telemetry);
    } catch (error) {
        console.error('[API] Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch data from Adafruit IO' });
    }
});

// Mock endpoint for testing
app.get('/mock-telemetry', (req, res) => {
    res.json({
        temp: 85.5,
        oil_pressure: 3.8,
        fuel_liters: 45,
        fuel_percent: 75,
        rpm: 1200,
        gear: 1,
        engine_hours: 1.28,
        engine_on: true,
        lat: 35.290310,
        lon: 11.026768,
        speed: 15.0,
        sats: 10
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('====================================');
    console.log(`🚀 Adafruit Bridge is running!`);
    console.log(`📍 Endpoint: http://localhost:${PORT}/telemetry`);
    console.log('====================================');
});
