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
        // Supports array format with type: A, CNAME, etc.
        let result = this._findRecord(domain);

        if (result.error) {
            return result;
        }

        // If it's an IP address, return it
        if (this._isIPAddress(result)) {
            return { ip: result };
        }

        // If it's a domain (CNAME), resolve it recursively
        return this.resolve(result);
    }

    _findRecord(name) {
        if (Array.isArray(this.config.dns)) {
            const entry = this.config.dns.find(e =>
                (e.domain === name || e.name === name)
            );
            if (entry) {
                // Support both 'ip'/'value' field names
                return entry.ip || entry.value || null;
            }
        } else if (typeof this.config.dns === 'object') {
            const ip = this.config.dns[name];
            if (ip) return ip;
        }

        return { error: `NXDOMAIN: Domain '${name}' not found in DNS records.` };
    }

    _isIPAddress(str) {
        if (typeof str !== 'string') return false;
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        return ipv4Regex.test(str);
    }
}

module.exports = DNSResolver;