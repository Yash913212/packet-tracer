 Packet Tracer (Network Simulation API)

A simple network simulation API built using **Node.js + Express**, designed to simulate how a packet travels through a network using:
- DNS Resolution
- Routing (Longest Prefix Match)
- Firewall Rule Checks
- TTL (Time-To-Live)

📦 Packet Tracer (Network Simulation API)

A simple network simulation API built using Node.js + Express, designed to simulate how a packet travels through a network using:

DNS Resolution

Routing (Longest Prefix Match)

Firewall Rule Checks

TTL (Time-To-Live)

The API returns a hop-by-hop trace showing each step the packet takes.

Installation
git clone https://github.com/Yash913212/packet-tracer
cd packet-tracer
npm install

Run Server
node src/index.js


Server will run at:

http://localhost:3000

Config Files

The network is defined using JSON files in the config/ folder:

scenario-basic.json → successful packet journey

scenario-complex.json → blocked/TTL/no route cases

Each scenario includes dns, routes, and firewall sections.

Request Format
Method:POST
URl:http://localhost:3000/trace
Headers : Content-Type: application/json

Example Request from the Successful trace

{
  "source": "1.1.1.1",
  "dest": "example.com",
  "protocol": "TCP",
  "port": 80,
  "ttl": 5
}


Example Responce
[
  {
    "hop": 1,
    "location": "DNS",
    "action": "Resolved example.com -> 10.0.0.5"
  },
  {
    "hop": 2,
    "location": "Router",
    "action": "Forwarded to 192.168.1.1 via eth0 (Match: 10.0.0.0/24)"
  },
  {
    "hop": 3,
    "location": "Destination",
    "action": "Packet reached destination network"
  }
]


Firewall Blocked Example

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

TTL expired example

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


No route to host 

[
  {
    "hop": 1,
    "location": "DNS",
    "action": "Resolved unknown.com -> 203.0.113.5"
  },
  {
    "hop": 2,
    "location": "Router",
    "action": "No route to host"
  }
]



The API returns a **hop-by-hop trace** showing each step the packet takes.

Features

Resolve domain to IP using local DNS records  
Find next hop using longest prefix match  
Check firewall rules before forwarding  
Simulate TTL expiry  
JSON-based network configuration  
Simple trace output for each packet  
