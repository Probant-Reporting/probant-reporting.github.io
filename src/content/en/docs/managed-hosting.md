---
title: "Managed hosting"
description: "This guide tells you how to install and run the tool with a managed hosting provider, without a server to manage."
order: 2.5
group: "Get started"
source: "docs/managed_hosting.md"
---

This guide tells you how to install and run the tool with a managed hosting provider, without a server to manage.

The provider runs the tool, applies the security updates of the system, and provides HTTPS. IT has no machine and
no Docker to manage. The automatic updates of the tool are not available: you update with a new deployment.

## Choose a provider

With these providers, **the disk of the application is wiped on every deployment**. For this reason, the uploaded
evidence files, the logo, and the backups must go to storage that lasts.

The table compares the two providers that were examined:

| Provider | Database | Uploaded files (evidence, logo) | Verdict |
|---|---|---|---|
| **Clever Cloud** (France) | PostgreSQL add-on | **FS Bucket**: a persistent folder mounted in the application (Python mode, not Docker) | **Recommended**: the tool works as is |
| Scalingo (France) | PostgreSQL add-on | No persistent folder: object storage (S3) is necessary, and the tool does not support it yet | Not supported |

The reference documentation of Clever Cloud:

- [Python application](https://developers.clever-cloud.com/doc/applications/python)
- [FS Buckets](https://developers.clever-cloud.com/doc/addons/fs-bucket)
- [Environment variables](https://www.clever-cloud.com/doc/reference/reference-environment-variables/)

The panel of each add-on, in the console, shows the exact names of its variables. Check them, because the platform
changes.

## Deploy on Clever Cloud

The deployment takes about 30 minutes.

### Before you start

You need:

- A Clever Cloud account
- The settings of the email server (SMTP) that sends the reminders, the email alerts, and the test emails. You can
  also leave out the `SMTP_…` lines below, and set up the email server in the tool after the deployment (see
  [Installation](/docs/), section 7).

### Create the application and its add-ons

To create the application:

1. In the Clever Cloud console, click **Create** › **an application** › **Python**.
2. Choose the deployment from the GitHub repository (or by `git push` to Clever Cloud).
3. Choose the branch `main` and the Paris region.
4. Add the **PostgreSQL** add-on and link it to the application. The small plan is enough for a few dozen users.
5. Add the **FS Bucket** add-on and link it to the application. It holds the evidence files, the logo, the backups,
   and the secret key.

### Set the environment variables

To set the variables of the application:

1. Open the **Environment variables** tab, in expert mode.
2. Enter these lines. Replace the values in angle brackets and the `…` with your own values.

   ```
   CC_PYTHON_VERSION=3.12
   CC_PYTHON_BACKEND=gunicorn
   CC_PYTHON_MODULE=config.wsgi:application
   CC_PYTHON_MANAGE_TASKS=collectstatic --noinput, startup
   CC_FS_BUCKET=/data:<FS Bucket host, shown in its panel>
   CC_WORKER_COMMAND_0=python manage.py backup --schedule
   CC_WORKER_COMMAND_1=python manage.py send_reminders --schedule
   CC_WORKER_COMMAND_2=python manage.py check_data --schedule
   CC_WORKER_COMMAND_3=python manage.py run_imports --schedule
   DATA_DIR=data
   DJANGO_DEBUG=0
   DJANGO_HTTPS=1
   DOMAIN=<app-xxxx>.cleverapps.io
   SMTP_HOST=…
   SMTP_PORT=587
   SMTP_SECURITY=starttls
   SMTP_USER=…
   SMTP_PASSWORD=…
   SMTP_FROM=reporting@example.com
   ```

The tool still accepts the former French names of the variables, such as `DOSSIER_DONNEES` or `SMTP_HOTE`.

The table shows what these lines set:

| Setting | Effect |
|---|---|
| `DATA_DIR=data` and `CC_FS_BUCKET=/data:…` | The data goes into the `data` folder of the project, which is the FS Bucket. |
| `CC_PYTHON_MANAGE_TASKS` | Runs the same preparation as the Docker image: static files, automatic backup if the database must change, and migrations. |
| Database | You write no variable. The tool reads `POSTGRESQL_ADDON_URI`, which the add-on provides. If the add-on gives another name, write `DATABASE_URL=postgres://…` with the value of the add-on. |
| `CC_WORKER_COMMAND_…` | These tasks run next to the site: the daily backup, the automatic reminders, the nightly data check, and the large value imports. |
| `CC_WORKER_COMMAND_2` | The data check reads the database only and checks its consistency, at `DATA_CHECK_TIME` (03:30 by default). At the same time, the nightly clean-up erases the expired sessions and the old deleted items. Every 15 minutes, this worker also sends the email alerts about the health of the installation, if they are on (**Settings › Health**). |
| `CC_WORKER_COMMAND_3` | Runs the large value imports, above `BACKGROUND_IMPORT_ROWS` rows (5,000 by default), and the large exports (threshold in **Settings › Hosting**). The tool shows a progress bar. Without this worker, the site runs the large imports itself, which is less robust to a restart. |
| `DOMAIN` | The `cleverapps.io` name, or your own domain name after you add it in the **Domain names** tab. Clever Cloud provides HTTPS. |
| `TIME_ZONE` (optional) | The time zone of the installation, `Europe/Brussels` by default. Write an IANA name, for example `TIME_ZONE=America/New_York`. The times of the reminders, of the backup and of the data check, and the dates in the exports, use it. If the name is unknown, the tool does not start. |
| `PUBLIC_URL` (optional) | The address of the tool in the emails and in the redirect URI of company sign-in, for example `https://reporting.example.com`. Set it when you add your own domain name. |

If your plan has no workers, use the scheduled tasks ("cron") of Clever Cloud with these commands:

- `python manage.py backup`, then `python manage.py backup --copy` if an external copy of the backups is set
  (**Settings › Hosting**, box **Copy outside the server**). The command also backs up the shared registry (accounts
  and settings of the installation) once a day, in `data/backups/shared`. With several spaces, add
  `SPACE=<code> python manage.py backup` for each other space, one after the other: the registry is backed up only once.
- `python manage.py send_reminders --auto`
- `python manage.py check_data`
- `python manage.py check_data --alerts`, every 15 minutes: the email alerts about the health of the installation
  (nothing is sent while the alerts are off)
- `python manage.py backup --copy`, every hour, if a destination is set for the external copy of the backups
  (**Settings › Hosting**): copies the archives that are not copied yet (without a destination, the command stops
  with an error)

`send_reminders --auto` sends the reminders of a space only once a day: a second run on the same day sends nothing
(`--simulation` still shows who would be reminded).

### Deploy and create the administrator account

> **Important:** On an empty database, the first visitor to the address of the application creates the administrator
> account. Do steps 2 and 3 immediately after the deployment.

The application starts empty: this is the way to start for real. To look at the tool first with the demo (Exemplia,
a fictitious company), open an SSH console (`clever ssh`) right after the deployment, before step 2, and run
`python manage.py load_demo`. The command shows the demo accounts and their password. That password is public: use
the demo for an evaluation only, then delete the application and its add-ons and deploy again to start empty.

To deploy the tool:

1. Start the deployment. Clever Cloud installs `requirements.txt`, runs the preparation tasks, and then starts
   gunicorn. The deployment log shows the startup summary: version, database, addresses, and emails. This summary is
   in English, like every message for IT.
2. Open the address of the application. On an empty database, the **Setup** wizard appears.
3. Complete step 1 of the wizard, **Administrator account**. For more information, see
   [Installation](/docs/), section 3.

### Check the installation

To check the installation:

1. Open `https://<address>/sante/`. The page responds `{"etat": "ok", …}`.
2. Go to **Administration › Settings › Hosting**. The page shows the version, PostgreSQL, and HTTPS.
3. On the same page, click **Send a test email**. The test email arrives.

## Run the tool

The table shows how to do the usual operations on Clever Cloud:

| To | Do this |
|---|---|
| Update | Push the new version to the deployed branch, or click **Redeploy**. The preparation backs up the database before it migrates it. |
| Back up | By default, the tool backs up automatically every night in `data/backups`, on the FS Bucket. The backups of the PostgreSQL add-on come on top. To download a backup, go to **Administration › Settings › Hosting**. |
| Restore | From the tool, go to **Administration › Settings › Hosting** and click **Restore…**. If the tool no longer starts, open an SSH console (`clever ssh`). Run `python manage.py restore <archive>`, and then restart the application. |
| Go back to the previous version | Warn the teams. Deploy the previous version (push the previous commit to the deployed branch): the preparation applies no migration. Then open an SSH console (`clever ssh`) and restore the “before-update” archive of each space: `python manage.py restore <archive> --yes --rebuild`, and `SPACE=<code> python manage.py restore <archive of this space> --yes --rebuild`. Then restart the application. See also [Installation](/docs/), “Going back to the previous version”. |
| Use several spaces | The shared registry and each space are schemas of the same PostgreSQL database (`commun`, `espace_<code>`). The account of the add-on must be able to create schemas. The registry opens its own connections (about twice as many as before). Check the connection limit of the plan. At most: workers × threads × (2 + number of additional spaces) for the web server, plus 4 × (2 + number of additional spaces) for the background tasks; PostgreSQL allows 100 by default, enough for 2 additional spaces with the defaults. From 3 additional spaces, or if the plan allows fewer: `SPACES_CONN_MAX_AGE=0`, fewer `GUNICORN_THREADS` or `GUNICORN_WORKERS`, or a bigger plan. For more information, see Spaces, § 2. |
| Monitor | The tool sends email alerts about its health (see the worker `CC_WORKER_COMMAND_2`, or `check_data --alerts`). Also connect the monitoring of Clever Cloud (or an external tool) to `/sante/`: it also warns you when the application is stopped. |
| Copy the backups off the platform | A space manager sets an S3-compatible storage or an SFTP server in **Administration › Settings › Hosting**, box **Copy outside the server** (see [Installation](/docs/), “Copy the backups outside the server”). |
| Limit failed sign-ins | Nothing to set up. The tool counts the failed sign-ins in `data/sign-in-attempts`, on the FS Bucket: all the processes and all the instances of the application share the count, and it stays after a redeploy. |
| Read the log | Open the **Logs** tab of the console, or run `clever logs`. |
| Automatic updates | Not available with managed hosting: the page **Settings › Hosting** says so. To update, redeploy (first row). |

## Known limitations

The table shows the limitations of managed hosting and their consequences:

| Limitation | Consequence |
|---|---|
| FS Buckets are made for files, not for a database. | The database goes into the PostgreSQL add-on, never into SQLite on the FS Bucket. |
| Clever Cloud backs up the FS Bucket every 24 hours, with 72 hours of retention. | The backups of the tool remain the reference. The tool keeps the 14 most recent ones by default (14 days with the daily backup). Download them from time to time. |
| A backup keeps the evidence files that existed when it was made. | An evidence file that an administrator deletes (**Administration › Evidence to delete**) stays in the backups that exist, in `data/backups` and in the FS Bucket backups (72 hours), until they are replaced. A restore brings it back to the list. Lower the number of backups kept for very sensitive data, and delete your external copies on a matching schedule. See [Installation](/docs/), “Backups and deleted evidence”. |
| Scalingo, and any provider without a persistent folder, need object storage. | Object storage (S3) for the evidence files is necessary (django-storages). It can come in a later version, if the need is confirmed. The external copy of the backups to S3 does not replace it. |
