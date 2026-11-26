---
title: "Overview"
description: "This guide is for the IT team. It tells you how to install Probant on a Linux server with Docker, then how to set it up, back it up, update it, and monitor…"
order: 0
group: "Get started"
source: "docs/installation.md"
---

This guide is for the IT team. It tells you how to install Probant on a Linux server with Docker, then how to set it
up, back it up, update it, and monitor it. You do not need to know Django or Python.

The tool runs in **a single Docker container**. All its data is in **a single volume**, `/data`: database, evidence
files, logo, backups, and secret key.

This table shows which way to follow:

| Your case | Follow | Duration |
|---|---|---|
| A Linux server with Internet access (the usual case) | [Install with one command](/docs/install-the-tool/#install-with-one-command) | About 2 minutes |
| You want the server to build the image from the code | [Install with Git](/docs/install-the-tool/#install-with-git) | 3 to 5 minutes |
| A server without Internet access | [Install without Internet access](/docs/install-the-tool/#install-without-internet-access) | |
| You do not want to manage a server | [Managed hosting (Clever Cloud)](/docs/managed-hosting/) | About 30 minutes |
| A trial by one person on one Windows or Mac computer | The all-in-one version: `probant-windows.zip` or `probant-mac.zip` on the page of the latest release (https://github.com/Probant-Reporting/probant/releases/latest). It needs no installation and no administrator rights. To move its data to a server later, see [From the all-in-one version to a server](/docs/from-pc-to-server/). | |

Before you start, you need a 64-bit Linux server with 1 GB of memory, and an account that can use `sudo`. On Debian or
Ubuntu, you do not have to install Docker first: the installer offers to install it. The full list is in section 1.
The list of what IT prepares is in [What to prepare](/docs/it-request/), and the file for a security review is in
[Security overview](/docs/security-overview/).

Right after the installation, open the address of the tool and create the administrator account (section 3).

This table shows the everyday operations, in the folder of the tool:

| Operation | Command | Duration |
|---|---|---|
| Update | `./update.sh` | 1 to 3 minutes |
| Back up | Nothing: automatic every night. Now: `docker compose exec web python manage.py backup` | A few seconds |
| Restore | `docker compose exec web python manage.py restore <archive>` | A few seconds |
