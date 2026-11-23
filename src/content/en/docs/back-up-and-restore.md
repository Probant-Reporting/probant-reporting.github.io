---
title: "Back up and restore"
description: "Do not move anything in this folder by hand. For details, see docs/file_layout.md."
order: 5
group: "Run"
source: "docs/installation.md"
---

## What the `/data` volume contains

The tool organises this folder itself and writes a `README.txt` file in it:

- Databases and key: at the root
- Documents added to the tool: in `files/` (`evidence/<period>/<organisation>/<KPI>/`, `settings/logo/`,
  `pending-imports/`)
- Archives: in `backups/`
- Other spaces: in `spaces-data/<code>/`

Do not move anything in this folder by hand. For details, see `docs/file_layout.md`.

Only the user of the tool can read what is in this folder: the tool creates files with mode `0600` and folders with
mode `0700`, also when you run a command with `docker compose exec`. At each start, it removes the rights of the group
and of the others from the files that an older version made.

## What a backup contains

A backup is a dated `.zip` archive in `/data/backups`. It contains:

- The complete database: accounts, frameworks, campaigns, values, history, and the sign-in history of the last days
  (Administration › Settings › Hosting sets how many)
- The files added to the tool: evidence files and logo
- A description: the version of the tool and the number of rows per table

The archive contains confidential data. Keep it in a safe place.

The archive of a space contains no passwords, not even their hashes. An administrator of the space can download it, so
the tool removes the hashes from it. The passwords stay in the shared account registry, which has its own backups in
`/data/backups/shared/`. Only IT can reach these backups: the tool never lists them and never lets anyone download
them. They contain the password hashes. Keep them in a safe place and copy them with the other backups.

> **Note:** Archives made by an earlier version of the tool can still contain the password hashes. This includes the archives that
> administrators downloaded and the copies that IT made off the server. Delete them when you no longer need them, or
> keep them in a place that only IT can open.

## Back up the tool

This table shows how to back up the tool:

| To… | Do |
|---|---|
| Back up automatically | Nothing. By default, the tool makes a backup every day at 02:30 and keeps 14 archives. The team in charge sets the frequency in **Administration › Settings › Hosting**. **Copy the backups folder off the server regularly.** |
| Back up now | Run `docker compose exec web python manage.py backup`. An administrator can also click **Create and download a backup** in **Administration › Settings › Hosting**. |
| List the backups | Run `docker compose exec web python manage.py backup --list`. |
| Copy the backups off the server | Run `docker compose cp web:/data/backups/. ../probant-backups/`. This copies the archives, subfolders included, to the folder `probant-backups` next to the folder of the tool. Do not copy them into the folder of the tool: the update builds the image from this folder. Then copy `probant-backups` off the server with your usual backup tool (rsync, Veeam…), on a schedule. The copied files keep their rights: only the account that ran `docker compose cp` can read them (files `0600`, folders `0700`). If your backup tool runs under another account, give this account access to `probant-backups`, for example with `chown -R`. Do not change the rights inside the volume. |

**Without Docker**, schedule the same backup with cron: `30 2 * * * cd /opt/reporting && python manage.py backup`.

## Backups and deleted evidence

An administrator can delete the evidence files of sensitive KPIs in **Administration › Evidence to delete**. The tool deletes the file at once. A backup keeps the evidence files that existed when it was made. So the backups that already exist keep the file until the tool replaces them.

- The number of backups kept sets how long a deleted file stays. With the default values (one backup a day, 14 kept), it stays up to 14 days. If the data is very sensitive, lower the number in **Administration › Settings › Hosting**.
- A restore brings the deleted file back, and it appears again in **Evidence to delete**. After a restore, the administrator deletes it again.
- The copies that you make off the server also keep the file. Delete the old copies on a schedule that matches how long you may keep sensitive data, and tell the administrators how long the copies last.

## Restore a backup

A restore does these steps:

1. It asks for confirmation.
2. It first backs up the current state (“before-restore” archive).
3. It replaces the database and the files added to the tool.

> **Warning:** A restore replaces everything done since the date of the backup. Other people who are signed in can be
> signed out. Warn the teams, and do not restore during a data entry period.

To restore a backup from the tool:

1. Go to **Administration › Settings › Hosting**.
2. Next to the backup in the list, click **Restore…**. The confirmation page opens.

   To use a `.zip` file downloaded earlier, open **Restore from a .zip file downloaded earlier**. Choose the file,
   then click **Check the file**. The tool adds the file to the list.
3. Select the box, then enter `RESTORE`.
4. Click **Restore this backup**. The tool backs up the current state first. Then the sign-in page shows “Restore
   complete. The tool is back to the state of …”.
5. Sign in with an administrator account from the restored database.

The tool restores only the backups that it made itself, unchanged. When it makes a backup, it signs the archive with a
key that comes from the secret key of the installation (`/data/.secret_key` or `DJANGO_SECRET_KEY`). The page
refuses an archive without a valid signature, also when you add a `.zip` file: “This backup was not made by this
installation, or it was changed after it was made”. These archives have no valid signature:

- Archives made by an earlier version of the tool (before the signature existed)
- Archives made by another server, or before a change of `DJANGO_SECRET_KEY`
- Archives that someone changed after the backup

IT can still restore such an archive from the command line, if it trusts the archive: add `--unsigned` to the
`restore` command. Without this option, the command refuses the archive and changes nothing.

To restore an archive from the server (if the tool no longer starts):

1. Run `docker compose exec web python manage.py restore backup-20261026-023000-auto.zip`. For an archive without a
   valid signature, add `--unsigned`.
2. Run `docker compose restart web`.

To restore an archive that you downloaded:

1. Copy the archive into the backups folder: `docker compose cp archive.zip web:/data/backups/`.
2. Do the 2 steps of the previous procedure.

After a restore, people sign in with the password that the shared account registry has for them: their current
password. The archive of a space contains no passwords. If the registry does not know an account, this account has no
password after the restore. This occurs when you restore an archive on another server, or when an account was deleted
after the backup. The restore says it (“… account(s) of this space have no password on this server”). Then do one of
these:

- Restore the backup of the shared registry made at the same time, from `/data/backups/shared/`:
  `docker compose exec web python manage.py restore --shared <registry-….zip> --yes`. On a new server, copy the whole
  `backups` folder first, subfolders included.
- Give new passwords: `docker compose exec web python manage.py changepassword <username>` for one administrator.
  This administrator then gives the other accounts a temporary password in **Administration › Accounts**.

With SQLite, you can restore an archive made with an older version of the tool into a more recent version. The tool
updates the database automatically. The tool refuses the reverse. With PostgreSQL, an archive restores only with the
version of the tool that made it: see [Going back to the previous version](/docs/update-the-tool/#going-back-to-the-previous-version) and
[Restore a PostgreSQL backup on a new server](/docs/update-the-tool/#restore-a-postgresql-backup-on-a-new-server).

To restore a PostgreSQL archive made by an older version after an update:

1. Try the restore. The more recent version refuses the archive and says so. Nothing changes.
2. Go back to the version that made the archive (the restore shows its version, also in `backup.json`), and restore the
   archive with that version: see [Going back to the previous version](/docs/update-the-tool/#going-back-to-the-previous-version).
3. Update the tool again with `./update.sh`. The update brings the restored data to the new version.

## If a restore is interrupted

If a restore is interrupted (server stopped, container stopped, disk full), nothing is lost:

- The tool first extracts the files of the archive to a separate place. If the disk is full, the restore stops before
  anything changes.
- Then the tool replaces the database in one step and swaps the files.
- If the restore stops after that point, the tool **finishes it automatically at the next start**. The log shows
  “the restore of …, interrupted, has been finished”. Until then, `/sante/` answers `503` (“interrupted restore”).

> **Warning:** Never copy `db.sqlite3` by hand. An old `db.sqlite3-wal` file next to it can damage it, with no error
> message. Always use `restore`.

## Back up and restore several spaces

An installation can have several spaces (departments). Each space has its own backups, in
`/data/backups/spaces/<code>/`. The shared account registry has its own backups, in `/data/backups/shared/`.
**Copy the whole of `/data/backups`, subfolders included.**

To run a command for one space, add `SPACE=<code>`. For example:
`docker compose exec -e SPACE=achats web python manage.py backup`. For details, see
docs/spaces.md, § 2.
