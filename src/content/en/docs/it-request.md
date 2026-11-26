---
title: "What to prepare"
description: "This page lists what the IT team prepares before the installation of Probant, and who does what. You can send it to your IT team as it is."
order: 0.3
group: "Before you install"
source: "docs/it_request.md"
---

This page lists what the IT team prepares before the installation of Probant, and who does what. You can send it to
your IT team as it is.

Probant runs on a server of your company, or on your own account with a managed hosting provider. The people who
develop Probant do not host it and receive no data from it. For the security review, see
[Security overview](/docs/security-overview/).

## 1. Hosting

Choose one of the two options. This table shows what IT provides for each option:

| Ready | Option | What IT provides |
|---|---|---|
| ☐ | A. Your own server, with Docker | 64-bit Linux (Debian 12, Ubuntu 22.04 or later), Docker Engine 24 or later with the Compose plugin v2.24 or later (the installer offers to install them on Debian and Ubuntu), and `curl`. Git only to install with Git |
| ☐ | B. Managed hosting (Clever Cloud) | A Clever Cloud account with a Python application, a PostgreSQL add-on, and an FS Bucket add-on. See [Managed hosting](/docs/managed-hosting/) |

For option A, this table shows the size of the server:

| Ready | Item | Minimum | For production use |
|---|---|---|---|
| ☐ | Processors | 1 | 2 to 4, used only by the tool. The load tests used this size. |
| ☐ | Memory | 1 GB | Each worker of the web server uses about 170 MB. The tool starts one worker per processor, from 2 to 4. |
| ☐ | Disk | 5 GB | Each backup is a full copy of the database and of the evidence files. The tool keeps 14 backups by default. Plan the disk for the data and these copies. |
| ☐ | Database | SQLite, in the data volume. There is nothing to install. | PostgreSQL when more than about 20 people are active at the same moment |

## 2. Network

This table shows the network access to prepare:

| Ready | Need | Value |
|---|---|---|
| ☐ | Address | A domain name that points to the server, for example `reporting.example.com` |
| ☐ | Inbound, HTTPS with the Caddy proxy provided | TCP 80 and 443, and UDP 443, open from the Internet. Caddy gets a Let's Encrypt certificate automatically. |
| ☐ | Inbound, HTTPS with your own proxy and certificate | Your proxy sends the requests to TCP 8000 of the server, with the headers `X-Forwarded-Proto` and `X-Forwarded-For`. Use this option if the server is not reachable from the Internet. |
| ☐ | Inbound, HTTPS with Caddy and the certificate of your company | TCP 443 (and 80 for the redirect) from the internal network. The certificate with its full chain and its private key without a password, in PEM format (`./install.sh --cert --key`). No Let's Encrypt, no access from the Internet. |
| ☐ | Inbound, internal trial only | TCP 8000, over HTTP without encryption |
| ☐ | Outbound, installation and updates | From the server, TCP 443: `github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com` (files and their signed sums), `ghcr.io`, `pkg-containers.githubusercontent.com` (image), `tuf-repo-cdn.sigstore.dev` (signatures). With Git, the server builds the image: also Docker Hub and PyPI. Without Internet access: nothing, with the offline package of the release ([Install without Internet access](/docs/install-the-tool/#install-without-internet-access)). |
| ☐ | Outbound, automatic updates (optional) | From the server, not from the tool, every night: `github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`, `ghcr.io`, `pkg-containers.githubusercontent.com` and `tuf-repo-cdn.sigstore.dev`, TCP 443. On by default after an installation with one command; to install without them: `--auto-update off` ([Automatic updates](/docs/update-the-tool/#automatic-updates)). |
| ☐ | Outbound, emails | The SMTP server, on its port: 587 for `starttls`, 465 for `ssl` |
| ☐ | Outbound, company sign-in (optional) | Your OpenID Connect identity provider, TCP 443, only if a space manager turns company sign-in on. Set `PUBLIC_URL`, and register the tool at the provider ([Single sign-on](/docs/single-sign-on/)). |
| ☐ | Internal certificate authority | If the email server, or a proxy that inspects HTTPS, has a certificate of an internal authority: the certificate of that authority in PEM format (`./install.sh --ca-cert`). |

## 3. Email account (SMTP)

The tool sends the reminders, the email alerts, and the test email with an SMTP account. Without it, the tool sends
no email. Give these settings to a space manager, who enters them in **Administration › Settings › Hosting**, or
put them in `.env` yourself. This table shows what to give:

| Ready | Item | Example |
|---|---|---|
| ☐ | Server and port | `smtp.office365.com`, `587` |
| ☐ | Security | `starttls` (port 587), `ssl` (port 465), or `none` |
| ☐ | Username and password | The account that sends the emails |
| ☐ | Sender address | `reporting@example.com` |

## 4. Backups and monitoring

This table shows what IT runs after the installation:

| Ready | Need | What to prepare |
|---|---|---|
| ☐ | Copy of the backups | A place off the server for the backups. Only IT has access to it: the archives contain confidential data, and the backups of the shared account registry contain the password hashes. Two ways: give an S3-compatible bucket (address, region, bucket, access key ID and secret access key) or an SFTP account (server, port, username, password or private key, folder, and the SHA-256 fingerprint of the key of the server), and the tool copies each backup there itself ([Install Probant](/docs/), “Copy the backups outside the server”); or copy the folder `/data/backups`, with all its subfolders, yourself, on a schedule. For the copy by the tool, open the port of the destination from the server (443 or the port of the address for S3, 22 by default for SFTP). |
| ☐ | Health check | The tool sends email alerts itself (failed backup, disk almost full, stopped task…) (on from the start on a new installation, set in **Settings › Health**): give the mailbox that must receive them. In addition, if you have a monitoring tool, a monitor on `GET /sante/`: `200` means that the tool works, `503` means a problem. It also warns you when the server is off, which the tool cannot do. |
| ☐ | Nightly data check | Nothing to set: a late or failed night check is in the email alerts of the tool. With your own monitoring, you can also alert when `controle_donnees.etat` is `late` in the details of `/sante/`. |
| ☐ | Logs | The rotation of the Docker logs. The tool does not set it. |

## 5. Who does what

This table shows each task, who does it, and how long it takes:

| Task | Who | Time |
|---|---|---|
| Prepare the server, the domain name, the firewall, and the SMTP account | IT | Depends on your procedures |
| Check the server before the installation (`get.sh --check` or `./install.sh --check`: it changes nothing) | IT | A few seconds |
| Install the tool (`get.sh`, or `./install.sh` with Git) | IT | About 2 minutes (3 to 5 with Git) |
| Or deploy the tool on Clever Cloud | IT | About 30 minutes |
| Create the administrator account (step 1 of the **Setup** wizard), right after the installation | IT or the administrator of the tool | Right after the installation |
| Do the other 7 steps of the wizard: **Your organisation**, **Languages**, **Organisation**, **Frameworks**, **KPI sheet**, **Team**, **First campaign** | Administrator of the tool | Depends on the number of organisations and KPIs. The administrator can stop and continue later. |
| Set up the email server in the tool, and send a test email (**Administration › Settings › Hosting**) | Space manager, or IT in `.env` | Not measured |
| Set up company sign-in (optional): the application at the provider, then **Administration › Settings › Company sign-in** | IT and a space manager | Not measured |
| Create the accounts and give the roles | Administrator of the tool | Not measured |
| Copy the backups off the server | IT | On a schedule |
| Update the tool (`./update.sh`), or let the automatic updates of the server do it | IT | 1 to 3 minutes |
| Restore a backup | IT, or the administrator of the tool from the **Hosting** page | A few seconds |

## 6. Steps

To install the tool, do these steps. [Install Probant](/docs/) gives the details of each step:

1. Prepare the items of sections 1 to 4.
2. Check the server, then install the tool with one command and `--domain reporting.example.com`
   ([Install Probant](/docs/), section 2). If Docker is missing, the installer offers to install it.
3. Open the address of the tool, and create the administrator account right away (section 3). Until this step is
   done, the first person who opens the address creates this account.
4. Give the SMTP settings to a space manager (the administrator of step 3 is one), or add them to `.env`, then send
   a test email (section 7).
5. Give a space manager the destination for the copy of the backups, or schedule the copy of `/data/backups` off
   the server yourself (section 5).
6. Connect your monitoring to `/sante/` (section 9).
7. Give the address to the administrator of the tool, who does the rest of the setup.
