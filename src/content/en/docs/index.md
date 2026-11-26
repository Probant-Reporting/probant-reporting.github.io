---
title: "Overview"
description: "This guide tells you how to install, set up, back up, update, and monitor Probant with Docker. It is for the IT team. You do not need to know Django or…"
order: 0
group: "Get started"
source: "docs/installation.md"
---

This guide tells you how to install, set up, back up, update, and monitor Probant with Docker. It is for the
IT team. You do not need to know Django or Python.

The tool runs in **a single Docker container**. All its data is in **a single volume**, `/data`: database, evidence
files, logo, backups, and secret key.

This table shows the main operations:

| Operation | Command | Duration |
|---|---|---|
| Install, with one command | `curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh \| sudo sh` | About 2 minutes |
| Install, with Git | `./install.sh` (the server builds the image) | 3 to 5 minutes |
| Update | `./update.sh` | 1 to 3 minutes |
| Back up | Automatic every night, or `docker compose exec web python manage.py backup` | A few seconds |
| Restore | `docker compose exec web python manage.py restore <archive>` | A few seconds |

If you do not want to manage a server, see [Managed hosting (Clever Cloud)](/docs/managed-hosting/).
To move the data of the all-in-one version from a computer to a server, see [From the all-in-one version to a server](/docs/from-pc-to-server/).

Before the installation, the list of what IT prepares is in [What to prepare](/docs/it-request/), and the file for a
security review is in [Security overview](/docs/security-overview/).
