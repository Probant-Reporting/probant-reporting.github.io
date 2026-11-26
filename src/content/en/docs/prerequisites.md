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
| Server | 64-bit Linux on `x86_64` (on `arm64`, install with Git only), for example Debian 12 or later, or Ubuntu 22.04 or later. 1 CPU, 1 GB of memory, 5 GB of disk |
| Software | On Debian or Ubuntu: nothing to install first, except `curl` if it is missing. The installer offers to install Docker, and waits for your yes. On another Linux system: first install Docker Engine 24 or later with the Compose plugin v2.24 or later (`docker compose version`). Git only to install with Git |
| Account | An account that can use `sudo` |
| Network, internal access | 1 port open to the server (8000 by default) |
| Network, HTTPS access | A domain name that points to the server (for example, `reporting.example.com`), and ports 80 and 443 (TCP, and UDP 443 for HTTP/3) open from the Internet (automatic Let's Encrypt certificate). With the certificate of your company, the Internet does not need to reach the server: see “Company network” |
| Network, downloads | Outgoing HTTPS (TCP 443) from the server, during the installation and each update: `github.com` and `raw.githubusercontent.com` (files), `objects.githubusercontent.com` and `release-assets.githubusercontent.com` (list of the sums of the files, attached to the release), `ghcr.io` and `pkg-containers.githubusercontent.com` (image of the tool and container of cosign), `tuf-repo-cdn.sigstore.dev` (trusted root of Sigstore, to verify the signatures). With HTTPS (`--domain`): also Docker Hub (image of Caddy). With Git: also Docker Hub and PyPI (the server builds the image). With the automatic updates (section 6), the server opens the same connections at night. To install Docker with the installer: `download.docker.com` and the package mirrors of the system. Without Internet access: none (see “Install without Internet access”) |
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
