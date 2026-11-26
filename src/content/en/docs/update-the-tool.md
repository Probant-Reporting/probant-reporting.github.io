---
title: "Update the tool"
description: "To install a given version instead of the latest one, after an installation with one command, run ./update.sh --version X.Y.Z. The script refuses a version…"
order: 6
group: "Run"
source: "docs/installation.md"
---

To update the tool:

1. Go to the folder of the tool (`probant`). For example: `cd probant`.
2. Run `./update.sh`. The script shows the new version when the update is complete.

To install a given version instead of the latest one, after an installation with one command, run
`./update.sh --version X.Y.Z`. The script refuses a version older than the installed version: to go back, see “Going
back to the previous version”.

You can update from any published version directly, without installing the versions in between. An automatic test tries it from every published version.

The script does these steps, in this order:

1. It makes a backup named “before-update” of each space, with the version that is installed now. If the backup of
   a space fails, the update stops and changes nothing.
2. It gets the new version:
   - After an installation with one command (a folder without Git, with `IMAGE` set to a version of
     `ghcr.io/probant-reporting/probant`): it downloads the files of the new version, as the installation did, then
     sets `IMAGE` in `.env` to the image of this version and downloads it. It keeps the other settings of `.env` and
     the data. If a download fails, the update stops and changes nothing. Before it puts the files in place, it checks
     each one against the list of the SHA-256 sums of the release, and the signature of this list when it can, as the
     installation does (see “Install with one command”). If the list is missing, if its signature is refused, or if
     one file does not match, the update stops and changes nothing (exit code 3).
   - After an installation with Git: with `git pull`, followed by a new build of the image
   - Or, if `IMAGE` is set in `.env` to another image, with `docker compose pull`
3. It restarts the tool. The tool applies the changes to the database structure automatically at startup. If the
   database must change, the tool first makes an automatic backup.
4. It waits for the tool to respond.

At each start, the log (`docker compose logs web`) shows a short summary in English. For example:

```text
Probant, version 1.1.0 (3f2a9c1d7e4b)
Database: PostgreSQL (db/probant), 0 migration(s) applied; installation "Probant", 23 account(s)
Data: /data; backups: /data/backups (14 archive(s))
Address(es): reporting.example.com; HTTPS: yes
E-mails: SMTP smtp.example.com:587
```

When the database must change, the log shows this line and the path of the archive before the summary:
`Updating space "principal" (3 migration(s)): automatic backup before.`

The version number is shown at the bottom of every page and in **Administration › Settings › Hosting**.

Only one update runs at a time: if the automatic update runs (see “Automatic updates”), `./update.sh` stops and
changes nothing.

## Automatic updates

After an installation with one command, a timer of the server installs each new version at night, and goes back to
the previous version if the new one does not work. The script `auto-update.sh` of the folder of the tool does all the
work, on the server. The tool itself never connects to the Internet, never compares two versions, and has no access to
Docker: no Docker socket is given to its container, and no other tool (such as Watchtower) is used.

The choice is in **Administration › Settings › Hosting**, “Automatic updates”. Only the space managers can change
it:

| Choice | Effect |
|---|---|
| Install it automatically | The server installs each new version at night. |
| Notify only | The server checks every night. The tool shows the new version, also on the page **Settings › Health** and in the email alerts if they are on. IT installs it with `./update.sh`. |
| Off | The server does not check. |
| Wait after the publication | 0, 1, 3, 7 or 14 days (3 by default). The server installs a version only when it was published this number of days ago. In the meantime, a version with a problem can be corrected. With “Notify only”, the alert comes at once. |

This table shows the setting at the start:

| Installation | Timer of the server | Choice in the tool |
|---|---|---|
| New installation with one command (`get.sh`) | Set up | Install it automatically, wait 3 days |
| Installation that already exists, updated to a version with automatic updates | Not set up: run `./install.sh --auto-update on` | Off |
| Installation with Git, without Internet access (`--offline`), or with another image | Not available | — |
| Managed hosting, all-in-one version | Not available: the screen says so | — |

### What one run does

1. It stops at once if another update runs (the lock `.update.lock` of the folder, shared with `./update.sh`), if
   the installation does not use a published version, if the tool is stopped, or if the choice is “Off”.
2. It finds the latest published version, as `./update.sh` does, and downloads its image. If the digest of this image
   is the digest of the image that runs, there is nothing to do.
3. It verifies the signature of the new image (see “Signature of the new image”). If the signature is absent or not
   correct, or if the verification is not possible, nothing is installed.
4. It stops here with “Notify only”, during the wait after the publication, for an image whose automatic update failed
   before, and for a version that changes the shared registry of the accounts (that change cannot be undone
   automatically: IT installs this version with `./update.sh`).
5. It does not update during a restore, a backup, a large import or a large export of the tool. It tries again the
   next night.
6. It downloads the list of the SHA-256 sums of the files of this version, from its release, and verifies the
   signature of this list (see “Signature of the new image”). If the list is missing, or if its signature is not
   verified, nothing is installed. Then it runs `./update.sh` for this version, with this list and with the image
   pinned to the verified digest (`IMAGE=ghcr.io/probant-reporting/probant:X.Y.Z@sha256:…`). `./update.sh` makes the
   “before-update” backup of each space first, as always, and checks each file against the list before it puts any in
   place.
7. It checks `/sante/`, then again 30 seconds later.

If the new version does not respond, the script goes back automatically:

1. It puts back the files and the `.env` of before (kept in `.auto-update/previous/`) and the image of before (it stays
   on the server).
2. It compares the migrations of each database with the migrations of before. If the new version changed the database
   of a space, it restores the “before-update” backup of this space made by `./update.sh`, with
   `restore --rebuild` (SQLite and PostgreSQL). A space that did not change is not restored, so nothing is lost.
3. It starts the version of before and checks `/sante/`.

The screen then says “The server went back to version X.Y.Z”, and so do the page **Settings › Health** and the email
alerts. The same image is not tried
again: when the cause is known, IT runs `sudo ./auto-update.sh --retry`. If going back does not work completely (a
restore fails, the shared registry changed, or the version of before does not respond), the result is a failure, the
email alert says “call IT”, and IT follows “Going back to the previous version”. Nothing more is done automatically,
not even the next nights, until IT runs `sudo ./auto-update.sh --retry`.

### Signature of the new image

The script verifies the signature with cosign in its official container, `ghcr.io/sigstore/cosign/cosign`, pinned by
its digest in `auto-update.sh`. Docker checks this digest when it downloads the container: nothing to install by hand.
The container runs read only, without any capability, and with no folder of the server except the certificate
authorities of your company (`certificates/ca/`). The check is the same as in “Verify the image” (section 2): the image
must be signed by the workflow `image.yml` of the repository `Probant-Reporting/probant`, for the tag of this version,
with the issuer `https://token.actions.githubusercontent.com`. The signature names the digest of the image, and the
script installs exactly this digest.

The script verifies the list of the SHA-256 sums of the files of the version in the same way, with the same container
and the same identity (`cosign verify-blob`). For this check, the container reads only the folder of the list, read
only, as the user of the script. Here, a list that cannot be verified always stops the update.

### Turn the timer on or off

In the folder of the tool, as root (`sudo`):

- `./install.sh --auto-update on` sets up the timer: every night at about 04:00, time of the server, with a random
  delay of up to 1 hour. To choose the time: `./install.sh --auto-update on --auto-update-time 01:30`. With systemd,
  the timer is `probant-auto-update-<number>.timer`. Without systemd, it is a file in `/etc/cron.d/`. Without root, it
  is a line in the crontab of the user.
- `./install.sh --auto-update off` removes the timer. Nothing else changes.

On an installation that already exists, these commands change only the timer: the choice in the tool stays the choice
of the administrators. Before you delete the folder of the tool, run `./install.sh --auto-update off`. If the folder is
already deleted, remove the timer by hand: `sudo systemctl disable --now probant-auto-update-<number>.timer`, then
delete the two files `/etc/systemd/system/probant-auto-update-<number>.*` (or the file in `/etc/cron.d/`).

### Read the log

- `auto-update.log`, in the folder of the tool: each step of each run, and the output of `./update.sh`.
- With systemd: `journalctl -u 'probant-auto-update-*'`, and the next run: `systemctl list-timers 'probant-auto-update-*'`.
- `./auto-update.sh --status`: the last result.
- `sudo ./auto-update.sh`: one run now, the same as the timer.

The tool shows the last result in **Settings › Hosting**, and says when the timer ran for the last time. If the timer
has not run for 3 days, the page **Settings › Health** says so, and so do the email alerts if they are on.

### Network of the server

The script needs outgoing HTTPS (TCP 443) from the server, not from the container: `github.com` and
`raw.githubusercontent.com` (the latest version and its files), `objects.githubusercontent.com` and
`release-assets.githubusercontent.com` (the list of the sums of the files, attached to the release),
`ghcr.io` and `pkg-containers.githubusercontent.com` (the image and the container of cosign), and `tuf-repo-cdn.sigstore.dev` (the trusted root of Sigstore, read by
cosign). Through a proxy, set `HTTPS_PROXY` in the environment of the timer (for example
`systemctl edit probant-auto-update-<number>.service`), and the proxy of Docker for the downloads of images.

## Update without Internet access

To update an installation without Internet access, use the offline package of the new version:

1. Download the package of the new version and verify it, as in steps 1 to 3 of “Install without Internet access”
   (section 2).
2. Copy the package to the server, and extract it into another folder than the folder of the tool. For example:

   ```bash
   mkdir /tmp/probant-new
   tar -xf probant-X.Y.Z-offline.tar -C /tmp/probant-new
   ```

3. In the folder of the tool, run the update with the archive of the new image:

   ```bash
   ./update.sh --offline /tmp/probant-new/probant/probant-image-X.Y.Z.tar.gz
   ```

4. When the tool works, delete the folder of step 2: `rm -rf /tmp/probant-new`.

The script checks the files of the package against its `SHA256SUMS`, and refuses a version older than the installed
version: in both cases, it changes nothing. Then it does the steps of the update, without any download:

1. It makes the “before-update” backup of each space, with the version that is installed now.
2. It puts the files of the package in place (`docker-compose.yml`, `install.sh`, `update.sh`…). It keeps `.env` and
   the data. It loads the new image into Docker and sets `IMAGE` in `.env` to it.
3. It restarts the tool, and waits for it to respond.

The image of before stays on the server. To go back, see “Going back to the previous version”. An installation made
with one command, or from another offline package, updates in the same way.

## Going back to the previous version

> **Warning:** Going back replaces everything done since the “before-update” backup. Warn the teams, and do it when
> nobody enters data.

The update makes a “before-update” backup of each space before it changes anything. List the backups:
`docker compose exec web python manage.py backup --list` (add `-e SPACE=<code>` for another space). The archives of
another space are in `/data/backups/spaces/<code>/`, and the archive of the shared registry is in
`/data/backups/shared/`. The version that made an archive can always read it: to go back, use the oldest
“before-update” archive of the update. The rotation of the backups always keeps the “before-update” archives of the
last update, so going back stays possible until the next update.

The steps depend on the database:

- **SQLite** (default): do the steps below, without `--rebuild`.
- **PostgreSQL**: a PostgreSQL backup (JSON format) restores only into a database that has exactly its migrations.
  After an update, the database has more migrations. The option `--rebuild` of `restore` drops the tables of the space,
  creates them again for the version that is installed, then loads the backup. It does all of this in one step: if a
  step fails, the database does not change.

To go back to the previous version:

1. Stop the tool: `docker compose stop web`.
2. Get the previous version, without starting it:
   - With `git`: find it (`git log --oneline -5`), then run `git checkout <previous-version>` and
     `docker compose build web`.
   - With a published image (an installation with one command, for example): set `IMAGE=` to the previous image in
     `.env`, then run `docker compose pull web`. At the end of an update, the script shows the image of before the
     update (“Image before the update: …”).
   - Without Internet access: the image of before is still on the server (`docker image ls`). Set `IMAGE=` to it in
     `.env`, without `docker compose pull`.
3. Restore the “before-update” archive of the main space:
   `docker compose run --rm web python manage.py restore <before-update archive> --yes --rebuild`
   (SQLite: without `--rebuild`).
4. For each other space, restore its own archive:
   `docker compose run --rm -e SPACE=<code> web python manage.py restore <archive of this space> --yes --rebuild`.
5. Optional: to bring back the accounts and passwords as they were before the update, restore the shared registry:
   `docker compose run --rm web python manage.py restore --shared <registry-…-before-update.zip> --yes`.
   Without this step, everyone keeps their current password.
6. Start the tool: `docker compose up -d`.

If a restore says that the archive has no valid signature of this installation (an archive made on another server,
for example), run the same command again with `--unsigned`.

Each restore first backs up the current state (“before-restore” archive). Keep these archives until the tool works
again.

With Git, to update the tool again later, go back to the main branch first: `git checkout main`, then `./update.sh`. After
`git checkout <previous-version>`, `git pull` refuses to run (“You are not currently on a branch”), and `update.sh`
stops. After an installation with one command, run `./update.sh`: it installs the latest version again.

### Restore a PostgreSQL backup on a new server

A PostgreSQL backup restores only with the version of the tool that made it, or with `--rebuild`. On a new server,
install the tool, restore the shared registry (`restore --shared`), then the main space and each other space (steps 3
and 4 above). The new server has another secret key: add `--unsigned` to the restore of each space, or copy the file
`.secret_key` of the former data folder into the new one before the first start.
