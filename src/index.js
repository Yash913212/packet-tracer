const express = require('express');
const app = express();
const path = require('path');

// Middleware
app.use(express.json());

// 1. Import the Resolver
const DNSResolver = require('./components/DNSResolver');

// 2. Initialize the Resolver
// We use path.join so it finds the config file correctly
const configPath = path.join(__dirname, '../config/scenario-basic.json');
const resolver = new DNSResolver(configPath);

// Route: Trace (Keep your existing route)
app.post('/trace', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Packet tracer API working',
        packet: req.body
    });
});

// 3. Route: Test DNS (THIS IS THE PART YOU ARE MISSING)
app.get('/test-dns', async(req, res) => {
    try {
        console.log('Resolving DNS...'); // value for debugging
        const result = await resolver.resolve('example.com');
        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});