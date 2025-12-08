const express = require('express');
const app = express();
const path = require('path');

// Middleware
app.use(express.json());

// Configuration Path
const dnsConfig = path.join(__dirname, '../config/scenario-basic.json');

// --- Components ---
const DNSResolver = require('./components/DNSResolver');
const resolver = new DNSResolver(dnsConfig);

const RouterEngine = require('./components/Router');
const routerEngine = new RouterEngine(dnsConfig);

const PacketSimulator = require('./components/PacketSimulator');
const simulator = new PacketSimulator(dnsConfig);

// ----------------------- ROUTES -----------------------

// Trace route
app.post('/trace', async(req, res) => {
    try {
        const packet = {
            source: req.body.source || '127.0.0.1',
            dest: req.body.dest,
            protocol: req.body.protocol || 'TCP',
            port: req.body.port || 80,
            ttl: req.body.ttl || 30 // Increased default TTL
        };

        if (!packet.dest) {
            return res.status(400).json({ error: "Destination 'dest' is required." });
        }

        console.log(`Tracing packet to: ${packet.dest}`);
        const result = await simulator.trace(packet);
        res.json(result);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Test DNS Resolution
app.get('/test-dns', (req, res) => {
    const domain = req.query.domain || 'example.com';
    const result = resolver.resolve(domain);
    res.json(result);
});

// Test Routing
app.get('/test-route', (req, res) => {
    const ip = req.query.ip || '10.0.0.20';
    const route = routerEngine.findRoute(ip);

    if (!route) {
        return res.json({ error: 'Destination unreachable' });
    }
    res.json(route);
});

// ----------------------- START SERVER -----------------------
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});