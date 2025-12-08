const express = require('express');
const app = express();
const path = require('path');

// middleware
app.use(express.json());

// DNS Resolver
const DNSResolver = require('./components/DNSResolver');
const dnsConfig = path.join(__dirname, '../config/scenario-basic.json');
const resolver = new DNSResolver(dnsConfig);

// Routing Engine
const RouterEngine = require('./components/Router');
const routerEngine = new RouterEngine(dnsConfig);

// ----------------------- ROUTES -----------------------

// Basic check API
app.post('/trace', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Packet tracer API working',
        packet: req.body
    });
});

// Test DNS Resolution
app.get('/test-dns', (req, res) => {
    const result = resolver.resolve('example.com');
    res.json(result);
});

// Test Routing
app.get('/test-route', (req, res) => {
    const route = routerEngine.findRoute('10.0.0.20');
    if (!route) {
        return res.json({ error: 'Destination unreachable' });
    }
    res.json(route);
});

// ----------------------- START SERVER -----------------------
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});