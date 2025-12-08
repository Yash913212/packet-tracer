const fs = require('fs');
const path = require('path');

class DNSResolver {
    constructor(configPath) {
        try {
            const fileData = fs.readFileSync(
                path.resolve(process.cwd(), configPath),
                'utf-8'
            );
            this.config = JSON.parse(fileData);
        } catch (err) {
            console.error("Error loading DNS config:", err.message);
            this.config = { dns: [] };
        }
    }

    resolve(domain) {
        // Safety check if config is empty
        if (!this.config.dns) {
            return { error: "DNS configuration missing in scenario file." };
        }

        // Search for the domain in the DNS list
        // Supports both Array format [{domain: "x", ip: "y"}] and Object format {"x": "y"}
        let ip = null;

        if (Array.isArray(this.config.dns)) {
            const entry = this.config.dns.find(e => e.domain === domain);
            if (entry) ip = entry.ip;
        } else if (typeof this.config.dns === 'object') {
            ip = this.config.dns[domain];
        }

        if (ip) {
            return { ip: ip };
        } else {
            return { error: `Domain '${domain}' not found in DNS records.` };
        }
    }
}

module.exports = DNSResolver;