const DNSResolver = require('./DNSResolver');
const RouterEngine = require('./Router');
const Firewall = require('./Firewall');

class PacketSimulator {
    constructor(configPath) {
        this.resolver = new DNSResolver(configPath);
        this.router = new RouterEngine(configPath);
        this.firewall = new Firewall(configPath);
    }

    async trace(packet) {
        let ttl = packet.ttl || 30;
        let hop = 0;
        const trace = [];

        // 1) DNS Resolution
        hop++;
        const dnsRes = this.resolver.resolve(packet.dest);
        if (dnsRes.error) {
            trace.push({
                hop,
                location: "DNS",
                action: dnsRes.error
            });
            return trace;
        }

        trace.push({
            hop,
            location: "DNS",
            action: `Resolved ${packet.dest} -> ${dnsRes.ip}`
        });

        let destinationIP = dnsRes.ip;

        // 2) Firewall Check (before routing)
        const fw = this.firewall.check({
            ...packet,
            source: packet.source || '0.0.0.0'
        });
        if (!fw.allowed) {
            hop++;
            trace.push({
                hop,
                location: "Firewall",
                action: `Blocked by rule #${fw.rule}`
            });
            return trace;
        }

        // 3) Simulate routing hops until destination reached or TTL expires
        while (ttl > 0) {
            ttl--;

            // Check if we've reached destination (should match the destination CIDR)
            const route = this.router.findRoute(destinationIP);
            if (!route) {
                hop++;
                trace.push({
                    hop,
                    location: "Router",
                    action: `No route to host (${destinationIP})`
                });
                return trace;
            }

            hop++;

            // Check if destination is in this route (has direct delivery capability)
            if (this._isDirectRoute(route)) {
                trace.push({
                    hop,
                    location: "Router",
                    action: `Forwarded to ${route.gateway} via ${route.interface} (Match: ${route.cidr})`
                });

                hop++;
                trace.push({
                    hop,
                    location: "Destination",
                    action: "Packet reached destination network"
                });
                return trace;
            }

            // Forward to next hop
            trace.push({
                hop,
                location: "Router",
                action: `Forwarded to ${route.gateway} via ${route.interface} (Match: ${route.cidr})`
            });

            // Check TTL after hop
            if (ttl <= 0) {
                hop++;
                trace.push({
                    hop,
                    location: "Router",
                    action: "TTL expired before reaching destination"
                });
                return trace;
            }
        }

        // TTL expired
        if (ttl <= 0) {
            hop++;
            trace.push({
                hop,
                location: "Router",
                action: "TTL exceeded"
            });
        }

        return trace;
    }

    _isDirectRoute(route) {
        // Direct routes have gateway as 'Direct', 'local', or similar
        return route.gateway === 'Direct' ||
            route.gateway === 'local' ||
            route.gateway === 'directly';
    }
}

module.exports = PacketSimulator;