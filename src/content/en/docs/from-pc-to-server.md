---
title: "From the all-in-one version to a server"
description: "You tried Probant with the all-in-one version on a computer, and you entered real data. This page tells you how to move this data to a server without…"
order: 3.5
group: "Get started"
source: "docs/from_pc_to_server.md"
ids: {"Before you start":"from-pc-to-server-before-you-start"}
---

You tried Probant with the all-in-one version on a computer, and you entered real data. This page tells you how to
move this data to a server without losing anything. Part 1 is for the person who uses the tool on the computer. Part 2
is for the IT team that installs the server. Without an IT team, give part 2 to the person or the provider who
installs the server.

The method is simple: you send the whole `data` folder of the all-in-one version. The server uses it as its data
folder.

## What moves to the server

| Item | Moves | Comment |
|---|---|---|
| Accounts and passwords | Yes | Each person signs in with the same password. |
| Values, frameworks, campaigns, history, settings | Yes | Except the password of the email server, if it is saved in the tool: enter it again on the server. |
| Evidence files and logo | Yes | |
| Other spaces | Yes | |
| Assistant tokens (MCP) | Yes | |
| Sign-in sessions | No | Each person signs in again once. |
| Secret key | No | The all-in-one version keeps its own key in `data/.secret_key_all_in_one`. The server never uses it: it makes its own key at its first start. Step 4 of part 2 deletes the copy of the computer's key. |
| Backups made on the computer | Yes, as files | The server lists them, but **Restore…** refuses them: another installation signed them. IT can still restore one, see [Restore a backup](/docs/back-up-and-restore/#restore-a-backup). |

## Before you start

- **Demo**: if you chose the demo at the first start, do not move the folder. The demo accounts have a public
  password. Install the server empty and enter your data there. If a demo folder arrives on a server, the startup
  summary of the server shows a line that starts with `WARNING: this is the demo database`, and
  **Settings › Health** shows **Demo data** to check until no demo account has the public password.
- **Version**: the server must have the same version of the tool as the computer, or a more recent version. The
  version shows at the bottom of each page.

## Part 1: on the computer

1. Tell the people who enter data to stop. What anyone enters on the computer after step 3 is not on the server.
2. Optional: make a safety copy. Go to **Administration › Settings › Hosting**, then click **Create and download a
   backup**. Keep the file.
3. Close the window of the tool. This stops the tool. Do not copy the folder while the tool runs.
4. Make a `.zip` file of the `data` folder, which is next to `Start.bat` or `Start.command`:
   - Windows: right-click `data`, then **Send to › Compressed (zipped) folder**.
   - Mac: Control-click `data`, then **Compress "data"**.
5. Give the `.zip` file to the IT team in a safe way, for example on a USB key or with a secure file transfer. Do not
   send it in an ordinary email: it contains all your data and the protected form of the passwords.
6. Keep the all-in-one version until the server works. Then you can delete it.

## Part 2: on the server (IT)

### Docker with SQLite (default)

Do these steps before the first start of the tool, while its data volume is empty.

1. Install the tool, but do not start it: do steps 1 and 2 of
   [Install without the script](/docs/install-the-tool/#install-without-the-script), then run `docker compose build web`.
2. Extract the `.zip` file next to the folder of the tool, for example into `../pc-data`. Do not extract it into the
   folder of the tool. The folder must contain `db.sqlite3` and `shared.sqlite3`.
3. Check that it is not the demo: `cat ../pc-data/.package-ready` shows `empty`. If it shows `demo`, stop and read
   [Before you start](#from-pc-to-server-before-you-start).
4. Copy the folder into the data volume:

   ```bash
   docker compose run --rm --no-deps -v "$(pwd)/../pc-data:/import:ro" web sh -c "cp -R /import/. /data/ && rm -f /data/.secret_key_all_in_one"
   ```

   The copied files belong to the user of the tool, and only this user can read them. The command deletes the
   secret key of the computer: the server makes its own.
5. Start the tool: `docker compose up -d`. Read the startup summary: `docker compose logs web`. It shows the name of
   the installation and the number of accounts, and “New secret key created”. It does not show a `WARNING` line.
6. Check the move:
   - `http://SERVER-ADDRESS:8000/sante/` responds `{"etat": "ok"}`.
   - A person signs in with the same email and password as on the computer.
   - A value and its evidence file open.
7. Delete the `.zip` file and the folder `../pc-data`: they contain the protected form of the passwords.

If the tool already started on this server and nobody used it yet, empty the volume first: run `docker compose down`,
then `docker volume rm probant_donnees`. Then do steps 4 to 7. Never copy the folder over a data volume in use: an old
`db.sqlite3-wal` file next to the new database can damage it.

**Without Docker**: stop the tool, put the content of the folder into the data folder (`DATA_DIR`) before the first
start, then run `python manage.py startup` and start the tool.

### PostgreSQL

The all-in-one version uses SQLite. Do the move in two stages:

1. Do the steps of [Docker with SQLite](#docker-with-sqlite-default), with `DATABASE_URL` empty in `.env`. Check
   that the tool works.
2. Follow [Move an existing SQLite installation to PostgreSQL](/docs/use-postgresql/#move-an-existing-sqlite-installation-to-postgresql).
   The archive of the shared registry carries the passwords.

**Managed hosting** ([Clever Cloud](/docs/managed-hosting/)) has no SQLite. Do stage 1 on any computer with Docker. On
this computer, make the two archives of steps 1 and 2 of the PostgreSQL move. Copy them to `data/backups/` and
`data/backups/shared/` on the FS Bucket. Then, in an SSH console (`clever ssh`), before anyone uses the setup wizard:

```bash
python manage.py restore --shared <registry archive> --yes
python manage.py restore <archive of the main space> --unsigned --yes
```

Then restart the application. The option `--unsigned` is necessary because another computer made the archive. Both
computers must run the same version of the tool.

### If you have only a backup file

If the person cannot send the `data` folder, the backup of step 2 of part 1 also moves the data, with these limits:
the passwords do not move, and only the space of the backup moves.

The simplest way is in the tool. Install the server empty. The administrator creates their account at step 1 of the
setup wizard, then opens **Start from a backup** at step 2, chooses the file, and confirms. This administrator keeps
their password and stays an administrator. They then give the other accounts a temporary password in
**Administration › Accounts**. See
[Restore a backup from another installation](/docs/back-up-and-restore/#restore-a-backup-from-another-installation).

IT can also restore it from the command line, on a server with SQLite, before anyone uses the setup wizard:

1. Copy the archive into the volume: `docker compose cp <archive>.zip web:/data/backups/`.
2. Run `docker compose exec web python manage.py restore <archive>.zip --unsigned --other-space --yes`, then
   `docker compose restart web`.
3. Give a password to one administrator: `docker compose exec web python manage.py changepassword <username>`. This
   administrator gives the other accounts a temporary password in **Administration › Accounts**.

## Messages you can see

| Message | What to do |
|---|---|
| “This backup was not made by this installation, or it was changed after it was made” (page **Hosting**) | Normal for a backup made on the computer, when the person who adds the file is not a space manager. A space manager can restore it from the tool. Or use the `data` folder, or restore the backup from the command line with `--unsigned`. |
| “This backup does not come from this installation” (page **Hosting**, or **Start from a backup** in the setup wizard) | Normal for a backup made on the computer. Read the page, select the two boxes, and enter the word. |
| “… other accounts will have no password” (same page) | The backup carries no passwords. After the restore, give these accounts a temporary password in **Administration › Accounts**. |
| “This backup comes from another installation of the tool” (`restore`) | Normal for a backup made on the computer. Add `--other-space` (section [If you have only a backup file](#if-you-have-only-a-backup-file)). |
| “… account(s) of this space have no password on this server” | The backup carries no passwords. Do step 3 of [If you have only a backup file](#if-you-have-only-a-backup-file). |
| `WARNING: this is the demo database` (startup summary) | The folder comes from the demo. Install the server empty: see [Before you start](#from-pc-to-server-before-you-start). |
