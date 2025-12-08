const express = require('express');
const app = express();

app.use(express.json());

app.post('/trace', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Packet tracer API working',
        packet: req.body
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});