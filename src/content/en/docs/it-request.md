---
title: "What to prepare"
description: "The details are in Install Probant and in the Security overview, which has a filled-in security questionnaire. Company sign-in is in Single sign-on, Clever…"
order: 0.3
group: "Before you install"
source: "docs/it_request.md"
---

## 1. The tool in brief

- Probant is a web application in **one Docker container**. All its data is in **one volume**, `/data`: the database,
  the evidence files, the backups, and the secret key. The database is SQLite, with nothing to install. Choose
  PostgreSQL when more than about 20 people are active at the same moment.
- It runs on a server of your company, or on your own account with a managed hosting provider. It needs no external
  service to run: emails, company sign-in, and the external copy of the backups are optional. The people who develop
  Probant do not host it, receive no data from it, and have no access to your installation.

## 2. What you provide

| Ready | Item | What to provide |
|---|---|---|
| ☐ | Server | 64-bit Linux on `x86_64` (on `arm64`, install with Git), with an account that can use `sudo`. Minimum: 1 processor, 1 GB of memory, 5 GB of disk. For production use: 2 to 4 processors. Plan the disk for the backups: each one is a full copy of the data, and the tool keeps 14 backups by default. On Debian 12 or Ubuntu 22.04, or a later version, install nothing in advance, only `curl` if it is missing: the installer offers to install Docker and waits for your yes. On another Linux system, install Docker and its Compose plugin first (versions in the installation guide). |
| ☐ | Or managed hosting | A Clever Cloud account with a Python application, a PostgreSQL add-on, and an FS Bucket add-on. See [Managed hosting](/docs/managed-hosting/). |
| ☐ | Domain name, for HTTPS | A name that points to the server, for example `reporting.example.com`. |
| ☐ | Email account (optional) | The SMTP server and its port (587 for `starttls`, 465 for `ssl`), the username and the password, the sender address. Without it, the tool sends no email. |
| ☐ | Place for the copy of the backups (recommended) | An S3-compatible bucket or an SFTP account that only IT can open: the backups contain confidential data and the password hashes. Or copy `/data/backups` off the server yourself, on a schedule. |

## 3. Install

1. Check the server. The check reads Docker, memory, disk, ports, domain name, network, and clock, and changes nothing:

   ```bash
   curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh \
     | sudo sh -s -- --check --domain reporting.example.com
   ```

2. Install the tool with the same command, without `--check`. It takes about 2 minutes. The command checks each file
   against the signed list of the release: if the list is missing or a file does not match, it installs nothing.
3. Open the address and create the administrator account right away. Until then, the first person who opens the
   address creates it.

Variants:

- **Without Internet access**: the signed offline package of the release, with `./install.sh --offline`.
- **Company network**: the HTTPS certificate of your company (`--cert`, `--key`), your internal certificate authority
  (`--ca-cert`), and a proxy for the outgoing connections (`HTTPS_PROXY`).
- **With Git**: the server builds the image, in 3 to 5 minutes.

## 4. Network

For the inbound access, choose one line:

| Inbound access | Ports |
|---|---|
| HTTPS with the Caddy proxy provided | TCP 80 and 443, and UDP 443, open from the Internet. Caddy gets a Let's Encrypt certificate automatically. |
| HTTPS with the certificate of your company | TCP 443, and 80 for the redirect, from the internal network. No access from the Internet. |
| HTTPS with your own proxy | Your proxy sends the requests to TCP 8000, with the headers `X-Forwarded-Proto` and `X-Forwarded-For`. |
| Internal trial only | TCP 8000, over HTTP without encryption |

The outbound connections, all on TCP 443 except the email server and SFTP:

| Use | Destinations, from the server |
|---|---|
| Installation and updates | `github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`, `ghcr.io`, `pkg-containers.githubusercontent.com`, `tuf-repo-cdn.sigstore.dev`. With HTTPS (`--domain`): also Docker Hub. If the installer installs Docker: also `download.docker.com` and the package mirrors of the system. With the offline package: nothing. |
| Automatic updates | The same GitHub and Sigstore hosts, every night, from the server (not from the tool) |
| Emails (optional) | Your SMTP server, on its port |
| Copy of the backups (optional) | The S3 destination (443, or the port of its address) or the SFTP server (22 by default) |
| Company sign-in (optional) | Your OpenID Connect identity provider |

## 5. After the installation

This table shows what runs on its own, and what stays with IT:

| Topic | On its own | What IT does |
|---|---|---|
| Updates | After an installation with one command, the server installs each new version at night, 3 days after its publication. It installs only a signed image, backs up each space first, and goes back if the new version does not respond. | To turn them off: `--auto-update off` at the installation, or the choice **Off** in the tool. Otherwise, run `./update.sh` (1 to 3 minutes). |
| Backups | Every night. They are signed, not encrypted. | Copy them off the server, or give the destination to a space manager. Encrypt the disk. |
| Email alerts | Failed backup, disk almost full, stopped task, failed copy, and more. On a new installation, they are on from the start (**Administration › Settings › Health**). | Give the mailbox that receives them. |
| Health page | `GET /sante/` answers `200` when the tool works, `503` when there is a problem. | Add a monitor on it: only this monitor warns you when the server is off. |
| Logs | The tool writes them on the standard output of the container. | Set the rotation of the Docker logs. |

## 6. Security in brief

- Each image is signed, with its list of components (SBOM) attached. Each release has a report of the known
  vulnerabilities.
- The container runs as user 1000. The code belongs to root, and the tool cannot change it. Only the latest version
  receives security corrections.
- Company sign-in uses OpenID Connect. It is off by default, and the accounts stay created in the tool. There is no SAML,
  no LDAP, and no second factor of the tool's own.
- The secrets saved in the tool (email password, secrets of the external copy, client secret of company sign-in) are
  encrypted. The tool never shows them again.
- No telemetry: the tool sends nothing to the people who develop it, and its pages load nothing from another site.
- Over HTTPS, the tool sends HSTS and a strict content security policy. A session ends after 12 hours without activity.
  Repeated failed sign-ins block the sign-in for 15 minutes.
- Not provided: no certification (ISO 27001, SOC 2), no penetration test by a third party, no encryption of the data or
  of the backups by the tool, no malware scan of the evidence files, and no high availability.

## 7. Who does what

| Who | Tasks |
|---|---|
| IT | Server, domain name, firewall, email account. Installation and the first administrator account. Copy of the backups, monitoring, logs. Updates by hand, or the timer of the automatic updates. |
| A space manager (the first administrator is one) | The settings of the whole installation: email server, email alerts, automatic updates, external copy of the backups, company sign-in |
| The administrators of the tool | The setup wizard, the accounts and the roles, the frameworks, the campaigns |

## 8. Where to find the rest

The details are in [Install Probant](/docs/) and in the [Security overview](/docs/security-overview/), which has
a filled-in security questionnaire. Company sign-in is in [Single sign-on](/docs/single-sign-on/), Clever Cloud in
[Managed hosting](/docs/managed-hosting/), and how to report a vulnerability in private in [`SECURITY.md`](https://github.com/Probant-Reporting/probant/blob/main/SECURITY.md).
