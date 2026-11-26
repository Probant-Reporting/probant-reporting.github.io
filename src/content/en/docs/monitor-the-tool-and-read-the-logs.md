---
title: "Monitor the tool and read the logs"
description: "The tool alerts you by email: you have no monitoring to connect. A space manager turns the alerts on in Administration › Settings › Health, box Email…"
order: 9
group: "Run"
source: "docs/installation.md"
---

## Get an email when something goes wrong

The tool alerts you by email: you have no monitoring to connect. A space manager turns the alerts on in **Administration › Settings › Health**, box **Email alerts**, and chooses the recipients:
by default the administrators of the main space and the space managers, plus other addresses, for example the mailbox
of the IT team. On a new installation, the alerts are on from the start; an installation that existed before the
email alerts keeps them off after an update, until someone turns them on. Turned off, they stay off. They need the
email server (section 7): without it, the tool sends nothing.

The alerts come from the same checks as the **Health** page and `/sante/`. These checks send an alert:

| Check | Alert when |
|---|---|
| Database | A database does not answer, or the startup check found a damaged database |
| Demo data | The database is the demo, and demo accounts still have the public password (never in development mode or in the all-in-one version). The tool starts all the same. The line goes away when no active demo account has the public password. |
| Files | The tool cannot write in its data folder |
| Last backup | The automatic backup failed or is late, the latest backup cannot be read, or the backup folder cannot be read |
| Disk space | Less than 10 times `DISK_ALERT_MB` free (“To check”), or less than `DISK_ALERT_MB` (“Failure”) |
| Email | The reminders failed, or the saved password of the email server can no longer be read |
| Background tasks | A background task stopped, an import or an export is stuck, or the night data check is late or found errors |
| Database update | Migrations are not applied |
| External copy | A copy of the backups fails, or is late (section 5) |
| Automatic updates | A new version is installed, or waits (“Notify only”). A signature is refused. The server went back to the previous version, or could not go back. The timer or the check has not worked for 3 days (section 6) |

These states do not send an alert: no backup yet, automatic backups turned off, a restore that finishes by itself,
HTTPS (it depends on the request).

The rules:

- The tool checks every 15 minutes, in the `check_data --schedule` and `backup --schedule` processes. Only one check
  runs at a time for the whole installation, even with several processes, spaces or servers.
- One email when a problem appears. All the changes of one check go in one email.
- A reminder at most once a day while a problem lasts, one email for all the problems.
- An email when a problem is resolved (absent at two checks in a row).
- Each person gets the email in their language. The other addresses get it in the language of the installation. The
  email gives the name of the space, what happens, since when, what to do, and the link to the **Health** page
  (`PUBLIC_URL`). It never contains data, folders of the disk, or the detail for IT.
- If the email cannot be sent (email server down), nothing fails: the problem stays on the **Health** page and in
  `/sante/`, the log gives the cause (`Email alerts not sent through …`), and the tool tries again at the next check.
- The state of the alerts is kept in the shared registry, outside the database of each space: a restore of a space
  does not send the alerts again. After a restore of the shared registry, the alerts of the problems that remain are
  sent again once.
- **Send a test alert** sends to the saved recipients an email with the problems of the moment.

**Limit:** when the server is off, or when the shared registry does not answer, the tool cannot warn anyone. To be
warned in this case too, keep an external monitoring of `/sante/` (below), in addition to the email alerts.

Without background tasks (managed hosting with scheduled tasks, see [Managed hosting](/docs/managed-hosting/)), schedule
`python manage.py check_data --alerts` every 15 minutes. The all-in-one version runs no background task and sends no
alert.

## Check that the tool is healthy

In addition to the email alerts, your monitoring can call `/sante/`. `GET /sante/` answers with one of these codes:

- `200` with `{"etat": "ok"}`: the tool works.
- `503` with `{"etat": "erreur"}`: the database or the storage has a problem, the database is damaged, a restore was
  interrupted, or the disk is almost full (less than 100 MB free, `DISK_ALERT_MB` setting). The details give the
  cause in `alerte`.

The page needs no sign-in and shows no sensitive data. Docker uses it too: `docker compose ps` shows `healthy`.

The tool gives the details of the whole installation only to a call from the server itself (from `127.0.0.1`, with
none of the headers that a proxy adds: `X-Forwarded-For`, `X-Real-IP`, `Forwarded`), to a signed-in space manager,
and to a signed-in administrator of the main space. The administrator of another space gets the details of their own
space only: the shared registry and the disk are measured, but the names, failures and stuck tasks of the other spaces
and the folders of the disk are not shown. Other people get the state only. The reason is that the exact version can
help to find an installation that is not up to date, and that the administrator of one space does not have to know the
other spaces. To see the details from the server, run this command:

```bash
docker compose exec web python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/sante/').read().decode())"
```

This table shows the fields of the details:

| Field | Content |
|---|---|
| `version`, `base`, `stockage`, `derniere_sauvegarde` | The version, the state of the database and of the storage, and the date of the latest backup |
| `alerte` | The cause of a `503` answer |
| `avertissement` | A warning that does not cause `503`, for example a stuck import or export, or a backup dated in the future |
| `controle_donnees` | The latest data check: `etat` (`ok`, `problems`, `late` if there is no data check for 48 hours, `never`), `date`, `erreurs`, `avertissements` |
| `background_imports` | The state of the background imports (see “Check that a large import is not stuck”) |
| `background_exports` | The state of the large exports in the background: `running`, `waiting`, `stuck` (same section) |
| `external_copy` | The external copy of the backups ([Copy the backups outside the server](/docs/back-up-and-restore/#copy-the-backups-outside-the-server)): `state` (`off`, `ok`, `failing`, `late`, `host key to confirm`, `unavailable` in the all-in-one version), `last_success`, `pending` (archives not copied yet). A failing copy never causes `503`: it is in `avertissement`. |

A data problem or a late check **never** makes `/sante/` answer `503`. `503` means “the tool does not answer”. Docker
or Clever Cloud then restart the tool, and a restart fixes neither a figure nor a stopped scheduler. To watch the
nightly check, set an alert on `controle_donnees.etat` = `late`. The email alerts of the tool also say it.

The administrators read the same measures, in plain words, in **Administration › Settings › Health**: one line per
check (version, database, files, last backup, disk space, email, background tasks, database update, HTTPS), with
**Good**, **To check** or **Failure** and what to do. The detail for IT (names of the spaces, folders on the disk,
messages of `/sante/`) is shown only to the space managers and to the administrators of the main space. The same rule
applies to the “For IT” box of **Settings › Hosting**: in another space, the administrator who is not a space manager
does not see the data folder, the allowed addresses, the database server, the SMTP username or the backups folder.

## Check that the data is consistent

Every night at `DATA_CHECK_TIME` (03:30), the tool checks the database of each space. It **changes nothing**. It
checks these points:

- Every stored total and calculation, in the periods that are not closed: the tool calculates it again in memory and
  compares (for closed periods, it only reports)
- No value attached to a deleted KPI or organisation, to a period without a campaign, or recorded twice
- Consistent statuses
- Plausible percentages (−100% to 1,000%)
- Figures of calculated KPIs imported as they are in an open period
- Assignments of open campaigns to inactive or read-only accounts, or to closed organisations
- Evidence files present on the disk (and files left over in `files/evidence`)
- Formulas and their stored dependencies
- A tree with no loop and with consistent levels
- A readable latest backup (valid zip, `backup.json`)

The tool keeps the last 10 results in `backups/data-checks.json`, outside the database, like `restores.jsonl`. The
administrator sees them in **Administration › Settings › Hosting**, in the **Data check** box. This box has the
**Check now** button. When the check finds something, it also shows in **To be handled**.

To run the check by hand, run `docker compose exec web python manage.py check_data`. The French name
`controler_donnees` also works. The command has these options and results:

- Output: readable text in English, or JSON with `--json`
- `--no-save`: the tool does not keep the result
- `SPACE=<code>`: only one space
- Exit code 1 if the check finds an error
- Duration: a few seconds (6 s on the demo, with 6 reporting years)

## Deleted items (trash) and expired sessions

When a person deletes a saved export, a KPI list or a Visualisation view, the tool keeps it in a trash, so that the
person can undo the deletion or restore the item from **My account › Recently deleted**. An administrator sees the
items of everyone in **Administration › History › Recently deleted**. The trash keeps the items for 30 days by
default. An administrator sets this delay, from 1 to 365 days, in **Administration › Settings › Hosting**, box
**Deleted items**. After the delay, the tool erases the item for good.

The `check_data --schedule` process also does a clean-up every night at `DATA_CHECK_TIME`, and once when it starts:

- It erases the expired sessions, like `manage.py clearsessions`. The sessions of all the spaces are in the shared
  registry. A session that is still valid is never erased.
- It erases the deleted items older than the delay, in each space.
- It writes one line in the log: `Nightly clean-up: N expired session(s) and N deleted item(s) erased for good`.

You have nothing to schedule. The tool also does this at each start (`manage.py startup`), and erases the old deleted
items each time someone deletes something. To erase the deleted items by hand, run
`docker compose exec web python manage.py purge_deleted` (French name: `purger_corbeille`; `SPACE=<code>` for only
one space). To erase the expired sessions by hand, run `docker compose exec web python manage.py clearsessions`.

## Check that a large import is not stuck

Large value imports run in the background, in the `run_imports --schedule` process. The image starts this process
next to the backups, the reminders, and the data check. The same process makes the large exports (above the threshold
that the administrator sets in **Administration › Settings › Hosting › Large exports**). Their files are in
`files/exports/` of the data folder, are deleted after 7 days, and are never in the backups: nothing to copy. The details of `/sante/` give `background_imports` for the imports and `background_exports` for the
large exports, with the same three fields:

- `running`: the number of imports (or exports) that run
- `waiting`: the number of imports (or exports) that wait
- `stuck`, with a `message` (also in `avertissement`): an import (or an export) that gives no sign of life, or that
  waits for more than 10 minutes

If an import or an export is stuck:

1. Check that the process runs: `docker compose logs web | grep "Background"`.
2. If necessary, restart the tool: `docker compose restart web`.

A stuck import or export never makes `/sante/` answer `503`. If a restart stops a task, the task starts again once
automatically. After that, the tool marks it as “interrupted”. It tells the person to import the file again, or to ask
for the export again.

## Read the log and manage the services

This table shows the other monitoring operations:

| To… | Do |
|---|---|
| Read the log | Run `docker compose logs -f web`. Each line has the date. The log contains the startup (version, database, addresses, emails), each request (address, page, code, duration), the backups, and the errors. Like the output of the `manage.py` commands, the log is always in English, whatever the language of the interface. |
| See the state of the services | Run `docker compose ps`. |
| Restart | Run `docker compose restart web`. |
| Stop, then start again | Run `docker compose down`, then `docker compose up -d`. The data stays in the volume. |
