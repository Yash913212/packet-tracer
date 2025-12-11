 # Packet Tracer (Network Simulation API)

A comprehensive network simulation API built with **Node.js + Express** that simulates how a network packet travels through a virtual network topology. This project provides a hands-on way to understand and implement fundamental networking concepts.

## Features

- **DNS Resolution** - Resolve domain names (including CNAME aliases) to IP addresses
- **IP Routing** - Implement Longest Prefix Match (LPM) algorithm for routing decisions
- **Firewall Rules** - Apply ordered firewall rules with source/destination matching
- **TTL Management** - Decrement TTL at each hop and detect TTL expiration
- **Comprehensive Tracing** - Detailed hop-by-hop trace of packet journey
- **Error Handling** - Proper handling of NXDOMAIN, no route, and firewall blocks
- **Configurable Network** - JSON-based network topology definitions

## Installation

### Prerequisites
- Node.js 14.x or higher
- npm or yarn package manager

### Setup

```bash
# Clone the repository
git clone https://github.com/Yash913212/packet-tracer
cd packet-tracer

# Install dependencies
npm install
```

## Running the Application

```bash
# Start the server
npm start

# OR directly with Node
node src/index.js
```

The server will start on: **http://localhost:3000**

You'll see:
```
Server running on http://localhost:3000
```

## Architecture

The simulator is built with a modular design:

- **DNSResolver.js** - Handles DNS A and CNAME record resolution
- **Router.js** - Implements longest prefix match routing algorithm
- **Firewall.js** - Processes ordered firewall rules with CIDR matching
- **PacketSimulator.js** - Orchestrates the simulation flow

## Configuration Files

Network topology is defined in JSON files in the `config/` folder:

- **scenario-basic.json** - Demonstrates successful packet journey with basic DNS and routing
- **scenario-complex.json** - Advanced scenarios including CNAME, port ranges, and blocked traffic

### Configuration Format

Each scenario file contains three main sections:

```json
{
  "dns": [...],      // DNS records (A records and CNAME aliases)
  "routes": [...],   // Routing table with CIDR blocks
  "firewall": [...]  // Firewall rules (ordered, first match wins)
}
```

### DNS Configuration

Supports both A records and CNAME aliases:

```json
"dns": [
  { "type": "A", "domain": "example.com", "ip": "10.0.0.5" },
  { "type": "CNAME", "domain": "www.example.com", "ip": "example.com" }
]
```

- **A Record**: Maps domain to IP address
- **CNAME Record**: Maps domain to another domain (alias)

### Route Configuration

Each route specifies a CIDR block, next-hop gateway, and interface:

```json
"routes": [
  { "cidr": "10.0.0.0/24", "gateway": "Direct", "interface": "eth0" },
  { "cidr": "0.0.0.0/0", "gateway": "192.168.1.1", "interface": "wan0" }
]
```

- **cidr**: Destination network in CIDR notation (e.g., 10.0.0.0/24)
- **gateway**: Next hop IP address or "Direct" for local delivery
- **interface**: Network interface name
- Routes are matched using longest prefix match algorithm

### Firewall Configuration

Firewall rules are processed in order (first match wins):

```json
"firewall": [
  { "action": "deny", "protocol": "TCP", "source": "0.0.0.0/0", "dest_port": 22 },
  { "action": "allow", "protocol": "TCP", "source": "0.0.0.0/0", "dest_port": 80 },
  { "action": "allow", "protocol": "TCP", "source": "0.0.0.0/0", "dest_port": "80-443" }
]
```

- **action**: "allow" or "deny"
- **protocol**: "TCP", "UDP", or omit for any protocol
- **source**: Source IP or CIDR block (e.g., "192.168.1.0/24"), "0.0.0.0/0" for any
- **dest_port**: Destination port (single value or range like "80-443")

## API Endpoints

### POST /trace

Simulates a packet journey through the network.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "source": "1.1.1.1",
  "dest": "example.com",
  "protocol": "TCP",
  "port": 80,
  "ttl": 30
}
```

**Parameters:**
- `source` (optional): Source IP address (default: "127.0.0.1")
- `dest` (required): Destination domain or IP address
- `protocol` (optional): "TCP" or "UDP" (default: "TCP")
- `port` (optional): Destination port (default: 80)
- `ttl` (optional): Time-To-Live, decremented at each hop (default: 30)

**Response Format:**
An array of trace objects showing the packet's journey:

```json
[
  {
    "hop": 1,
    "location": "DNS|Router|Firewall|Destination",
    "action": "Description of action taken"
  }
]
```

## Example Traces

### ✅ Successful Trace (HTTP to example.com)

**Request:**
```json
{
  "source": "1.1.1.1",
  "dest": "example.com",
  "protocol": "TCP",
  "port": 80,
  "ttl": 5
}
```

**Response:**
```json
[
  {
    "hop": 1,
    "location": "DNS",
    "action": "Resolved example.com -> 10.0.0.5"
  },
  {
    "hop": 2,
    "location": "Router",
    "action": "Forwarded to Direct via eth0 (Match: 10.0.0.0/24)"
  },
  {
    "hop": 3,
    "location": "Destination",
    "action": "Packet reached destination network"
  }
]
```

### ❌ Firewall Blocked (SSH attempt)

**Request:**
```json
{
  "source": "1.1.1.1",
  "dest": "example.com",
  "protocol": "TCP",
  "port": 22,
  "ttl": 5
}
```

**Response:**
```json
[
  {
    "hop": 1,
    "location": "DNS",
    "action": "Resolved example.com -> 10.0.0.5"
  },
  {
    "hop": 2,
    "location": "Firewall",
    "action": "Blocked by rule #1"
  }
]
```

### ⏱️ TTL Exceeded

**Request:**
```json
{
  "source": "1.1.1.1",
  "dest": "example.com",
  "protocol": "TCP",
  "port": 80,
  "ttl": 1
}
```

**Response:**
```json
[
  {
    "hop": 1,
    "location": "DNS",
    "action": "Resolved example.com -> 10.0.0.5"
  },
  {
    "hop": 2,
    "location": "Router",
    "action": "TTL expired before reaching destination"
  }
]
```

### 🚫 Domain Not Found (NXDOMAIN)

**Request:**
```json
{
  "source": "1.1.1.1",
  "dest": "nonexistent.invalid",
  "protocol": "TCP",
  "port": 80,
  "ttl": 5
}
```

**Response:**
```json
[
  {
    "hop": 1,
    "location": "DNS",
    "action": "NXDOMAIN: Domain 'nonexistent.invalid' not found in DNS records."
  }
]
```

### 🔗 No Route to Host

**Request:**
```json
{
  "source": "1.1.1.1",
  "dest": "blocked.com",
  "protocol": "TCP",
  "port": 80,
  "ttl": 5
}
```

**Response:**
```json
[
  {
    "hop": 1,
    "location": "DNS",
    "action": "Resolved blocked.com -> 203.0.113.5"
  },
  {
    "hop": 2,
    "location": "Router",
    "action": "No route to host (203.0.113.5)"
  }
]
```

### 🏷️ CNAME Resolution

**Request:**
```json
{
  "source": "1.1.1.1",
  "dest": "www.example.com",
  "protocol": "TCP",
  "port": 80,
  "ttl": 5
}
```

**Response:**
```json
[
  {
    "hop": 1,
    "location": "DNS",
    "action": "Resolved www.example.com -> example.com"
  },
  {
    "hop": 2,
    "location": "DNS",
    "action": "Resolved example.com -> 10.0.1.10"
  },
  {
    "hop": 3,
    "location": "Router",
    "action": "Forwarded to 192.168.1.2 via eth1 (Match: 10.0.1.0/24)"
  },
  {
    "hop": 4,
    "location": "Destination",
    "action": "Packet reached destination network"
  }
]
```

## Testing Endpoints

The API includes helper endpoints for testing individual components:

### GET /test-dns
Test DNS resolution for a specific domain.

**Query Parameters:**
- `domain` (optional): Domain name to resolve (default: "example.com")

**Example:**
```
http://localhost:3000/test-dns?domain=google.com
```

**Response:**
```json
{
  "ip": "8.8.8.8"
}
```

### GET /test-route
Test routing for a specific IP address.

**Query Parameters:**
- `ip` (optional): IP address to route (default: "10.0.0.20")

**Example:**
```
http://localhost:3000/test-route?ip=8.8.8.8
```

**Response:**
```json
{
  "cidr": "0.0.0.0/0",
  "gateway": "192.168.1.1",
  "interface": "wan0"
}
```

## Project Structure

```
packet-tracer/
├── src/
│   ├── index.js                 # Express server & API routes
│   └── components/
│       ├── DNSResolver.js       # DNS resolution with CNAME support
│       ├── Router.js            # Longest prefix match routing
│       ├── Firewall.js          # Firewall rule processing
│       └── PacketSimulator.js   # Main simulation orchestrator
├── config/
│   ├── scenario-basic.json      # Basic network topology
│   └── scenario-complex.json    # Complex network with advanced features
├── package.json                 # Dependencies & scripts
└── Readme.md                    # This file
```

## Key Algorithms

### Longest Prefix Match (LPM)
The router uses LPM to select the most specific matching route. Routes with longer prefix lengths (larger CIDR mask) are preferred:
- Route 10.0.0.0/8 matches 10.5.3.1
- Route 10.0.0.0/24 matches 10.0.0.50 (more specific, preferred)

### CIDR Matching
Both routing and firewall use CIDR notation for flexible IP range matching:
- 10.0.0.0/24 matches 10.0.0.0 to 10.0.0.255
- 192.168.0.0/16 matches 192.168.0.0 to 192.168.255.255
- 0.0.0.0/0 matches any IP address

### Ordered Rule Processing
Firewall rules are evaluated in order. The first matching rule determines the action:
1. Check protocol (if specified)
2. Check destination port (supports single port or ranges)
3. Check source IP/CIDR (if specified)
4. Apply action (allow/deny) if all conditions match

## Error Handling

The simulator properly handles and reports common network errors:

| Error | Cause | Response |
|-------|-------|----------|
| **NXDOMAIN** | Domain not found in DNS | Trace ends with DNS error |
| **No route to host** | No matching route found | Trace ends with Router error |
| **TTL Exceeded** | TTL reaches 0 before destination | Trace ends with TTL error |
| **Firewall Blocked** | Matching firewall deny rule | Trace ends with Firewall block |

## Implementation Notes

### DNS Resolver
- Supports A records (direct IP mapping) and CNAME records (domain aliases)
- Recursively resolves CNAME chains
- Returns NXDOMAIN error if domain not found

### Router
- Implements true LPM algorithm using binary representation
- Supports unlimited number of routes
- Matches destination IP against all routes, selects longest match

### Firewall
- Processes rules in order (first match wins)
- Supports protocol matching (TCP/UDP)
- Supports single port and port range matching (e.g., "80-443")
- Supports CIDR-based source IP matching (e.g., "192.168.1.0/24")

### Packet Simulator
- Orchestrates the complete simulation flow
- Manages TTL decrement and routing hops
- Detects when packet reaches destination (Direct gateway)
- Generates detailed trace with numbered hops

## Future Enhancements

Potential improvements for future versions:
- [ ] Multiple configuration file support per request
- [ ] Traceroute-like output with intermediate router information
- [ ] Real-time network statistics and packet counter
- [ ] Web UI for visual network topology and packet tracing
- [ ] Support for IPv6 addresses
- [ ] MTU (Maximum Transmission Unit) handling and fragmentation
- [ ] BGP-style routing policy support
- [ ] Packet logging and replay functionality

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to improve the simulator.

## License

This project is licensed under the ISC License - see package.json for details.



  
