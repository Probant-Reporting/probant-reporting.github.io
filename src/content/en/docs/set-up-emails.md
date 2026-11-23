---
title: "Set up emails (SMTP)"
description: "Without SMTP, the tool sends no email. It only writes the messages in the log (docker compose logs web)."
order: 7
group: "Run"
source: "docs/installation.md"
---

To set up emails:

1. Add these values to `.env`:

   ```
   SMTP_HOST=smtp.office365.com
   SMTP_PORT=587
   SMTP_SECURITY=starttls        # starttls (587), ssl (465) or none
   SMTP_USER=reporting@example.com
   SMTP_PASSWORD=…
   SMTP_FROM=reporting@example.com
   ```

2. Run `docker compose up -d`.
3. Go to **Administration › Settings › Hosting**, and click **Send a test email**. If the email is not sent, a message
   gives the exact cause.

Without SMTP, the tool sends no email. It only writes the messages in the log (`docker compose logs web`).

## Reminders

The team in charge manages the reminder emails in **Dashboard › Remind…**. Each person receives a single email, with
no copy. The email lists what the person still has to enter. Before the tool sends the email, it shows the exact
preview of the message. The team in charge sets the template.

The team in charge can turn on automatic reminders on the same page. The tool sends them on the chosen days before
the end of data entry. It checks for them every day at `REMINDER_TIME` (09:00 by default). `PUBLIC_URL` gives the
address in these emails. By default, the tool takes this address from `DOMAIN`.
