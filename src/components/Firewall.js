const fs = require('fs');
const path = require('path');

class Firewall {
    constructor(configPath) {
        const fileData = fs.readFileSync(
            path.resolve(process.cwd(), configPath),
            'utf-8'
        );
        this.config = JSON.parse(fileData);
    }

    check(packet) {
        let ruleNumber = 0;

        for (const rule of this.config.firewall) {
            ruleNumber++;

            // Match protocol
            if (rule.protocol && rule.protocol !== packet.protocol) {
                continue;
            }

            // Match port
            if (rule.dest_port && rule.dest_port !== packet.port) {
                continue;
            }

            // Match source (CIDR ignore for now)
            // If you want full CIDR matching, we can add later
            if (rule.source && rule.source !== "0.0.0.0/0") {
                continue;
            }

            // If allow
            if (rule.action === "allow") {
                return {
                    allowed: true,
                    rule: ruleNumber
                };
            }

            // If deny
            if (rule.action === "deny") {
                return {
                    allowed: false,
                    rule: ruleNumber
                };
            }
        }

        // Default allow
        return { allowed: true, rule: null };
    }
}

module.exports = Firewall;