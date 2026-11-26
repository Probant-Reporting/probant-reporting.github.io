---
title: "Security overview"
description: "This document describes how Probant protects the data, for a security review before the installation. You can send it to your IT and security teams as it is."
order: 0.6
group: "Before you install"
source: "docs/security_overview.md"
---

This document describes how Probant protects the data, for a security review before the installation. You can send it
to your IT and security teams as it is.

Each point describes the tool as it is. When the tool does not do something, the document says so. The questionnaire at
the end gives a short answer to the usual questions of a security team.

Related documents:

- [What to prepare before you install Probant](/docs/it-request/): the list for IT
- [Install Probant](/docs/): installation, settings, backups, updates, and monitoring
- [Security policy](https://github.com/Probant-Reporting/probant/blob/main/SECURITY.md): how to report a vulnerability
- Spaces: several departments in one installation

> This copy leaves out one optional feature, off by default, that this site does not present. The complete document is `docs/security_overview.md` in the repository of the tool.

## 1. Architecture

Probant is a web application (Python 3.12, Django 5.2, a long-term support line). Your company installs it on its own
server with Docker, or on its own account with a managed hosting provider. The people who develop Probant do not host
it and have no access to it.

This diagram shows a Docker installation with all its parts:

```text
 People (web browser)                       AI assistants (MCP, optional, off by default)
        |  HTTPS, TCP 443 (TCP 80 for the certificate and the redirect)
        v
 +----------------------------- Server of your company -----------------------------+
 |  caddy  (optional, "https" profile): HTTPS, Let's Encrypt certificate            |
 |     |  HTTP, internal Docker network                                             |
 |     v                                                                            |
 |  web  (Probant: gunicorn and Django, user 1000, port 8000)                       |
 |     |-- volume /data: databases (SQLite), evidence files, logo, backups,         |
 |     |   secret key, sign-in counters                                             |
 |     '-- db  (optional, "postgres" profile): PostgreSQL 16, internal network only |
 +----------------------------------------------------------------------------------+
        |  outbound: SMTP server (if set), external copy of the backups (if set),
        |  identity provider (if company sign-in is on)
        v

 Timer of the server (optional, outside the containers): auto-update.sh, automatic updates
```

This table shows the parts of the installation:

| Part | Content |
|---|---|
| `web` container | The tool: gunicorn web server, Django, static files served by WhiteNoise. The same container runs the background tasks: automatic backups, reminders, nightly data check, and large imports and exports. |
| `/data` volume | All the data of the tool: databases (with SQLite), evidence files, logo, backups, secret key, and sign-in counters |
| `caddy` container (optional) | HTTPS proxy in front of the tool (`https` profile), with an automatic Let's Encrypt certificate, or with the certificate of your company (`HTTPS_CERTIFICATE=files`): then Caddy never contacts Let's Encrypt |
| `certificates/` folder | The certificate of your company and its private key (`https/`, read by Caddy only, never by the tool, never in a backup), and the certificate authorities of your company for the outgoing connections (`ca/`, read only) |
| `db` container (optional) | PostgreSQL 16 (`postgres` profile). The tool can also use your own PostgreSQL server, or SQLite (default). |
| Timer of the automatic updates (optional) | `auto-update.sh`, run by systemd or cron on the server, outside the containers. It reads the choice made in the tool in a file of the data volume, and writes its result there. See section 10. |
| Managed hosting (option) | On Clever Cloud: a Python application, a PostgreSQL add-on, and an FS Bucket for the files. Clever Cloud provides HTTPS. See [Managed hosting](/docs/managed-hosting/). |

With Docker, the tool runs in one `web` container on one server. The tool has no high-availability mode: if the
server stops, the tool stops.

One installation can serve several departments, each in its own **space**. Each space has its own database. A shared
registry holds the accounts, the list of spaces, the access, and the sessions. See Spaces.

## 2. Data that the tool keeps

### Business data

The tool keeps the frameworks, the KPIs, the organisations, the campaigns, the values, the comments, the
justifications of alerts, and the evidence files (PDF, JPG, or PNG). An evidence file can contain personal data: the
person who adds it is responsible for its content.

### Personal data

This table shows the personal data that the tool keeps, and for how long:

| Data | Content | How long |
|---|---|---|
| Account | Name, email address, username, role, team, language, date of the last sign-in. For a reader or an auditor, the organisations that they can see. | As long as the account exists. An account that was never used can be deleted. After a first use, it is deactivated instead, so that the history stays complete. |
| Password | Only its hash (PBKDF2 with SHA-256, the Django default) | Until the next change of password |
| History of changes | Who made each change, when, and the value before and after | No limit: the tool never deletes it |
| Sign-in history | Date, account, result (successful, failed, blocked), and method (password or company account). For a refused company sign-in, a short reason. Never the password, never a token, never the network address. For a username that matches no account, only a short HMAC reference, never the text typed. | 180 days by default, from 1 to 730 days (**Administration › Settings › Hosting**) |
| Sign-in counters | A hash of the username and of the network address, to block repeated failures | 15 minutes after the last failure |
| Link to a company account | When company sign-in is on: the identifier (`sub`) that the identity provider gives to the person, the address of the provider, and the dates of the link and of the last sign-in | Until a space manager removes the link. A restore of the shared registry removes all the links. |
| Sessions | The session of each signed-in person, with their choices (language, campaign, organisation shown) | 12 hours without activity at most. The nightly clean-up erases the expired sessions. |
| Reminders sent | Who received a reminder, who sent it, and when | As long as the account of the person exists |
| Deleted items (trash) | A saved export, KPI list, or Visualisation view that a person deleted, with the name of the person | 30 days by default, from 1 to 365 days |
| Backups | A copy of all the data above, and of the evidence files | 14 backups by default (number and frequency set in **Administration › Settings › Hosting**) |
| Server log | For each request: the network address, the page, the code, and the duration. When a sign-in is blocked: the username typed and the network address. | Set by IT in Docker. The tool does not rotate the log. |

Each person can read the page **Data and privacy** of the tool, also without signing in. The page lists the same
data, from the real settings of the installation. An administrator adds the statement of the company (data
controller, data protection officer) in **Administration › Settings › Identity**.

An administrator can correct the name, the email address, and the team of a person. An administrator can delete the
evidence files of the sensitive KPIs in **Administration › Evidence to delete**. The backups that already exist keep
these files until the tool replaces them.

### No telemetry

The tool sends no usage data, no statistics, and no error reports, to the people who develop it or to any other
service. It does not check for updates by itself: the automatic updates are a task of the server (section 10). The pages load nothing from another site: no font, no script, no
analytics.

## 3. Network flows

This table shows each inbound flow:

| Port | Protocol | When | Purpose |
|---|---|---|---|
| TCP 443, UDP 443 | HTTPS | With the Caddy proxy (`https` profile) | Access to the tool. UDP 443 is for HTTP/3. |
| TCP 80 | HTTP | With the Caddy proxy | Validation of the Let's Encrypt certificate (not with the certificate of your company), and redirect to HTTPS |
| TCP 8000 (`HTTP_PORT`) | HTTP | Always | The port of the tool. With the Caddy proxy, it is open only to the server itself (`127.0.0.1:8000`). Without a proxy, it is open on every address of the server, with no encryption. |
| TCP 5432 | PostgreSQL | With the `postgres` profile | Not published. Only the `web` container reaches it, on the internal Docker network. |

The server for AI assistants (MCP) adds no port: it is at the address `/mcp/` of each space, on the same port and behind
the same HTTPS. It stays off until an administrator turns it on in **Administration › Settings › Assistants**.

This table shows each outbound flow:

| Destination | Port | When | Purpose |
|---|---|---|---|
| Your SMTP server | `SMTP_PORT` (587 by default, 465 with `ssl`) | Only if an email server is set (in **Settings › Hosting**, or `SMTP_HOST`) | Reminders, email alerts about the health of the installation, and test email |
| Your destination for the external copy of the backups: S3-compatible storage, or SFTP server | The port of the address (443 by default with https), or the SFTP port (22 by default) | Only if an administrator sets a destination in **Settings › Hosting › External copy** | Copy of each new backup and of the backup of the shared registry, a few seconds after it is made; test file when the administrator tests the destination; deletion of the old copies only if the administrator asks for it. The address is the one that the administrator enters: never the server itself, a link-local address (cloud metadata), or a reserved address. Internal addresses (NAS, MinIO) are accepted. With `HTTPS_PROXY`, a public S3 service is reached through the proxy. SFTP needs a direct connection. |
| Let's Encrypt | TCP 443 | With the Caddy proxy and the automatic certificate only | Get and renew the certificate. Never with the certificate of your company. |
| Your identity provider (OpenID Connect) | TCP 443 | Only when company sign-in is set: when a person clicks the button, when the provider sends the person back, and when a space manager checks or saves the settings | Settings and signing keys of the provider, and exchange of the code for the ID token. HTTPS only, no redirect followed, JSON of 1 MB at most, 5 seconds at most for each call (`COMPANY_SIGN_IN_TIMEOUT`). Never the server itself, a link-local address (cloud metadata), or a reserved address. |
| Your PostgreSQL server | The port of `DATABASE_URL` | Only if `DATABASE_URL` points to an external server | Database |
| `github.com`, `raw.githubusercontent.com`, `objects.githubusercontent.com`, `release-assets.githubusercontent.com`, `ghcr.io`, `pkg-containers.githubusercontent.com`, `tuf-repo-cdn.sigstore.dev` | TCP 443 | From the server, only during the installation and the updates | Get the files of the version and the signed list of their sums, the published image, and the container of cosign. Verify the signatures (trusted root of Sigstore). |
| Docker Hub, PyPI | TCP 443 | From the server, only when the server builds the image (installation with Git) | Base images and Python packages |

There is no other flow. With company sign-in
off, it opens no connection to an identity provider. With the offline package (`./install.sh --offline`,
`./update.sh --offline`), the installation and the updates download nothing.

With the automatic updates (section 10), the server itself, not the container of the tool, opens these outbound
flows every night:

| Destination | Port | When | Purpose |
|---|---|---|---|
| `github.com`, `raw.githubusercontent.com` | TCP 443 | Every night, if the timer is set up | Find the latest published version and download its files |
| `objects.githubusercontent.com`, `release-assets.githubusercontent.com` | TCP 443 | When there is a new version to install | Download the list of the SHA-256 sums of its files, attached to its release |
| `ghcr.io`, `pkg-containers.githubusercontent.com` | TCP 443 | Every night, if the choice is not “Off” | Download the new image, and the official container of cosign |
| `tuf-repo-cdn.sigstore.dev` | TCP 443 | When there is a new image | Trusted root of Sigstore, to verify the signature of the image |

## 4. Authentication and sessions

- **Password.** Each person signs in with their email address or username, and a password. The administrators create
  the accounts in the tool.
- **Company sign-in (single sign-on).** OpenID Connect, with any standard provider (for example Microsoft Entra ID,
  Google, Okta, or Keycloak). It is off by default. A space manager sets it up for the whole installation, in
  **Administration › Settings › Company sign-in**. See [Single sign-on](/docs/single-sign-on/).
  - The provider only proves who the person is. The tool finds the account by the email address, which the provider
    must declare verified. The tool creates no account and takes no role from the provider.
  - Flow: authorization code with PKCE (`S256`), a single-use `state` (10 minutes), and a `nonce`. Only asymmetric
    signatures of the ID token (RS, PS, and ES algorithms), checked with the published keys of the provider. `iss`,
    `aud`, `exp`, and `iat` are checked.
  - When it is on, only the space managers keep their password, as rescue accounts, unless a space manager allows the
    password for everyone. A person that the company blocks at the provider can then no longer sign in.
  - When company sign-in is on, a session opened with a password follows the same rule as a new sign-in.
  - After 30 refused company sign-ins in 15 minutes from one network address, the button is refused from this address
    for 15 minutes.
  - IT can turn it off for the whole installation (`COMPANY_SIGN_IN=off`): everyone can use their password again.
  - The tool does not support SAML or LDAP. It reaches Active Directory only through an OpenID Connect provider.
- **Multi-factor authentication.** The tool has none of its own. With company sign-in, the identity provider applies
  its own multi-factor authentication. A sign-in with a password has no second factor.
- **Password rules.** A password has at least 8 characters, is not too similar to the name, the username, or the email
  address, is not a common password, and is not only digits. These rules are fixed. Passwords do not expire.
- **Temporary password.** An administrator gives a new account a random temporary password. Until the person changes
  it, the tool opens only **My account**.
- **Blocking of repeated failures.** The tool refuses the sign-in for 15 minutes after one of these limits:
  - 5 failures for the same username from the same network address
  - 50 failures from the same network address, all usernames together
  - 20 failures on the same account, from all addresses
- Every failed sign-in with a password gives the same message, whatever the cause. It does not tell if the account
  exists. The limits also apply to the expert mode (`/admin/`). All the processes of the server share the counters,
  and the counters stay after a restart.
  Known and accepted drawback: a person who knows a username can block the password sign-in of that account for
  15 minutes.
- **Change of password.** In **My account**, the person enters the current password. After 5 wrong current passwords,
  the tool does not check it for 15 minutes.
- **Sessions.** The server keeps the sessions in the shared registry. The session cookie is `HttpOnly`, `SameSite=Lax`,
  and `Secure` over HTTPS. Without activity, a session ends after 12 hours. Signing out ends it at once. The cookie
  stays when the browser closes.
- **Blocking an account.** An administrator deactivates an account in their space. A space manager can block the
  sign-in of a person in all the spaces at once.
- **Tokens of AI assistants (MCP).** Each person creates their own tokens, when an administrator turns the MCP server
  on. The tool keeps only the SHA-256 digest of each token. A token expires after 7, 30, or 90 days, never more than the
  maximum that the administrator sets (365 days at most). A token has the rights of its owner, read again at each
  request. A change of password revokes all the tokens of the person. When company sign-in is on, a person who
  cannot sign in with a password has no assistant access at all: no new token, and the earlier ones are refused.
  See MCP server.

## 5. Roles and isolation

Each account has one role in each space. This table shows the roles:

| Role | Rights |
|---|---|
| Administrator | Sets up the space: accounts, frameworks, organisations, campaigns, settings. Reads the history. |
| Validator | Validates the entries of the KPIs and organisations assigned to them, and of the organisations below them |
| Contributor | Enters the values assigned to them, adds the evidence, and validates the entry |
| Reader | Reads the Visualisation and the Dashboard. Never changes anything. |
| Auditor | Reads all that an audit needs: values, evidence, history, alerts, sign-in history. Never changes anything. |
| Space manager | Creates and archives the spaces, manages the access of people to each space, and changes the settings of the whole installation: company sign-in, email server, email alerts, automatic updates, external copy of the backups |

The administrator can limit a reader or an auditor to some organisations. The tool refuses every request that writes
from a reader or an auditor, before the page runs. The only exceptions change nothing but their own settings, such as
their password or their personal views.

The expert mode (`/admin/`), for administrators, shows the tables of the database and changes nothing.

The tool serves an evidence file only after it checks the rights of the person. There is no direct access to the files.

The spaces are separate:

- Each space has its own database and its own folder of files.
- An administrator of one space cannot change the email address, the name, or the password of a person who also
  works in a space where this administrator is not an administrator.
- All the spaces are at the same web address. A cross-site scripting flaw in one space would act in the other spaces
  of a person who has access to them. No such flaw is known.
- A space manager can take control of any account. Appoint only trusted people.
- Only a space manager can change the settings that apply to all spaces (email server, external copy of the
  backups, email alerts, automatic updates). The other administrators, also in the main space, only see them. The
  external copy receives the archives of all spaces and of the shared registry.

## 6. Encryption

This table shows what the tool encrypts, and what it does not:

| Item | Encrypted | Detail |
|---|---|---|
| Browser to the tool, with Caddy or your own HTTPS proxy | Yes | HTTPS. With `DJANGO_HTTPS=1`: redirect to HTTPS, HSTS (1 year with the subdomains by default), secure cookies. |
| Browser to the tool, without a domain name | No | HTTP on port 8000. Use it only on an internal network, or for a trial. |
| Tool to the SMTP server | Your choice | `SMTP_SECURITY`: `starttls` (default), `ssl`, or `none`. With TLS, the tool checks the certificate of the server. |
| Tool to the identity provider | Yes | HTTPS only, with a check of the certificate. |
| Tool to the destination of the external copy | Yes, except `http` | S3: HTTPS with a check of the certificate; `http` is accepted only for an address of the internal network. Each request is signed (Signature Version 4): the secret key never leaves the server. SFTP: SSH, with the key of the server pinned: the tool shows its SHA-256 fingerprint at the first test, an administrator confirms it, and the tool then refuses any other key before it sends the password or the signature. |
| Certificates checked by the tool | Yes | Every outgoing connection checks the certificate of the server against the authorities of the system, and against the authorities of your company that IT adds (`certificates/ca/`, `EXTRA_CA_CERTS`). The tool never turns the check off. **Administration › Settings › Health** shows the added authorities and their expiry dates. |
| Tool to PostgreSQL | Not set by the tool | The tool sets no TLS option for this connection. With the `postgres` profile, the connection stays on the internal Docker network. |
| Databases, evidence files, logo | No | The tool does not encrypt them. |
| Backups (`.zip` archives) | No | The tool signs them, but does not encrypt them. This is also true of the copies that the tool sends to the destination of the external copy. |
| Secrets saved in the tool: password of the email server, secret key or password or private key of the external copy, client secret of company sign-in | Yes | Encrypted with keys derived from the secret key of the installation: HMAC-SHA256 in counter mode, then sealed with HMAC-SHA256 (email server, external copy), or Fernet, that is AES-128-CBC with HMAC-SHA256, with a key derived by HKDF (company sign-in). The secrets of the email server and of the external copy are bound to their field: a secret copied into another field cannot be read. The tool never shows them again, and never writes them in the history, the log, the exported configuration file, or the archive of a space. On another server, or after a change of the secret key, they cannot be read: they must be entered again. |
| Secret key, `.env` file | No | Readable only by the user of the tool (files `0600`). `install.sh` makes the `.env` file readable only by its owner. |
| Certificate and private key of your company for HTTPS (`certificates/https/`) | No | Key in mode `0600`, in a folder in mode `0700`, outside the data volume. Caddy reads it. The container of the tool never receives it, so no backup contains it. |
| Passwords, MCP tokens | Hashed | A hash cannot be turned back into the password or the token. |

**Encryption at rest is the responsibility of IT**: encryption of the disk or of the volume of the server, or the
encryption that the hosting provider gives. The tool protects its files with the rights of the system only: the tool
runs as user 1000, and creates its files with mode `0600` and its folders with mode `0700`.

The secret key of the installation signs the sessions and the backups. The tool creates it at the first start, in
`/data/.secret_key`, unless IT gives it in `DJANGO_SECRET_KEY`. The all-in-one version (Windows, Mac) also creates its
own key at its first start. The tool does not use a key management service or a hardware security module.

## 7. Backups and restore

- **Automatic.** By default, the tool makes a backup every day at 02:30 and keeps 14. An administrator sets the
  frequency (6 hours, 12 hours, day, week), the time, and the number kept.
- **Content.** The whole database of the space, its evidence files and logo, and a description.
- **Never in a backup**: the MCP tokens, the secret key, the files of the large
  exports, the settings of company sign-in and the links to company accounts, and the folder `certificates/`.
- **Passwords.** The archive of a space contains no password hashes. The backups of the shared registry, in
  `/data/backups/shared/`, contain them. The tool never lists them and never lets anyone download them.
- **Signature.** The tool signs each archive with HMAC-SHA256, with a key derived from the secret key. The page
  **Administration › Settings › Hosting** restores only the archives of this installation, unchanged. IT can restore
  another archive from the command line, with the option `--unsigned`.
- **Safe restore.** A restore first backs up the current state. If a restore stops halfway, the tool finishes it at
  the next start. A restore deletes all the MCP tokens of the space.
- **Updates.** `./update.sh` backs up each space before it changes anything.
- **External copy.** IT copies `/data/backups` off the server, on a schedule. Or an administrator sets a destination
  in **Settings › Hosting › External copy** (S3-compatible storage or SFTP server): the tool then copies each new
  archive of each space and of the shared registry, and catches up after a failure. The copies contain the password
  hashes and the encrypted secrets: the destination must be private, and only IT may open it. By default, the tool
  deletes nothing at the destination. If the administrator sets a number of copies to keep, the tool deletes only the
  older archives that it made itself (folder and name that it recognises). A failure of the copy sends an email alert
  (if the alerts are on) and appears in **Settings › Health** and in `/sante/` (`external_copy`).

## 8. Logs and traceability

| Record | Content | Who reads it |
|---|---|---|
| History of changes | Each change of values, validations, evidence, campaigns, frameworks, organisations, accounts, and settings: who, when, before, and after. The tool never deletes it. Changes made by an AI assistant show “(via MCP)”. | Administrators and auditors, with an Excel export |
| Sign-in history | See section 2. Each line shows the method: password or company account. | Administrators and auditors of the space. Each person sees their own last sign-ins in **My account**. |
| Restores | When, which backup, and who did it. Kept outside the database. | Administrators and IT |
| Server log | Startup, each request, backups, errors, blocked sign-ins, refused MCP tokens. Always in English, on the standard output of the container (`docker compose logs web`). | IT |

An auditor limited to some organisations sees only the lines about the values of these organisations.

The tool can send email alerts about the health of the installation (failed or late backup, disk almost full, stopped
background task, failed emails, failed external copy, automatic updates…). They are on from the start on a new
installation. On an installation that existed before them, they stay off until a space manager turns them on in
**Settings › Health**. The email says what happens and what to do: no data, no folder of the disk. Changes of this
setting and test alerts are in the history of changes.

The tool has no connector for a SIEM. To collect the server log, use the log driver of Docker.

## 9. Browser protections

The tool sends these headers:

| Header | Value |
|---|---|
| `Content-Security-Policy` | Scripts and styles of the tool only, each inline script or style with a random token per request. No `unsafe-eval`. Nothing loads from another site. No frame, no object. `frame-ancestors 'none'`. Style attributes are allowed (`style-src-attr 'unsafe-inline'`). |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `same-origin` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Strict-Transport-Security` | When `DJANGO_HTTPS=1`: 1 year, with the subdomains, by default |

Other protections:

- Each form has a CSRF token (Django).
- The tool refuses a request for an address that is not in `DOMAIN` (error 400).
- The tool shows the texts of people escaped. Texts in Markdown are rendered without HTML, and a link accepts only
  `http`, `https`, or `mailto` addresses.
- Evidence files and the logo have their own, stricter policy: no script runs, even in a file that hides active
  content.
- An evidence file must be PDF, JPG, or PNG, with a content that matches its extension, and 5 MB at most by default.
  **The tool does not scan files for malware.**
- The tool refuses a request that is too large before it reads it, and an Excel file that is too large once
  uncompressed before it opens it.
- `CONTENT_SECURITY_POLICY_MODE=report-only` turns off the blocking of the policy, to find the cause of a broken
  screen. Use it only for the time of the check.
- Over HTTPS, `python manage.py check --deploy` reports no warning.

## 10. Dependencies and updates

- **Pinned versions.** `requirements.txt` gives the exact version of each Python package of the image. Two
  installations made months apart run the same software.
- **Known vulnerabilities.** `pip-audit` checks these packages on GitHub at each change of the main branch and at each
  pull request. The check informs, and does not block.
- **Django** stays on a long-term support line.
- **Cryptographic libraries.** Company sign-in uses PyJWT and cryptography. The copy to an SFTP server uses paramiko
  (with bcrypt and PyNaCl). The copy to S3 and the encryption of the email password use the standard library of
  Python only. The all-in-one version has none of these packages, and neither company sign-in nor the external copy.
  The licences are in Third-party libraries.
- **Signed image.** Each published image, from version 1.1.0, is signed with cosign, without a key. The certificate
  names the workflow `image.yml` of the public repository and the tag of the version. The SBOM (SPDX JSON) is attached
  to the image as a signed attestation. The release has the SBOM and a report of the known vulnerabilities (Grype).
  See [Verify the image](/docs/install-the-tool/#verify-the-image).
- **Offline package.** For a server without Internet access, the release has a signed package: the image of the tool,
  the image of Caddy, and the files, with their SHA-256 sums. The installer checks each file before any change. See
  [Install without Internet access](/docs/install-the-tool/#install-without-internet-access).
- **Corrections.** A security correction is a new version of the tool. IT applies it with `./update.sh`, which backs
  up the data first, or the automatic updates apply it. Only the latest version receives security corrections. The
  changes of each version are in `CHANGELOG.md`.
- **Automatic updates.** After an installation with one command, a timer of the server (`auto-update.sh`, set up by
  `./install.sh --auto-update on`, removed by `--auto-update off`) installs each new version at night, 3 days after
  its publication by default. The administrators choose “automatic”, “notify only” or “off”. The script compares
  image digests, never version numbers. It installs only an image whose signature it verified with cosign (official
  container pinned by its digest): the identity of the workflow `image.yml` of the public repository for the tag of
  the version, and the GitHub OIDC issuer. No verified signature: nothing is installed. The timer runs on the server,
  outside the containers. It backs up each space first, and goes back to the previous image and files if the new
  version does not respond, with a restore of the
  “before-update” backup of each database that changed. A version that changes the shared registry of the accounts
  is never installed automatically. The container of the tool never reaches Docker nor the Internet: it only reads
  the result of the task in a file of the data volume, with a strict format. See
  [Automatic updates](/docs/update-the-tool/#automatic-updates).
- **Files of the installation.** The release of each version has the list of the SHA-256 sums of the files that the
  installer and the updates download, signed by the same workflow as the image. `get.sh`, `update.sh` and
  `auto-update.sh` check each file against it before any file is put in place, and verify the signature of the list
  (always in `auto-update.sh`, when cosign or Docker is on the server for the other two). No list, or one file that
  does not match: nothing changes. See [Install with one command](/docs/install-the-tool/#install-with-one-command).
- **Report a vulnerability** in private on GitHub, as [`SECURITY.md`](https://github.com/Probant-Reporting/probant/blob/main/SECURITY.md) explains. The maintainers confirm
  the receipt in 7 days or less, and give their assessment in 30 days or less.

## 11. Shared responsibilities

This table shows who is responsible for each part:

| Part | IT of the company | Administrators of the tool | Maintainers of Probant |
|---|---|---|---|
| Server, operating system, Docker, security updates of the system | Yes | | |
| Network, firewall, domain name, HTTPS certificate (or your proxy) | Yes | | |
| Encryption of the disk | Yes | | |
| SMTP account | Yes | | |
| Identity provider for company sign-in: application, assigned people, multi-factor authentication, blocking a person | Yes | Yes (settings in the tool) | |
| Certificate of your company for HTTPS, and certificate authorities of your company (`./install.sh --cert --key`, `--ca-cert`) | Yes | | |
| Verification of the signature of the image or of the offline package before an installation by hand | Yes | | |
| External copy of the backups: destination and its account, retention of the copies | Yes | Yes (destination set in the tool) | |
| Rotation and retention of the server log | Yes | | |
| Monitoring of `/sante/`, in addition to the email alerts of the tool (it also warns when the server is off) | Yes | | |
| Email alerts about the health of the installation: turn on, recipients | | Yes | |
| Application of the updates (`./update.sh`), or the timer of the automatic updates (`./install.sh --auto-update`) | Yes | | |
| Choice of the automatic updates: automatic, notify only, off, wait after the publication | | Yes | |
| Accounts, roles, and access to the spaces | | Yes | |
| Settings: backups kept, sign-in history, trash, MCP server | | Yes | |
| Statement of the company on the page **Data and privacy** | | Yes | |
| Code of the tool and security corrections | | | Yes |
| Answers to vulnerability reports ([`SECURITY.md`](https://github.com/Probant-Reporting/probant/blob/main/SECURITY.md)) | | | Yes |

The maintainers have no access to the installations and receive no data from them.

## 12. Security questionnaire

This table gives a short answer to the usual questions of a security review:

| # | Question | Answer |
|---|---|---|
| 1 | Is the tool certified ISO 27001, SOC 2, or similar? | No. |
| 2 | Did a third party do a penetration test? | No. |
| 3 | Is there a bug bounty programme? | No. |
| 4 | Is there a process to report a vulnerability? | Yes. A private report on GitHub, see [`SECURITY.md`](https://github.com/Probant-Reporting/probant/blob/main/SECURITY.md). |
| 5 | Is the source code available? | Yes. The code is open source, under the licence AGPL-3.0-or-later. |
| 6 | Is there a contract with a service level (SLA)? | Not provided by the open-source project. [`SECURITY.md`](https://github.com/Probant-Reporting/probant/blob/main/SECURITY.md) gives the target times for a vulnerability report. |
| 7 | Who operates the tool? | Your IT team, on your server or on your account with a hosting provider |
| 8 | Where is the data? | On the server or the hosting account that you choose |
| 9 | Does the tool send data to the maintainers or to other services? | No. Only to your SMTP server, to the destination of the external copy of the backups if one is set, and to your identity provider if company sign-in is on. |
| 10 | Is there telemetry, analytics, or content from another site? | No. |
| 11 | Is the data of other customers in the same installation? | No. Each company has its own installation. |
| 12 | Single sign-on (SAML, OpenID Connect), LDAP, or Active Directory? | Yes, OpenID Connect, off by default, without automatic creation of accounts. No SAML and no LDAP. Active Directory only through an OpenID Connect provider (section 4). |
| 13 | Multi-factor authentication? | Not in the tool. With company sign-in, through the identity provider. A sign-in with a password, for example by a rescue account, has no second factor. |
| 14 | Are the password rules configurable? | No. The rules are fixed: 8 characters at least, not similar to the account, not common, not only digits. |
| 15 | Do passwords expire? | No. |
| 16 | Is there a lockout after failed sign-ins? | Yes. 15 minutes, after 5, 20, or 50 failures (section 4). |
| 17 | Do sessions end automatically? | Yes. After 12 hours without activity. This duration is fixed. |
| 18 | Is there role-based access? | Yes. 5 roles in each space, and space managers (section 5). |
| 19 | Automatic provisioning of accounts (SCIM)? | No. The administrators create and deactivate the accounts in the tool, one by one or several at once. Company sign-in creates no account. |
| 20 | Is there a record of the sign-ins? | Yes. The sign-in history, 180 days by default, with the method of each sign-in. |
| 21 | Is there an API? | Yes. The MCP server for AI assistants, off by default, with personal tokens that expire. |
| 22 | Encryption in transit? | Yes, with HTTPS (Caddy, with a Let's Encrypt certificate or the certificate of your company, or your proxy) and HSTS. Without a domain name, the tool uses HTTP. |
| 23 | Encryption at rest? | Not by the tool. Use the encryption of the disk or of the hosting provider. |
| 24 | Key management (KMS, HSM)? | No. One secret key, in a file of the data volume or in a setting. |
| 25 | Which personal data does the tool keep? | Name, email address, username, role, team, language, sign-in dates, and the history of changes (section 2) |
| 26 | Is the retention of the data configurable? | Partly: sign-in history, trash, number of backups, and evidence of the sensitive KPIs. The history of changes is never deleted. |
| 27 | Can a person ask for the deletion of their data? | An administrator corrects the name, the email address, and the team. A used account is deactivated, not deleted, so that the history stays complete. |
| 28 | Can the data be exported? | Yes. Excel exports in the tool, and complete backups. |
| 29 | Protection against XSS, CSRF, and clickjacking? | Yes. Content security policy, CSRF tokens, `X-Frame-Options: DENY`, and escaped texts (section 9). |
| 30 | Controls on uploaded files? | Type checked on the content, size limited, files served with a strict policy. No malware scan. |
| 31 | Are the dependencies controlled? | Yes. Exact versions, and a `pip-audit` check on GitHub that informs and does not block. Each image has a signed SBOM and a report of the known vulnerabilities. |
| 32 | Is there automated security testing? | Automated tests check the rights of the roles, the isolation of the spaces, and the content security policy. There is no dedicated static analysis tool: `ruff` checks only mechanical defects. |
| 33 | Does the container run as root? | No. As user 1000. The code belongs to root, and the tool cannot change it. |
| 34 | Read-only file system or dropped capabilities for the container? | Not set in `docker-compose.yml`. |
| 35 | Which ports are open? | 80 and 443 with Caddy, or 8000 without it (section 3) |
| 36 | Are there backups? | Yes. Automatic, signed, not encrypted. IT copies them off the server, or the tool copies them itself to an S3-compatible storage or an SFTP server set by a space manager. |
| 37 | How much data can be lost (RPO)? | What was done since the last backup: 1 day by default, 6 hours at the shortest frequency |
| 38 | How long does a restore take? | A few seconds for the restore itself. The rebuild of a server from the external copy is documented, but its total time is not measured. There is no high availability. |
| 39 | Can the logs go to a SIEM? | Yes, with the log driver of Docker. The tool has no SIEM connector. It can send email alerts about the health of the installation (section 8). |
| 40 | How are the security corrections delivered? | As a new version of the tool, applied by IT with `./update.sh`, or at night by the automatic updates of the server (signed image only, backup before, automatic going back). Only the latest version receives corrections. |
