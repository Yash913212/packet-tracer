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
        let ttl = packet.ttl || 5;
        let hop = 0;
        const trace = [];

        // 1) DNS Resolution
        hop++;
        const dnsRes = this.resolver.resolve(packet.dest);
        if (!dnsRes.ip) {
            trace.push({
                hop,
                location: "DNS",
                action: `Error: DNS did not return an IP for ${packet.dest}`
            });
            return trace;
        }

        trace.push({
            hop,
            location: "DNS",
            action: `Resolved ${packet.dest} -> ${dnsRes.ip}`
        });

        let currentIP = dnsRes.ip;

        // --- While TTL > 0, simulate hops ---
        while (ttl > 0) {
            ttl--;
            hop++;

            // 2) Firewall Check
            const fw = this.firewall.check(packet);
            if (!fw.allowed) {
                trace.push({
                    hop,
                    location: "Firewall",
                    action: `Blocked by rule index: ${fw.rule}`
                });
                return trace;
            }

            // 3) If TTL died here
            if (ttl <= 0) {
                trace.push({
                    hop,
                    location: "Router",
                    action: "TTL expired before reaching destination"
                });
                return trace;
            }

            // 4) Routing
            const route = this.router.findRoute(currentIP);
            if (!route) {
                trace.push({
                    hop,
                    location: "Router",
                    action: `No route to ${currentIP}`
                });
                return trace;
            }

            trace.push({
                hop,
                location: "Router",
                action: `Forwarded to ${route.gateway} via ${route.interface} (Match: ${route.cidr})`
            });

            // 5) Destination reached?
            if (route.cidr === "10.0.0.0/24") {
                hop++;
                trace.push({
                    hop,
                    location: "Destination",
                    action: "Packet reached destination network"
                });
                return trace;
            }
        }

        // Just in case
        return trace;
    }
}

module.exports = PacketSimulator;