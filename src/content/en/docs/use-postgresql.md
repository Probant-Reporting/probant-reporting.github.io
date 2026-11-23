---
title: "Use PostgreSQL"
description: "SQLite is the default database. You do not need to manage a database server. SQLite writes one save at a time. The other saves wait for their turn, for up…"
order: 8
group: "Run"
source: "docs/installation.md"
---

SQLite is the default database. You do not need to manage a database server. SQLite writes one save at a time. The
other saves wait for their turn, for up to 60 seconds.

## Capacity

Two load tests measured the capacity. The capacity depends on the size of the database, because each save
recalculates the totals that it changes. This table shows the results:

| Database | Measure | Result |
|---|---|---|
| Small (the demo) | Load test, SQLite, server with 2 to 4 processors used only by the tool | Comfortable with up to about 100 people who enter data at the same moment |
| Large (679 organisations, 1.27 million answers) | Load test. Each simulated person works about ten times faster than a real person. | SQLite: 10 very active people without an error. From 15 to 20 people, some saves fail with "database is locked". PostgreSQL: 50 people without an error and without a lost save, but saves wait in a queue. |

Recommendation: use PostgreSQL when more than about twenty people are active at the same moment. Also use PostgreSQL if
the server runs other heavy programs, and give the server more processors.

During the busiest days of a campaign, avoid the operations that rewrite everything at once:

- **Redo all calculations** on a campaign
- Reopening a closed campaign
- Adding or deactivating an organisation
- An import of several thousand rows

The tool writes an import in blocks of 100 rows. Other people are not blocked, but the import takes longer. Above
`BACKGROUND_IMPORT_ROWS` rows, the import runs in the background, one import at a time.

## Switch to PostgreSQL

You can switch to PostgreSQL in 2 ways. This table shows the settings in `.env` for each way:

| Option | Setting in `.env` |
|---|---|
| PostgreSQL provided in the same file | `COMPOSE_PROFILES=postgres` and `DATABASE_URL=postgres://probant:PASSWORD@db:5432/probant`, where `PASSWORD` is the value of `POSTGRES_PASSWORD`. |
| Existing PostgreSQL server | `DATABASE_URL=postgres://user:password@server:5432/database`. Encode a special character in the password. For example, `@` becomes `%40`. |

With PostgreSQL, the backup contains the database in JSON format. You can restore it only with the version of the tool
that made it. To go back to the previous version after an update, see
[Going back to the previous version](/docs/update-the-tool/#going-back-to-the-previous-version).

After a large load in one step, the tool updates the statistics of the PostgreSQL planner (`ANALYZE` on the tables of
the space). A large load is a restore, the installation or update of a library template, the import of a configuration
file, or a data takeover. The database user must own the tables of the tool. This is the case when the tool creates
them. If `ANALYZE` fails, the operation is kept and the log shows a warning. PostgreSQL then updates the statistics
itself, a few minutes later.

## Move an existing SQLite installation to PostgreSQL

Do this when nobody works in the tool: whatever people enter after the backups of step 1 is lost. Keep the same data folder
(the same `/data` volume), use an empty PostgreSQL database, and keep the same version of the tool.

The move needs these archives: one backup in JSON format for **each space**, and one archive of the **shared registry**
(accounts, list of spaces, access). The new PostgreSQL registry has a new identity. Without the archive of the registry, the
tool refuses the backup of the main space (“another installation”).

Do these steps in this order:

1. Back up each space in JSON format. Run `docker compose exec web python manage.py backup --json` for the main space, and
   `docker compose exec -e SPACE=<code> web python manage.py backup --json` for each other space. The command
   `docker compose exec web python manage.py spaces` lists the spaces and their codes.
2. Make an archive of the shared registry:
   `docker compose exec web python manage.py shell -c "from parametres import sauvegardes as SV; print(SV.creer_registre('before-postgresql'))"`.
   The tool also makes one every day in `backups/shared/`: use it only if nobody created or changed an account since then.
3. Write down the name of each archive: `backups/` (main space), `backups/spaces/<code>/` (other spaces), `backups/shared/`
   (registry). Copy the three folders off the server.
4. Change `DATABASE_URL` in `.env`.
5. Run `docker compose up -d`. The tool starts with an empty database and shows the setup wizard. Do not use the wizard.
6. Restore the shared registry: `docker compose exec web python manage.py restore --shared <registry archive> --yes`.
   The command can end with a database error about a table that does not exist (`relation "referentiel_utilisateur"
   does not exist`). This is expected, because the other spaces have no tables yet. The registry is restored. Run
   `docker compose exec web python manage.py spaces` to check that it lists your spaces.
7. Restore the main space: `docker compose exec web python manage.py restore <archive of the main space> --yes`.
8. Restore each other space: `docker compose exec -e SPACE=<code> web python manage.py restore <archive of this space> --yes --rebuild`.
   The option `--rebuild` creates the tables of the space in PostgreSQL before it loads the archive.
9. Run `docker compose restart web`. Sign in, and check the values of each space.

If the installation has only the main space, you can make it shorter. Skip steps 2, 6, and 8, and add `--other-space` to
step 7. This way, the tool creates the registry again from the accounts of the main space. The tool does not keep the
name of the space or the accounts that exist only in another space.

The command `python manage.py shell` in step 2 is the only way to make an archive of the registry on demand. The tool does not
have a command for it. We compared the data of the PostgreSQL installation with the SQLite installation, table by table, for
two spaces: it is identical (only the numbers of the access rows of the registry change).

## Several spaces with PostgreSQL

Each space (department) opens its own connections to the database. Before you create many spaces, check the
connection limit of your plan (small Clever Cloud plans). See docs/spaces.md.
