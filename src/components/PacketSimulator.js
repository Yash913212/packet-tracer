const DNSResolver = require('./DNSResolver');
const RouterEngine = require('./Router');

class PacketSimulator {
    constructor(configPath) {
        this.resolver = new DNSResolver(configPath);
        this.router = new RouterEngine(configPath);
    }

    async trace(packet) {
        const trace = [];
        let ttl = packet.ttl;
        let hop = 1;

        // --- STEP 1: DNS Resolution ---
        const dns = this.resolver.resolve(packet.dest);

        // Handle explicit DNS errors
        if (dns.error) {
            trace.push({
                hop,
                location: "DNS",
                action: dns.error
            });
            return trace;
        }

        // CRITICAL FIX: Check if an IP was actually returned
        if (!dns.ip) {
            trace.push({
                hop,
                location: "DNS",
                action: "Error: DNS resolved but returned no IP address."
            });
            return trace;
        }

        trace.push({
            hop,
            location: "DNS",
            action: `Resolved ${packet.dest} -> ${dns.ip}`
        });

        let currentIP = dns.ip;

        // --- STEP 2: Routing Loop ---
        while (ttl > 0) {
            ttl--;
            hop++;

            // Find route for the current IP
            const route = this.router.findRoute(currentIP);

            if (!route) {
                trace.push({
                    hop,
                    location: "Router",
                    action: `No route found for host: ${currentIP}`
                });
                return trace;
            }

            trace.push({
                hop,
                location: "Router",
                action: `Forwarded to ${route.gateway} via ${route.interface} (Match: ${route.cidr})`
            });

            // Logic Check: If the route is specific (not 0.0.0.0/0), we assume we reached the network
            // (You might want to adjust this logic depending on your simulation rules)
            if (route.gateway === '0.0.0.0' || route.gateway === 'Direct') {
                trace.push({
                    hop,
                    location: "Destination",
                    action: "Packet reached destination network"
                });
                return trace;
            }

            // Stop if we hit the default gateway to prevent infinite loops in this basic sim
            if (route.cidr === "0.0.0.0/0") {
                trace.push({
                    hop: hop + 1,
                    location: "Internet Gateway",
                    action: "Packet sent to ISP / Internet"
                });
                return trace;
            }
        }

        // If loop finishes without returning
        trace.push({
            hop,
            location: "Router",
            action: "Time to Live (TTL) exceeded"
        });

        return trace;
    }
}

module.exports = PacketSimulator;