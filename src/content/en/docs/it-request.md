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
| ☐ | A. Your own server, with Docker | A 64-bit Linux server (`x86_64`), with an account that can use `sudo`. On Debian 12 or Ubuntu 22.04, or a later version, install nothing in advance, only `curl` if it is missing: the installer offers to install Docker and waits for your yes. On another Linux system, install Docker Engine 24 or later and its Compose plugin v2.24 or later first. Git only to install with Git (also on `arm64`) |
| ☐ | B. Managed hosting (Clever Cloud) | A Clever Cloud account with a Python application, a PostgreSQL add-on, and an FS Bucket add-on. See [Managed hosting](/docs/managed-hosting/) |

For option A, this table shows the size of the server:

| Ready | Item | Minimum | For production use |
|---|---|---|---|
| ☐ | Processors | 1 | 2 to 4, used only by the tool. The load tests used this size. |
| ☐ | Memory | 1 GB | Each worker of the web server uses about 170 MB. The tool starts one worker per processor, from 2 to 4. |
| ☐ | Disk | 5 GB | Each backup is a full copy of the database and of the evidence files. The tool keeps 14 backups by default. Plan the disk for the data and these copies. |
| ☐ | Database | SQLite, in the data volume. There is nothing to install. | PostgreSQL when more than about 20 people are active at the same moment |

## 2. Network

This table shows the network access to prepare. For the inbound access, choose one of the four “Inbound” lines:

| Ready | Need | Value |
|---|---|---|
| ☐ | Address | A domain name that points to the server, for example `reporting.example.com` |
| ☐ | Inbound, HTTPS with the Caddy proxy provided | TCP 80 and 443, and UDP 443, open from the Internet. Caddy gets a Let's Encrypt certificate automatically. |
| ☐ | Inbound, HTTPS with your own proxy and certificate | Your proxy sends the requests to TCP 8000 of the server, with the headers `X-Forwarded-Proto` and `X-Forwarded-For`. Use this option if the server is not reachable from the Internet. |
| ☐ | Inbound, HTTPS with Caddy and the certificate of your company | TCP 443 (and 80 for the redirect) from the internal network. The certificate with its full chain and its private key without a password, in PEM format (`./install.sh --cert --key`). No Let's Encrypt, no access from the Internet. |
| ☐ | Inbound, internal trial only | TCP 8000, over HTTP without encryption |
| ☐ | Outbound, installation and updates | From the server, TCP 443: `github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com` (files and their signed sums), `ghcr.io`, `pkg-containers.githubusercontent.com` (image), `tuf-repo-cdn.sigstore.dev` (signatures). If the installer installs Docker: also `download.docker.com` and the package mirrors of the system. With HTTPS (`--domain`): also Docker Hub (image of Caddy). With Git, the server builds the image: also Docker Hub and PyPI. Without Internet access: nothing, with the offline package of the release ([Install without Internet access](/docs/install-the-tool/#install-without-internet-access)). |
| ☐ | Outbound, automatic updates (optional) | On by default after an installation with one command. Every night, the server (not the tool) opens the same GitHub and Sigstore connections as the installation, TCP 443. To install without them, add `--auto-update off` ([Automatic updates](/docs/update-the-tool/#automatic-updates)). |
| ☐ | Outbound, emails | The SMTP server, on its port: 587 for `starttls`, 465 for `ssl` |
| ☐ | Outbound, company sign-in (optional) | Your OpenID Connect identity provider, TCP 443, only if a space manager turns company sign-in on. Set `PUBLIC_URL`, and register the tool at the provider ([Single sign-on](/docs/single-sign-on/)). |
| ☐ | Internal certificate authority | If the email server, or a proxy that inspects HTTPS, has a certificate of an internal authority: the certificate of that authority in PEM format (`./install.sh --ca-cert`). |

## 3. Email account (SMTP)

The tool sends the reminders, the email alerts, and the test email with an SMTP account. Without it, the tool sends
no email. Give these settings to a space manager (the first administrator account is one), who enters them in
**Administration › Settings › Hosting**. Or put them in `.env` yourself. This table shows what to give:

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
| ☐ | External copy of the backups | A place off the server that only IT can open: the archives contain confidential data and the password hashes. Choose one way. **The tool copies each backup itself**: give a space manager an S3-compatible bucket (address, region, bucket, access key ID, secret access key) or an SFTP account (server, port, username, password or private key, folder, SHA-256 fingerprint of the key of the server). Open the port of the destination from the server: 443 or the port of the address for S3, 22 by default for SFTP. **Or you copy** the folder `/data/backups`, with all its subfolders, on a schedule. See [Install Probant](/docs/), “Copy the backups outside the server”. |
| ☐ | Health check | Give the mailbox that must receive the email alerts of the tool (failed backup, disk almost full, stopped task…). On a new installation, they are on from the start (**Administration › Settings › Health**). If you have a monitoring tool, also add a monitor on `GET /sante/`: `200` means that the tool works, `503` means a problem. Only this monitor warns you when the server is off. |
| ☐ | Nightly data check | Nothing to set: a late or failed night check is in the email alerts of the tool. With your own monitoring, you can also alert when `controle_donnees.etat` is `late` in the details of `/sante/`. |
| ☐ | Logs | Set the rotation of the Docker logs. The tool does not set it. |

## 5. Who does what

This table shows each task, who does it, and how long it takes:

| Task | Who | Time |
|---|---|---|
| Prepare the server, the domain name, the firewall, and the SMTP account | IT | Depends on your procedures |
| Check the server before the installation (`get.sh --check` or `./install.sh --check`: it changes nothing) | IT | A few seconds |
| Install the tool (`get.sh`, or `./install.sh` with Git) | IT | About 2 minutes (3 to 5 with Git) |
| Or deploy the tool on Clever Cloud | IT | About 30 minutes |
| Create the administrator account (step 1 of the **Setup** wizard) | IT or the administrator of the tool | Right after the installation |
| Do the other 7 steps of the wizard: **Your organisation**, **Languages**, **Organisation**, **Frameworks**, **KPI sheet**, **Team**, **First campaign** | Administrator of the tool | Depends on the number of organisations and KPIs. The administrator can stop and continue later. |
| Set up the email server in the tool, and send a test email (**Administration › Settings › Hosting**) | Space manager, or IT in `.env` | Not measured |
| Set up company sign-in (optional): the application at the provider, then **Administration › Settings › Company sign-in** | IT and a space manager | Not measured |
| Create the accounts and give the roles | Administrator of the tool | Not measured |
| Copy the backups off the server, if the tool does not do it | IT | On a schedule |
| Update the tool (`./update.sh`), or let the automatic updates of the server do it | IT | 1 to 3 minutes |
| Restore a backup | IT, or the administrator of the tool from the **Hosting** page | A few seconds |

## 6. Steps

To install the tool, do these steps. [Install Probant](/docs/) gives the details of each step, and the
section numbers below are those of that guide:

1. Prepare the items of sections 1 to 4 of this page.
2. Check the server, then install the tool with one command and `--domain reporting.example.com`
   (section 2). On Debian and Ubuntu, if Docker is missing, the installer offers to install it.
3. Open the address of the tool, and create the administrator account right away (section 3). Until this step is
   done, the first person who opens the address creates this account.
4. Give the SMTP settings to a space manager (the administrator of step 3 is one), or add them to `.env`, then send
   a test email (section 7).
5. Give a space manager the destination for the copy of the backups, or schedule the copy of `/data/backups` off
   the server yourself (section 5).
6. Connect your monitoring to `/sante/` (section 9).
7. Give the address to the administrator of the tool, who does the rest of the setup.
