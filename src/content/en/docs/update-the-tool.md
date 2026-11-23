---
title: "Update the tool"
description: "When the database must change, the log shows this line and the path of the archive before the summary: Updating space \"principal\" (3 migration(s)):…"
order: 6
group: "Run"
source: "docs/installation.md"
---

To update the tool:

1. Go to the folder of the tool (`probant`). For example: `cd probant`.
2. Run `./update.sh`. The script shows the new version when the update is complete.

The script does these steps, in this order:

1. It makes a backup named “before-update” of each space, with the version that is installed now. If the backup of
   a space fails, the update stops and changes nothing.
2. It gets the new version:
   - With `git pull`, followed by a new build of the image
   - Or, if `IMAGE` is set in `.env`, with `docker compose pull`
3. It restarts the tool. The tool applies the changes to the database structure automatically at startup. If the
   database must change, the tool first makes an automatic backup.
4. It waits for the tool to respond.

At each start, the log (`docker compose logs web`) shows a short summary in English. For example:

```text
Probant, version 1.0.0 (3f2a9c1d7e4b)
Database: PostgreSQL (db/probant), 0 migration(s) applied; installation "Probant", 23 account(s)
Data: /data; backups: /data/backups (14 archive(s))
Address(es): reporting.example.com; HTTPS: yes
E-mails: SMTP smtp.example.com:587
```

When the database must change, the log shows this line and the path of the archive before the summary:
`Updating space "principal" (3 migration(s)): automatic backup before.`

The version number is shown at the bottom of every page and in **Administration › Settings › Hosting**.

## Going back to the previous version

> **Warning:** Going back replaces everything done since the “before-update” backup. Warn the teams, and do it when
> nobody enters data.

The update makes a “before-update” backup of each space before it changes anything. List the backups:
`docker compose exec web python manage.py backup --list` (add `-e SPACE=<code>` for another space). The archives of
another space are in `/data/backups/spaces/<code>/`, and the archive of the shared registry is in
`/data/backups/shared/`. The version that made an archive can always read it: to go back, use the oldest
“before-update” archive of the update.

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
   - With a published image: set `IMAGE=` to the previous image in `.env`, then run `docker compose pull web`.
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

To update the tool again later, go back to the main branch first: `git checkout main`, then `./update.sh`. After
`git checkout <previous-version>`, `git pull` refuses to run (“You are not currently on a branch”), and `update.sh`
stops.

### Restore a PostgreSQL backup on a new server

A PostgreSQL backup restores only with the version of the tool that made it, or with `--rebuild`. On a new server,
install the tool, restore the shared registry (`restore --shared`), then the main space and each other space (steps 3
and 4 above). The new server has another secret key: add `--unsigned` to the restore of each space, or copy the file
`.secret_key` of the former data folder into the new one before the first start.
