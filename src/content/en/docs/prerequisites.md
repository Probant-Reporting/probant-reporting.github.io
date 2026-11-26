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
| Software | Docker Engine 24 or later with the Compose plugin v2.24 or later (`docker compose version`), and `curl`. If Docker is missing on Debian or Ubuntu, the installer offers to install it. Git only to install with Git |
| Network, internal access | 1 port open to the server (8000 by default) |
| Network, HTTPS access | A domain name that points to the server (for example, `reporting.example.com`), and ports 80 and 443 open from the Internet (automatic Let's Encrypt certificate) |
| Network, downloads | Outgoing HTTPS (TCP 443) from the server, during the installation and the updates: `github.com` and `raw.githubusercontent.com` (files), `objects.githubusercontent.com` and `release-assets.githubusercontent.com` (list of the sums of the files, attached to the release), `ghcr.io` and `pkg-containers.githubusercontent.com` (image and container of cosign), `tuf-repo-cdn.sigstore.dev` (trusted root of Sigstore, to verify the signatures). With the automatic updates (section 6), the server opens the same connections at night. To install Docker with the installer: `download.docker.com` and the package mirrors of the system. Without Internet access: none (see “Install without Internet access”) |
| Emails (optional) | An SMTP account (server, port, username, password, sender address) |

The server does not need Python, a web server, or a database. Everything is in the image.

## Install Docker on Debian or Ubuntu

If Docker is missing, the installer asks this question:
`Install Docker now, from Docker's apt repository (download.docker.com)? [y/N]`. Type `y` to install it. Any other
answer stops the installer, and nothing changes.

The installer uses the official procedure of Docker (https://docs.docker.com/engine/install/): it adds the apt
repository of Docker, checked with the key of Docker, then installs the packages `docker-ce`, `docker-ce-cli`,
`containerd.io`, `docker-buildx-plugin` and `docker-compose-plugin`. Its rules are these:

- It never installs Docker without a yes. Without a terminal (an automatic deployment, for example), add the option
  `--yes` to answer yes.
- It installs Docker only on Debian and Ubuntu. On another system, it stops: install Docker yourself, then run the
  installer again.
- It needs administrator rights: run it as `root` or with `sudo`. Otherwise, it stops and changes nothing.

To use Docker without `sudo`, add your account to the `docker` group (`sudo usermod -aG docker $USER`), then sign out
and sign in again. A member of this group has the same rights as `root` on the server.
