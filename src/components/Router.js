const fs = require('fs');
const path = require('path');

class Router {
    constructor(configPath) {
        const fileData = fs.readFileSync(
            path.resolve(process.cwd(), configPath),
            'utf-8'
        );
        this.config = JSON.parse(fileData);
    }

    findRoute(destinationIP) {
        let bestMatch = null;
        let bestPrefix = -1;

        for (const route of this.config.routes) {
            const [network, prefix] = route.cidr.split('/');
            const mask = parseInt(prefix);

            if (mask > bestPrefix && this.matches(destinationIP, network, mask)) {
                bestMatch = route;
                bestPrefix = mask;
            }
        }

        return bestMatch;
    }

    matches(ip, network, mask) {
        const ipBits = this.toBits(ip);
        const netBits = this.toBits(network);
        const subnet = netBits.substring(0, mask);
        return ipBits.startsWith(subnet);
    }

    toBits(ip) {
        return ip
            .split('.')
            .map(oct => parseInt(oct).toString(2).padStart(8, '0'))
            .join('');
    }
}

module.exports = Router;