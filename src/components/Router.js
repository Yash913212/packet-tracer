const fs = require('fs');
const path = require('path');

class Router {
    constructor(configPath) {
        try {
            const fileData = fs.readFileSync(
                path.resolve(process.cwd(), configPath),
                'utf-8'
            );
            this.config = JSON.parse(fileData);
        } catch (err) {
            console.error("Error loading router config:", err.message);
            this.config = { routes: [] }; // Fallback to empty config
        }
    }

    findRoute(destinationIP) {
        // FIX: Prevent crash if IP is undefined/null
        if (!destinationIP || typeof destinationIP !== 'string') {
            console.error("Router Error: Invalid destination IP provided:", destinationIP);
            return null;
        }

        let bestMatch = null;
        let bestPrefix = -1;

        for (const route of this.config.routes) {
            if (!route.cidr || typeof route.cidr !== 'string') {
                continue;
            }

            const parts = route.cidr.split('/');
            if (parts.length !== 2) continue;

            const network = parts[0];
            const prefix = parseInt(parts[1]);

            if (isNaN(prefix)) continue;

            if (prefix > bestPrefix && this.matches(destinationIP, network, prefix)) {
                bestMatch = route;
                bestPrefix = prefix;
            }
        }

        return bestMatch;
    }

    matches(ip, network, mask) {
        const ipBits = this.toBits(ip);
        const netBits = this.toBits(network);
        return ipBits.substring(0, mask) === netBits.substring(0, mask);
    }

    toBits(ip) {
        // Safety check
        if (!ip) return '00000000'.repeat(4);

        return ip
            .split('.')
            .map(oct => parseInt(oct, 10).toString(2).padStart(8, '0'))
            .join('');
    }
}

module.exports = Router;