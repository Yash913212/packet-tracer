const fs = require('fs');
const path = require('path');

class Firewall {
    constructor(configPath) {
        try {
            const fileData = fs.readFileSync(
                path.resolve(process.cwd(), configPath),
                'utf-8'
            );
            this.config = JSON.parse(fileData);
        } catch (err) {
            console.error("Error loading firewall config:", err.message);
            this.config = { firewall: [] };
        }
    }

    check(packet) {
        if (!this.config.firewall || !Array.isArray(this.config.firewall)) {
            return { allowed: true, rule: null };
        }

        let ruleNumber = 0;

        for (const rule of this.config.firewall) {
            ruleNumber++;

            // Match protocol
            if (rule.protocol && rule.protocol !== packet.protocol) {
                continue;
            }

            // Match destination port or port range
            if (!this._matchPort(packet.port, rule.dest_port)) {
                continue;
            }

            // Match source CIDR
            if (!this._matchSourceIP(packet.source, rule.source)) {
                continue;
            }

            // Rule matched - apply action
            if (rule.action === "allow") {
                return {
                    allowed: true,
                    rule: ruleNumber
                };
            }

            if (rule.action === "deny") {
                return {
                    allowed: false,
                    rule: ruleNumber
                };
            }
        }

        // Default allow if no rule matched
        return { allowed: true, rule: null };
    }

    _matchPort(packetPort, rulePort) {
        if (!rulePort) return true; // Any port matches if not specified

        // Support port range (e.g., "80-443")
        if (typeof rulePort === 'string' && rulePort.includes('-')) {
            const [start, end] = rulePort.split('-').map(p => parseInt(p));
            return packetPort >= start && packetPort <= end;
        }

        // Single port
        return parseInt(rulePort) === parseInt(packetPort);
    }

    _matchSourceIP(packetSource, ruleSource) {
        if (!ruleSource) return true; // Any source matches if not specified

        // Exact match
        if (ruleSource === packetSource) return true;

        // Any/all match
        if (ruleSource === "0.0.0.0/0" || ruleSource === "any") return true;

        // CIDR match
        if (ruleSource.includes('/')) {
            return this._matchCIDR(packetSource, ruleSource);
        }

        return false;
    }

    _matchCIDR(ip, cidr) {
        const parts = cidr.split('/');
        if (parts.length !== 2) return false;

        const network = parts[0];
        const prefix = parseInt(parts[1]);

        if (isNaN(prefix) || prefix < 0 || prefix > 32) return false;

        const ipBits = this._toBits(ip);
        const netBits = this._toBits(network);

        return ipBits.substring(0, prefix) === netBits.substring(0, prefix);
    }

    _toBits(ip) {
        if (!ip) return '00000000'.repeat(4);

        return ip
            .split('.')
            .map(oct => parseInt(oct, 10).toString(2).padStart(8, '0'))
            .join('');
    }
}

module.exports = Firewall;