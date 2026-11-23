---
title: "Prerequisites"
description: "The server does not need Python, a web server, or a database. Everything is in the image."
order: 1
group: "Get started"
source: "docs/installation.md"
---

This table shows what you need before you install the tool:

| Need | Recommended minimum |
|---|---|
| Server | 64-bit Linux (Debian 12, Ubuntu 22.04 or later), 1 CPU, 1 GB of memory, 5 GB of disk |
| Software | Docker Engine 24 or later with the Compose plugin v2.24 or later (`docker compose version`), Git |
| Network, internal access | 1 port open to the server (8000 by default) |
| Network, HTTPS access | A domain name that points to the server (for example, `reporting.example.com`), and ports 80 and 443 open from the Internet (automatic Let's Encrypt certificate) |
| Emails (optional) | An SMTP account (server, port, username, password, sender address) |

The server does not need Python, a web server, or a database. Everything is in the image.

## Install Docker on Debian or Ubuntu

The official procedure is at https://docs.docker.com/engine/install/. In short, run these commands:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER     # then sign out and sign in again
docker compose version            # must show v2.24 or later
```
