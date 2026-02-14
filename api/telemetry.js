const axios = require('axios');

module.exports = async (req, res) => {
    // Add CORS headers for local development if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-AIO-Key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const AIO_USER = process.env.AIO_USER;
    const AIO_KEY = process.env.AIO_KEY;
    const FEED_KEY = process.env.FEED_KEY || 'truck-telemetry';

    if (!AIO_USER || !AIO_KEY) {
        return res.status(500).json({ error: 'AIO_USER or AIO_KEY environment variables not set' });
    }

    try {
        const url = `https://io.adafruit.com/api/v2/${AIO_USER}/feeds/${FEED_KEY}/data/last`;
        const response = await axios.get(url, {
            headers: { 'X-AIO-Key': AIO_KEY }
        });

        const rawValue = response.data.value;
        let telemetry = {};

        try {
            telemetry = JSON.parse(rawValue);
        } catch (e) {
            return res.status(500).json({ error: 'Value from Adafruit is not valid JSON' });
        }

        // Normalize (fix engine hours if they are in seconds)
        if (telemetry.engine_hours && telemetry.engine_hours > 5000) {
            telemetry.engine_hours = parseFloat((telemetry.engine_hours / 3600).toFixed(2));
        }

        res.status(200).json(telemetry);
    } catch (error) {
        console.error('[API] Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch data from Adafruit IO' });
    }
};
