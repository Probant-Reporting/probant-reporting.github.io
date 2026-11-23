---
title: "Install the tool"
description: "Install the tool: a guide for IT teams, from the documentation of the tool."
order: 2
group: "Get started"
source: "docs/installation.md"
---

To install the tool:

1. Get the code and go to its folder:

   ```bash
   git clone https://github.com/Probant-Reporting/probant.git probant
   cd probant
   ```

2. Run the installer:

   ```bash
   ./install.sh                      # or: ./install.sh --domain reporting.example.com
   ```

   The script shows the address to open.

The script does these steps, in this order:

1. It checks that Docker responds.
2. It creates the `.env` settings file from `.env.example`. It does not replace an existing `.env` file.
3. It builds the image and starts the tool.
4. It waits for the tool to respond.
5. It shows the address to open.

This table shows the options of `./install.sh`:

| Option | Effect |
|---|---|
| No option | The tool opens over HTTP at `http://SERVER-ADDRESS:8000`. Use it for an internal network or a trial. |
| `--domain reporting.example.com` | The tool opens over HTTPS. The script adds Caddy in front of the tool, and Caddy gets the certificate automatically. Port 8000 is then open only to the server itself. |
| `--port 8080` | The tool uses another HTTP port. |

## Install without the script

To do the same installation by hand:

1. Create the settings file: `cp .env.example .env`.
2. Open the file (`nano .env`) and set at least `DOMAIN`.
3. Build and start the tool: `docker compose up -d --build`.
