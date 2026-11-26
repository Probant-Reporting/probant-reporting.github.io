---
title: "Install the tool"
description: "The two ways give the same tool, with the same settings and backups. Only the installation with one command sets up the automatic updates (section 6). For…"
order: 2
group: "Get started"
source: "docs/installation.md"
---

You can install the tool in two ways. This table compares them:

| Way | What the server needs, besides Docker | Duration |
|---|---|---|
| With one command (recommended) | `curl` | About 2 minutes: the server downloads the published image |
| With Git | Git | 3 to 5 minutes: the server builds the image |

The two ways give the same tool, with the same settings and backups. Only the installation with one command sets up
the automatic updates (section 6). For a server without Internet access, see “Install without Internet access”.

## Check the server before you install

You do not have to run this check yourself: the installer runs it at the start of a new installation. Run it before,
if you want to know what is missing without installing anything. The check reads the server and changes nothing. It
is the script `check.sh`, in the files of each version.

To check the server before an installation with one command, run the command of the installation with `--check`:

```bash
curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh | sudo sh -s -- --check
```

Add the options of the installation, for example `--domain reporting.example.com` or `--port 8080`. The command
downloads the check of the version into a temporary folder, runs it, then deletes the folder. In a folder with the
files of the tool (an installation with Git, for example), run `./install.sh --check`, with the same options.

This table shows what the check verifies:

| Check | What it verifies |
|---|---|
| System and architecture | Linux, 64-bit. The published image is for `x86_64`: on `arm64`, install with Git. |
| Docker and Compose | Docker Engine 24 or later, Compose plugin v2.24 or later (section 1). |
| Docker service | Docker responds, and the account has the right to use it (`sudo`, or the `docker` group). |
| Memory, processors, disk | At least 1 GB of memory, 1 processor, and 5 GB free in the folder of Docker. |
| Ports | The HTTP port is free (8000, or `--port`). With `--domain`: also ports 80 and 443. |
| Domain name | With `--domain`: the name points to an address of the server. |
| Network | The registry of the image and GitHub (files of the version) answer over HTTPS, through `HTTPS_PROXY` if it is set. With a proxy, it also checks that the Docker service can download the image. |
| Clock | The time of the server is right: at most 5 minutes from the time of GitHub. |

The check shows one line for each check:

- `OK`: nothing to do.
- `To fix`: the line says what to do, in one sentence.
- `Not checked`: the line says why. For example, a server behind a router (NAT) does not know its public address. The
  check cannot know if the domain name points to it. Check the DNS record and the router yourself.

At the end, the check shows `Ready`, or `Here is what is missing` with the list of the points to fix. It ends with the
exit code 0 (ready) or 1 (something is missing).

At the start of a new installation (a folder without `.env`), if a point is to fix, the installer stops and installs
nothing. A missing Docker does not stop it: the installer offers to install Docker next. To install without the
check, add `--skip-check`. Use this option only if you know why the check fails. For example, behind a proxy that the
check cannot use.

If the network uses a proxy, set it before the check: `sudo HTTPS_PROXY=http://proxy.example.com:3128 sh …`. With
`sudo`, the variables of your session do not pass to the script. Docker downloads the image itself: set the proxy of
the Docker service too (https://docs.docker.com/engine/daemon/proxy/).

## Install with one command

The command uses the published image of the tool, `ghcr.io/probant-reporting/probant`. The server does not build
anything, and it does not need Git.

To install the tool:

1. Sign in to the server with an account that can use `sudo`.
2. Go to the folder that will contain the folder of the tool (for example, `cd /opt`).
3. Run the command:

   ```bash
   curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh | sudo sh
   ```

   For HTTPS with a domain name, add the options after `sh -s --`:

   ```bash
   curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh | sudo sh -s -- --domain reporting.example.com
   ```

   The command shows the address to open and the folder of the installation.
4. Go to the folder of the tool: `cd probant`. Run the other commands of this guide in this folder.

> **Note:** The automatic updates are on after this installation: the server installs each new version at night,
> 3 days after its publication. To install without them, add `--auto-update off`. See “Automatic updates”
> (section 6).

The command does these steps, in this order:

1. It finds the latest published version of the tool.
2. It creates the folder `probant`. If this folder already contains an installation, the command stops and changes
   nothing.
3. It downloads into this folder only the files that run the tool: `docker-compose.yml`, `.env.example`,
   `install.sh`, `update.sh`, `check.sh`, `docker/Caddyfile` and `auto-update.sh`. They come from the tag of this
   version in the public repository (https://github.com/Probant-Reporting/probant), over HTTPS only.
4. It checks each file against the list of the SHA-256 sums (one fingerprint per file) attached to the release of
   this version (`probant-X.Y.Z-files.sha256`). The release is the page of the version on GitHub, with its files. The
   command also verifies the signature of this list with cosign (the signature tool of Sigstore), when cosign is on
   the server or when Docker responds. If the list is missing, if its signature is refused, or if one file does not
   match, the command stops and installs nothing. The command says what it verified.
5. It runs `./install.sh` with the published image of this version. See “What the installer does”.
6. It sets up the timer of the automatic updates (see the note above).

This table shows the options of the command:

| Option | Effect |
|---|---|
| `--version X.Y.Z` | Installs this version instead of the latest one. |
| `--dir FOLDER` | Installs into this folder instead of `probant`. |
| `--check` | Only checks the server, and installs nothing. See “Check the server before you install”. |
| `--auto-update off` | Installs without the automatic updates (section 6). |
| `--domain`, `--port`, `--yes`, `--skip-check` | Options of `./install.sh`. See the table in “What the installer does”. |

The check of the files gives this protection:

- It finds a file changed or damaged on the way (a proxy, a mirror, a cache), and a tag moved after the release.
- With the signature verified, only the workflow `image.yml` of the public repository, for this tag, can make the
  list. Each signature is in the public transparency log of Sigstore.
- It does not protect against a person who can change the repository and run its workflow.
- It does not check `get.sh` itself (see “Read the script before you run it”), or the signature of the image (see
  “Verify the image”).

The versions published before these lists (1.0.0 and 1.0.1) have none: the command refuses them. Just after a
publication, the list can be missing for up to an hour: try again later.

## Read the script before you run it

If your security rules do not allow a script to run as soon as it is downloaded, do these steps:

1. Download the script: `curl -fsSLO https://github.com/Probant-Reporting/probant/raw/main/get.sh`.
2. Read it: `less get.sh`. The script is short, and comments explain each step. Outside the folder of the
   installation, it changes only two things: Docker, if you accept to install it, and the timer of the automatic
   updates (unless you add `--auto-update off`).
3. Run it, with the same options as the command: `sudo sh get.sh` (or `sudo sh get.sh --domain reporting.example.com`).

The script then runs `install.sh` of the version. Before, you can read `install.sh` and `update.sh` in the public
repository, at the tag of the version (`vX.Y.Z`).

To verify the script before you run it, download it from the tag of the version, with the list of the SHA-256 sums
of the release. Replace `X.Y.Z` with the version (the latest one is on
https://github.com/Probant-Reporting/probant/releases/latest):

```bash
curl -fsSLO https://github.com/Probant-Reporting/probant/raw/refs/tags/vX.Y.Z/get.sh
curl -fsSLO https://github.com/Probant-Reporting/probant/releases/download/vX.Y.Z/probant-X.Y.Z-files.sha256
curl -fsSLO https://github.com/Probant-Reporting/probant/releases/download/vX.Y.Z/probant-X.Y.Z-files.sha256.sigstore.json
sha256sum -c --ignore-missing probant-X.Y.Z-files.sha256
```

The last command shows `get.sh: OK`. To verify the list itself, use cosign version 3 or later. If the signature is
correct, cosign shows `Verified OK`:

```bash
cosign verify-blob probant-X.Y.Z-files.sha256 \
  --bundle probant-X.Y.Z-files.sha256.sigstore.json \
  --certificate-identity https://github.com/Probant-Reporting/probant/.github/workflows/image.yml@refs/tags/vX.Y.Z \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

Then run `sudo sh get.sh --version X.Y.Z`, with the same options as the command.

## What the installer does

The installer is `./install.sh`. It does these steps, in this order:

1. For a new installation, it checks the server (see “Check the server before you install”). If a point is to fix,
   it stops and installs nothing.
2. It checks that Docker responds. If Docker is missing, it offers to install it (see “Install Docker on Debian or
   Ubuntu”).
3. It creates the `.env` settings file from `.env.example`. It does not replace an existing `.env` file.
4. It gets the image: it downloads the published image if `IMAGE` is set in `.env`, or else it builds the image.
5. It starts the tool and waits for it to respond.
6. It shows the address to open.

This table shows the options of `./install.sh`:

| Option | Effect |
|---|---|
| No option | The tool opens over HTTP at `http://SERVER-ADDRESS:8000`. Use it for an internal network or a trial. |
| `--domain reporting.example.com` | The tool opens over HTTPS. The installer adds Caddy, the HTTPS proxy provided, in front of the tool. Caddy gets the certificate from Let's Encrypt automatically. Port 8000 is then open only to the server itself. |
| `--port 8080` | The tool uses another HTTP port. |
| `--image ghcr.io/probant-reporting/probant:X.Y.Z` | The tool uses this published image (the setting `IMAGE` in `.env`). The server downloads it and does not build it. |
| `--yes` | If Docker is missing, the installer installs it without the question. |
| `--check` | Only checks the server, with the other options, and installs nothing. |
| `--skip-check` | Installs without the check of the server. |
| `--offline probant-image-X.Y.Z.tar.gz` | Installs without Internet access, with the image of the offline package. See “Install without Internet access”. |
| `--cert FILE --key FILE` | With `--domain`: Caddy serves the HTTPS certificate of your company, and never contacts Let's Encrypt. On an installation that runs: renews the certificate. See “Company network”. |
| `--ca-cert FILE` | Adds a certificate authority of your company for the outgoing connections of the tool. Repeat the option for several authorities. See “Company network”. |
| `--auto-update on` or `off` | Sets up or removes the timer of the automatic updates, with a published image only. `--auto-update-time HH:MM` chooses its time (04:00 by default). See “Automatic updates” (section 6). |

## Install with Git

Use this way to install the tool from the code, for example to follow the repository with `git pull`.

To install the tool with Git:

1. Get the code and go to its folder:

   ```bash
   git clone https://github.com/Probant-Reporting/probant.git probant
   cd probant
   ```

2. Run the installer:

   ```bash
   ./install.sh                      # or: ./install.sh --domain reporting.example.com
   ```

   The server builds the image. For this, it downloads the base image from Docker Hub and the Python packages from
   PyPI. To use the published image instead, add `--image ghcr.io/probant-reporting/probant:X.Y.Z`, with the version
   of the code.

## Install without the script

To do the same installation by hand, in the folder of the code (see “Install with Git”):

1. Create the settings file: `cp .env.example .env`.
2. Open the file (`nano .env`) and set at least `DOMAIN`.
3. Build and start the tool: `docker compose up -d --build`.

## Verify the image

This part is optional. It is for an installation that uses the published image (`IMAGE` in `.env`, see section 4).
The installation and `./update.sh` do not verify the signature of the image: do it yourself here if your security
rules ask for it. The automatic updates verify it before each installation (section 6).

Each image, from version 1.1.0, has these three items (the images of versions 1.0.0 and 1.0.1 have none):

| Item | What it is | Where to find it |
|---|---|---|
| Signature | Proof that the image comes from the workflow `image.yml` of the repository `Probant-Reporting/probant`, for the tag of the version. It is made with cosign, without a key: the certificate names the workflow and the tag. | In the registry, next to the image |
| SBOM (software bill of materials) | The list of the components of the image (system packages and Python libraries), in SPDX JSON. It is also attached to the image as a signed attestation. | Release of the version: `probant-<version>-sbom.spdx.json` |
| Vulnerability report | The known vulnerabilities of those components on the day of the build, made by Grype. A text table and a JSON file. | Release of the version: `probant-<version>-vulnerabilities.txt` and `.json` |

The release page is `https://github.com/Probant-Reporting/probant/releases`. If a file is not in the release, it is
in the artifact `probant-image-reports` of the “Docker image” run of the tag (**Actions** tab).

To verify the signature of an image:

1. Install cosign version 3 or later (https://docs.sigstore.dev/cosign/system_config/installation/).
2. Run this command. Replace `X.Y.Z` with the version (for example, `1.1.0`), in the image and in the tag:

   ```bash
   cosign verify ghcr.io/probant-reporting/probant:X.Y.Z \
     --certificate-identity https://github.com/Probant-Reporting/probant/.github/workflows/image.yml@refs/tags/vX.Y.Z \
     --certificate-oidc-issuer https://token.actions.githubusercontent.com
   ```

   If the signature is correct, cosign lists the checks that it made, then shows the signature with the digest of
   the image (`sha256:…`). If not, cosign shows an error and stops. In that case, do not use the image, and report
   the problem (see `SECURITY.md`).

3. Optional: to be sure that the server runs exactly the verified image, set `IMAGE` to that digest. For example:
   `IMAGE=ghcr.io/probant-reporting/probant@sha256:…`.

To get the SBOM from the image and verify its attestation in the same step, run this command:

```bash
cosign verify-attestation --type spdxjson ghcr.io/probant-reporting/probant:X.Y.Z \
  --certificate-identity https://github.com/Probant-Reporting/probant/.github/workflows/image.yml@refs/tags/vX.Y.Z \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  | jq -r '.payload' | base64 -d | jq '.predicate' > probant-sbom.spdx.json
```

To read the vulnerability report:

- Open `probant-<version>-vulnerabilities.txt`. Each line is one known vulnerability of one component: the name of
  the component, the installed version, the version that corrects the vulnerability (empty if there is no correction
  yet), the identifier (CVE or GHSA), and the severity (Critical, High, Medium, Low, Negligible).
- Most lines are system packages of the base image (`python:3.12-slim`). Many have no correction yet, or concern a
  function that the tool does not use.
- The report gives information only: a vulnerability does not stop the publication of the image. A correction of a
  component comes with the next version of the image.
- The report shows the state on the day of the build. To check again later with the vulnerabilities known today, scan
  the SBOM. For example, with Grype: `grype sbom:probant-<version>-sbom.spdx.json`.
- The JSON file has the same content, for a security tool of your organisation.

## Install without Internet access

Use this way for a server that cannot reach the Internet. Each version, from 1.1.0, has an offline package:
the image of the tool and the files that install and update it, in one file. Nothing is downloaded during the
installation. There are no automatic updates: to update, use the package of the new version (see “Update without
Internet access”, section 6).

This table shows the files of the offline package, on the release page of the version
(`https://github.com/Probant-Reporting/probant/releases`):

| File | What it is |
|---|---|
| `probant-X.Y.Z-offline.tar` | The package: a folder `probant` with the archive of the image (`probant-image-X.Y.Z.tar.gz`), the archive of the image of Caddy (`caddy-image.tar.gz`, for HTTPS), `docker-compose.yml`, `.env.example`, `install.sh`, `update.sh`, `check.sh`, `docker/Caddyfile`, `VERSION`, and `SHA256SUMS` (the SHA-256 sum of each file) |
| `probant-X.Y.Z-offline.tar.sha256` | The SHA-256 sum of the package |
| `probant-X.Y.Z-offline.tar.sigstore.json` | The signature of the package (cosign bundle). It contains everything that cosign needs to verify the package without network. |

Without Internet access, you can use:

- The tool, with its SQLite database (the default). The package holds the image of the tool and the image of Caddy.
  It does not hold the image of PostgreSQL (`postgres` profile): see “PostgreSQL without Internet access” below.
- HTTP on the internal network (`http://SERVER-ADDRESS:8000`).
- HTTPS with the proxy of your company in front of the tool: the proxy has the certificate and sends the requests to
  TCP 8000 of the server, with the headers `X-Forwarded-Proto` and `X-Forwarded-For`. Set `DJANGO_HTTPS=1` and
  `DOMAIN` in `.env` (section 4), then run `docker compose up -d`.
- HTTPS with Caddy and the certificate of your company: add `--domain`, `--cert` and `--key` to the command of step 7
  (see “Company network”).

Without Internet access, there is no automatic certificate: the installer refuses `--offline` with `--domain` alone.

To install the tool without Internet access:

1. On a computer with Internet access, download the three files of the version from the release page.
2. On this computer, verify the package:
   - The sum: `sha256sum -c probant-X.Y.Z-offline.tar.sha256`. The command shows `OK`.
   - The signature, with cosign version 3 or later. Replace `X.Y.Z` with the version, in the file names and in the tag:

     ```bash
     cosign verify-blob probant-X.Y.Z-offline.tar \
       --bundle probant-X.Y.Z-offline.tar.sigstore.json \
       --certificate-identity https://github.com/Probant-Reporting/probant/.github/workflows/image.yml@refs/tags/vX.Y.Z \
       --certificate-oidc-issuer https://token.actions.githubusercontent.com
     ```

     If the signature is correct, cosign shows `Verified OK`. If not, do not use the package, and report the problem
     (see `SECURITY.md`).
3. Optional: to verify the signature on a computer without Internet access too, cosign needs the trusted root of
   Sigstore. On the computer with Internet access, after one use of cosign (or `cosign initialize`), find it with
   `find ~/.sigstore -name '*trusted_root.json'`, and copy it with the package. Then add
   `--trusted-root <that file>` to the command of step 2.
4. Install Docker Engine and its Compose plugin on the server, from the package mirror of your company. Without
   Internet access, the installer cannot install Docker.
5. Copy `probant-X.Y.Z-offline.tar` to the server, in the folder where you want the folder of the tool.
6. Extract the package and go to its folder:

   ```bash
   tar -xf probant-X.Y.Z-offline.tar
   cd probant
   ```

7. Run the installer with the archive of the image. Add `--port 8080` for another port:

   ```bash
   ./install.sh --offline probant-image-X.Y.Z.tar.gz
   ```

The installer does these steps, in this order:

1. It checks each file of the folder against `SHA256SUMS`. If a file is damaged or changed, it stops and changes
   nothing.
2. It checks the server (see “Check the server before you install”), without the network checks.
3. It creates the `.env` file, loads the image into Docker (`docker load`), and sets `IMAGE` in `.env` to the name of
   this image.
4. It starts the tool without any download, and waits for it to respond.

After the installation, the folder still contains the archive of the image. You can delete it when the tool works:
Docker keeps the image.

### PostgreSQL without Internet access

The package does not hold the image of PostgreSQL. To use the `postgres` profile (section 8) without Internet access,
bring the image yourself:

1. On a computer with Internet access, save the image named in `docker-compose.yml` (service `db`):

   ```bash
   docker pull postgres:16
   docker save postgres:16 | gzip > postgres-16.tar.gz
   ```

2. Copy `postgres-16.tar.gz` to the server, then load it: `docker load -i postgres-16.tar.gz`.
3. Set the `postgres` profile and `DATABASE_URL` in `.env` (section 8), then run `docker compose up -d --pull never`.

## Company network

This part is optional. It is for a server on the network of a company, with one or more of these items: a
certificate that your company gives for the HTTPS address, a certificate authority of your company (the certificate
that signs its internal certificates) for the outgoing connections, and a proxy. If your network uses none of them,
skip this part.

The files of this part go into the folder `certificates/` of the installation, next to `.env`:

| Folder | Content | Who reads it |
|---|---|---|
| `certificates/https/` | `certificate.pem` and `key.pem`: the HTTPS certificate of your company and its private key (key in mode `0600`, folder in mode `0700`) | Caddy only. The container of the tool never receives the key, so a backup of the tool never contains it. |
| `certificates/ca/` | The certificate authorities of your company (`.pem`, `.crt` or `.cer` files, mode `0644`) | The tool, read only |

Keep the original files where your company keeps its certificates: the backups of the tool do not contain them.

### Use the HTTPS certificate of your company

Caddy can serve a certificate that your company gives, instead of the automatic certificate. Use it for an address
that the Internet cannot reach, or when the security policy of your company asks for it. Caddy then never contacts
Let's Encrypt, and the server does not need to be reachable from the Internet.

This table shows the two files that you need, in PEM format:

| File | Content |
|---|---|
| Certificate | The certificate of the server for the domain name, then the intermediate certificates (the full chain) |
| Private key | The private key of this certificate, without a password |

To install the tool with this certificate:

```bash
./install.sh --domain reporting.example.com --cert reporting.pem --key reporting.key
```

With the installation with one command, add the same options after `sh -s --`. Without Internet access, add
`--offline probant-image-X.Y.Z.tar.gz`: the installer loads the image of Caddy from the package.

Before any change, the installer checks the files (with `check.sh`, which needs the `openssl` command). This table
shows the checks:

| Check | If it fails |
|---|---|
| The private key matches the certificate | To fix: the installer stops |
| The certificate covers the domain name | To fix: the installer stops |
| The certificate has not expired | To fix: the installer stops. Less than 30 days left: a warning only |
| The chain is complete, up to an authority of the system or of your company (`--ca-cert`) | A warning only: some browsers refuse an incomplete chain |

With the certificate of your company, a domain name that this server cannot find in the DNS gives a warning only:
the people who open the tool need the name, not Caddy.

To renew or replace the certificate, run this command in the folder of the installation:

```bash
./install.sh --cert new-certificate.pem --key new-key.key
```

The command checks the new files, puts them in place, and reloads the certificate in Caddy, without a break and
without a download (also without Internet access). The same command changes an installation that uses the automatic
certificate to the certificate of your company. To check new files before you renew, without any change:
`sh check.sh --certificate-only --domain reporting.example.com --cert new-certificate.pem --key new-key.key`.

To replace the files by hand: copy them to `certificates/https/certificate.pem` and `certificates/https/key.pem`, then
run `docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile --force`. To go back to the automatic
certificate: empty `HTTPS_CERTIFICATE=` in `.env`, then run `docker compose up -d`.

### Trust the certificate authority of your company

A connection of the tool to a server that has a certificate of an internal authority fails until the tool trusts that
authority. For example: the email server of your company, or a proxy that inspects the HTTPS traffic. The error says
“certificate verify failed”.

To add the authority, give its certificate (PEM format) to the installer. Repeat the option for several authorities:

```bash
./install.sh --ca-cert company-root-ca.pem
```

On an installation that runs, the same command adds the authority and restarts the tool. At each start, the tool joins
the authorities of `certificates/ca/` with those of the system in one file, `/data/ca-bundle.pem`. Every outgoing
connection of the tool uses this file: the email server (STARTTLS and SSL), and every other HTTPS
connection. The public authorities stay trusted.

The tool uses only the certificate of an authority. A file that it cannot read, that holds no certificate, or that
holds a server certificate, is written in the log at the start (`docker compose logs web`) and ignored: the tool
starts all the same. **Administration › Settings › Health** shows the authorities in use, with their expiry dates,
to the space managers and to the administrators of the main space. The line becomes “To check” 30 days before an
authority expires.

To remove an authority, delete its file from `certificates/ca/`, then run `docker compose restart web`.

Without Docker (managed hosting, or `python manage.py runserver`), set `EXTRA_CA_CERTS` to the file, or to the folder
of the files. Separate several with `:`. The data folder must be writable: the tool writes `ca-bundle.pem` there. With
Python 3.13 or later, the certificates must have the key identifiers that RFC 5280 asks for.

The check of the server uses the authority too: `sh check.sh --ca-cert company-root-ca.pem` (the installer gives it
the options). The authorities of `certificates/ca/` of an installation are read without the option.

Docker downloads the images itself, outside the tool. Behind a proxy that inspects the traffic, the Docker service must
trust the authority too: on Debian and Ubuntu, copy it to `/usr/local/share/ca-certificates/` with the extension
`.crt`, then run `sudo update-ca-certificates` and `sudo systemctl restart docker`
(https://docs.docker.com/engine/network/ca-certs/). An image built on the server (“Install with Git”) also downloads
Python packages during the build: behind such a proxy, use the published image or the offline package.

### Use a proxy for the outgoing connections

The tool can use a proxy for its outgoing HTTPS connections. This table shows what to set:

| What | How |
|---|---|
| Outgoing HTTPS connections of the tool | `HTTPS_PROXY=http://proxy.example.com:3128` in `.env`, and `NO_PROXY` for the addresses to reach directly. Then run `docker compose up -d`. |
| Email server | The SMTP connection does not use the proxy: open the SMTP port from the server to the email server. |
| Check of the server | `sudo HTTPS_PROXY=http://proxy.example.com:3128 sh check.sh …` (see “Check the server before you install”) |
| Downloads of Docker | The proxy of the Docker service: https://docs.docker.com/engine/daemon/proxy/ |
| Proxy that inspects the HTTPS traffic | Give its authority with `--ca-cert` (see above) |
