---
title: "Change the settings (.env file)"
description: "The settings are in the .env file. The .env.example file explains each line. To apply a change, run docker compose up -d. A setting with no value keeps its…"
order: 4
group: "Run"
source: "docs/installation.md"
---

The settings are in the `.env` file. The `.env.example` file explains each line. To apply a change, run
`docker compose up -d`. A setting with no value keeps its default value.

The tool still accepts the former French names of the settings (`DOMAINE`, `PORT_HTTP`, `SMTP_HOTE`…). They can be in
older `.env` files. Use the names in the table that follows.

This table shows each setting, its default value, and what it does:

| Setting | Default | Purpose |
|---|---|---|
| `DOMAIN` | IP address of the server (set by the installer) | The domain name or address that people use to open the tool. Separate several values with commas. The tool refuses any other address (error 400). |
| `DJANGO_HTTPS` | `0` | Set to `1` behind Caddy or another HTTPS proxy. This turns on secure cookies, redirection to HTTPS, and HSTS. |
| `HTTP_PORT` | `8000` | The port of the tool. To expose it only to the proxy, write `127.0.0.1:8000`. |
| `COMPOSE_PROFILES` | Empty | `https` adds Caddy. `postgres` adds PostgreSQL. For both, write `https,postgres`. |
| `DATABASE_URL` | Empty (SQLite) | The address of the PostgreSQL database. See section 8. |
| `DJANGO_SECRET_KEY` | Generated | The key that encrypts the sessions, signs the backups, and encrypts the secrets saved in the tool (password of the email server, secrets of the external copy, client secret of company sign-in). If it is empty, the tool creates it on first startup in `/data/.secret_key`. If you change it, the tool no longer accepts the backups made before in **Administration › Settings › Hosting**: restore them from the command line with `--unsigned`. The secrets saved in the tool must then be entered again. |
| `DJANGO_HSTS_SECONDS`, `DJANGO_HSTS_SUBDOMAINS`, `DJANGO_HSTS_PRELOAD` | 1 year, `1`, `0` | The HSTS settings. They apply when `DJANGO_HTTPS=1`. |
| `CONTENT_SECURITY_POLICY_MODE` | `enforce` | The content security policy of the pages. `enforce` blocks what the policy does not allow. `report-only` blocks nothing: the browser only reports, in its console, what it would block. See “Security, already active” below. |
| `SMTP_…` | Empty | Emails. When `SMTP_HOST` is set, these settings take priority over the email settings entered in the tool. See section 7. |
| `DEFAULT_LANGUAGE` | `en` | The language of a new installation (interface and contents): one of the seven languages of the interface (`en`, `fr`, `es`, `de`, `it`, `nl`, `pt`). The tool reads it only when it creates the database. Afterwards, change it in **Administration › Settings › Languages**. For a French installation, set `fr` before the first start. |
| `GUIDED_TOUR` | `on` | `off` removes the short guided tour that people see at their first sign-in. The tour only changes the display. |
| `TIME_ZONE` | `Europe/Brussels` | The time zone of the installation, as a name from the IANA list, for example `Europe/Paris` or `America/New_York`. The times of the automatic reminders, of the automatic backup and of the nightly data check, "today", and the dates in the exports and in the log use this time zone. **Administration › Settings › Hosting** shows it next to the server time. If the name is unknown, the tool does not start and the log shows the error. |
| `MAX_EVIDENCE_SIZE_MB`, `MAX_IMPORT_SIZE_MB` | `5`, `10` | The maximum size, in MB, of an evidence file and of an import file. |
| `MAX_BACKUP_UPLOAD_MB` | `2048` | The maximum size, in MB, of a backup that an administrator uploads in the tool (**Hosting** › **Restore**). The tool refuses every other request larger than the larger of `MAX_EVIDENCE_SIZE_MB` and `MAX_IMPORT_SIZE_MB` (plus 1 MB) before it receives it. With the HTTPS proxy, `CADDY_MAX_SIZE` (50 MB by default) also applies: increase it to upload a larger backup. |
| `MAX_XLSX_UNCOMPRESSED_MB` | 20 × `MAX_IMPORT_SIZE_MB` | The maximum size, in MB, of an Excel file once uncompressed. The tool refuses a larger file before it opens it. A cell text longer than 32,767 characters (the limit of Excel) is also refused. The same limits apply to the import commands that you run on the server (`import_kpi`, `import_organisations`, `import_valeurs`): to import a larger file with a command, increase `MAX_XLSX_UNCOMPRESSED_MB` for that run. |
| `BACKGROUND_IMPORT_ROWS` | `5000` | A value import (**Import / Export › Import values**) with more rows than this number runs in the background. The person sees a progress bar, and can leave the page and come back. The `run_imports --schedule` process runs these imports. The image starts it automatically, so you install nothing. `0` means never: every import runs within the page, which can last 120 s at most. |
| `DISK_ALERT_MB` | `100` | When the free space on the data disk is below this value, in MB, `/sante/` answers `503` (“disk almost full”). |
| `BACKUP_AUTO`, `BACKUP_TIME`, `BACKUPS_KEEP` | `1`, `02:30`, `14` | Starting values only. After that, you set these values in the tool, in **Administration › Settings › Hosting**: automatic backup on or off, frequency (6 h, 12 h, day, week), time, and number of backups kept. |
| `DATA_CHECK_TIME` | `03:30` | The time of the nightly data check and clean-up. The check reads the database and changes nothing. The clean-up erases the expired sessions and the deleted items older than the trash delay. See section 9. |
| `GUNICORN_WORKERS`, `GUNICORN_THREADS` | 1 worker per processor (2 to 4), `4` | Server capacity. A worker uses 1 processor at a time and about 170 MB of memory. The default suits a server with 2 to 4 processors. See “Capacity” in section 8. |
| `GUNICORN_TIMEOUT`, `GUNICORN_KEEPALIVE` | `120`, `75` | The longest time for a request, in seconds, and the time that an idle connection stays open. Keep `GUNICORN_KEEPALIVE` above the idle timeout of the proxy in front of the tool. The Caddy provided closes idle connections after 60 s. If the value is lower, a save can sometimes fail with error 502. |
| `DJANGO_LOG_LEVEL` | `INFO` | The level of detail of the log (`INFO`, `WARNING`, `ERROR`). |
| `IMAGE` | Empty (image built on the server) | The published image to use, for example `ghcr.io/probant-reporting/probant:latest`. |
| `HTTPS_CERTIFICATE` | Empty (automatic certificate) | `files`: Caddy serves the certificate of your company, from `certificates/https/`, and never contacts Let's Encrypt. `./install.sh --cert --key` sets it. See “Company network” in section 2. |
| `PUBLIC_URL` | Empty | The address of the tool, for example `https://reporting.example.com`, in the emails (reminders, email alerts) and in the redirect URI of company sign-in. Empty: the emails use the first value of `DOMAIN`, and company sign-in uses the address of the page. |
| `COMPANY_SIGN_IN`, `COMPANY_SIGN_IN_TIMEOUT` | `on`, `5` | `off` turns company sign-in off for the whole installation, whatever the space managers set: the button disappears and everyone can use their password. The timeout is the longest wait, in seconds, for each call to the identity provider. See “Sign-in with a company account” below. |
| `EXTRA_CA_CERTS` | `/etc/probant/ca` in the image | Without Docker only: the file or the folder of the certificate authorities of your company, for the outgoing connections. Separate several with `:`. With Docker, put the files in `certificates/ca/` (`./install.sh --ca-cert`). See “Company network” in section 2. |

## Security, already active

With no particular setting, the tool applies these protections:

- Debug mode is turned off.
- The server is gunicorn. It runs without root rights (user 1000).
- The code of the tool in the image (`/app`) belongs to root: the tool can read it but cannot change it. The tool
  writes only in the data folder (`/data`). Files and folders there are readable by the tool only (`0600` and
  `0700`).
- The archives of a space contain no password hashes, and the tool signs each archive. The page **Hosting** restores
  only the archives of this installation, unchanged.
- WhiteNoise serves the static files, with browser caching.
- The tool sends the pages compressed.
- The tool sends the headers `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy: same-origin`.
- Each page has a content security policy (`Content-Security-Policy` header). The browser runs only the scripts and
  the styles of the tool. A script or a style that comes from elsewhere does not run, even if someone puts it in a
  text. The page loads nothing from another site, and no other site can show it in a frame. The evidence files and the
  logo keep their own, stricter policy.
- A session expires after 12 hours.
- The tool serves the evidence files only after it checks the permissions. There is never direct access to them.
- After 5 failed sign-ins for the same identifier from the same address, the tool refuses sign-in for 15 minutes.
  It does the same after 50 failed sign-ins from the same address (all identifiers), and after 20 failed sign-ins on
  the same account from all addresses (the same person in every space; an unknown identifier is counted the same way,
  so the message does not tell whether the account exists). The message is the same for each limit. The limit applies
  to the sign-in page of the tool and to expert mode (`/admin/`). It never closes a session that is already open, and
  it does not stop the tokens of AI assistants (MCP), which do not use the password. Known and accepted drawback:
  somebody who knows the identifier of a person can block the password sign-in of this person on purpose for
  15 minutes. The server log has a line for each blocking.
- In **My account**, after 5 wrong current passwords, the tool does not check the current password for 15 minutes,
  even the right one, and says so. The session stays open. This count is per person, separate from the sign-in.
  All the server processes share these counts, and they stay after a restart: the tool keeps them in the
  `sign-in-attempts/` folder of the data folder. There is nothing to set up.
- The tool reads the address of the visitor from `X-Forwarded-For` only when `DJANGO_HTTPS=1`. Caddy or the other
  HTTPS proxy must add this header.

Over HTTPS, `python manage.py check --deploy` reports no warning.

If a screen does not work after an update (a button does nothing, a page has no colors), the content security policy
can be the cause. To find out:

1. In the `.env` file, set `CONTENT_SECURITY_POLICY_MODE=report-only`.
2. Restart the tool: `docker compose up -d`.
3. Open the screen again. If it works now, open the console of the browser (F12): each line that starts with
   `[Report Only]` names what the policy would block. Send these lines with the version of the tool.
4. When a corrected version is installed, remove the line or set `CONTENT_SECURITY_POLICY_MODE=enforce`, and restart.

With `report-only`, the protection is off: keep this value only for the time of the check.

## AI assistants (MCP): nothing to do

The tool includes a server for AI assistants (Model Context Protocol), at the address `/mcp/` of each space
(`/espace/<code>/mcp/` for another space). It runs in the same container, on the same port, behind the same HTTPS: there
is no service, no port, no variable and nothing to install. It stays off until an administrator turns it on in
**Administration › Settings › Assistants**. The only condition is that the reverse proxy passes the `Authorization`
header to the tool: Caddy (the `https` profile) and Clever Cloud do it without any setting. Assistant tokens are never in
the backups. The log of the tool shows the refused tokens (`serveur_mcp: MCP: token refused`). Details:
`docs/mcp.md`, section 7.

## Sign-in with a company account

People can sign in with their company account (single sign-on, OpenID Connect). It is off by default. A space manager sets it up in **Administration › Settings › Company sign-in**. What IT does:

| Item | Value |
|---|---|
| Network | Allow outgoing HTTPS (TCP 443) from the server to the identity provider. Nothing comes in. |
| Address | Set `PUBLIC_URL` in `.env`: the tool builds the redirect URI from it. |
| Rescue | If no space manager can sign in, set `COMPANY_SIGN_IN=off` in `.env`, then run `docker compose up -d`. Everyone can use their password again. |

Details: [Sign in with a company account](/docs/single-sign-on/).
