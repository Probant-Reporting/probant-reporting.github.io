---
title: "Set up emails (SMTP)"
description: "The tool sends emails through the email server (SMTP) of your company: reminders and test emails. You can set up this server in two ways. The settings…"
order: 7
group: "Run"
source: "docs/installation.md"
---

The tool sends emails through the email server (SMTP) of your company: reminders and test emails. You can set up
this server in two ways. The settings apply to the whole installation, for all spaces.

| Way | Who | When to use it |
|---|---|---|
| In the tool: **Administration › Settings › Hosting**, **Emails** box | A space manager | The usual way. IT only gives the settings of a sending account. No restart. |
| In the `.env` file (`SMTP_…` settings) | IT | When IT wants to keep the settings on the server. These settings take priority. |

Without either, the tool sends no email. It only writes the messages in the log (`docker compose logs web`).

## Set up emails in the tool

Before you start, ask IT for the settings of a sending account: server, port, security (STARTTLS or SSL/TLS),
username, password, and sending address. The **Message to send to IT** in the **Emails** box gives a ready text.

To set up emails in the tool:

1. Go to **Administration › Settings › Hosting**. The **Emails** box shows the fields of the sending server.
2. Enter the **Sending server (SMTP)**, for example `smtp.example.com`, without `smtp://` and without the port.
3. Enter the **Port** and choose the **Security**: **STARTTLS** (usually port 587) or **SSL/TLS** (usually port 465).
   With these two choices, the tool checks the certificate of the server. **None** sends the password without
   encryption: use it only on a closed internal network. With **None** and a password, the tool asks you to confirm.
4. Enter the **Username**, the **Password** and the **Sending address**.
5. Click **Save**.
6. Under **Test email**, click **Send a test email**. The test uses the saved settings. If the email is not sent, a
   message gives the cause in plain words: server not found, connection refused, time limit exceeded, certificate,
   security setting, username or password refused, sending address refused.

The password works like this:

- The tool never shows the password again. It never writes it in the history, in the log, or in the configuration
  file that you export.
- To keep the saved password, leave the field empty when you save. To remove it, click **Remove the password**.
- If you change the server, the port or the username, or set the security to “None”, the tool deletes the saved
  password, so that it never goes to another server. Enter it again in the same save; the screen says so if you do not.
- The tool keeps the password encrypted with the secret key of the installation (`DJANGO_SECRET_KEY`, or the file
  `/data/.secret_key`). The backup of a space never contains the email settings. The backup of the shared registry
  (`backups/shared`, only for IT) contains them, with the password encrypted.
- If the secret key changes, or if IT restores the shared registry on another server, the tool can no longer read the
  password. The **Emails** box and **Settings › Health** then say that the password must be entered again. No email
  is sent until then. Enter the password again and save.

To limit the misuse of the test button, the tool allows at most 5 test emails every 15 minutes with the settings of
the tool, and waits 10 seconds at most for the server. The error message never shows the answer of the server. Each
failed test is written in the history.

Only a space manager can change these settings. The other administrators see the server and the sending address, and
can send a test email with the saved settings.

## Set up emails in the `.env` file

To set up emails in the `.env` file:

1. Add these values to `.env`:

   ```
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURITY=starttls        # starttls (587), ssl (465) or none
   SMTP_USER=reporting@example.com
   SMTP_PASSWORD=…
   SMTP_FROM=reporting@example.com
   ```

2. Run `docker compose up -d`.
3. Go to **Administration › Settings › Hosting**, and click **Send a test email**. If the email is not sent, a message
   gives the cause.

> **Note:** When `SMTP_HOST` is set, the `.env` file takes priority over the settings entered in the tool. The
> **Emails** box then shows the settings of the `.env` file read-only (without the password), with the mention
> "Set by IT in the settings file". To go back to the settings of the tool, empty `SMTP_HOST` and restart the tool.

## Reminders

The team in charge manages the reminder emails in **Dashboard › Remind…**. Each person receives a single email, with
no copy. The email lists what the person still has to enter. Before the tool sends the email, it shows the exact
preview of the message. The team in charge sets the template.

The team in charge can turn on automatic reminders on the same page. The tool sends them on the chosen days before
the end of data entry. It checks for them every day at `REMINDER_TIME` (09:00 by default). `PUBLIC_URL` gives the
address in these emails. By default, the tool takes this address from `DOMAIN`.
