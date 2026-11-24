---
title: "Security and data"
description: "Where your data lives, who can see it, the protections that are on by default and how backups work."
order: 1
group: "Trust"
---

Your data stays on the server you choose: your own server with Docker, or managed hosting with Clever Cloud.

## Who sees what

- The administrators create the accounts in the tool. There is no SSO.
- Each person sees only the organisations and the KPIs that their role allows.
- The reader and the auditor have read-only access.
- The history records every change: who entered, changed or validated a value, and when.
- AI assistants can connect only if an administrator allows it. An assistant has the same rights as the person who connects it. Every call is recorded in the history.
- A closed year stays as it was published: its organisation tree and its figures are kept.

## Protections that are on by default

- The server runs without root rights.
- A session expires after 12 hours.
- Evidence files are served only after a permission check. A direct link is not enough to open one.
- After 5 failed sign-ins for the same identifier from the same address, sign-in is refused for 15 minutes.
- The tool sends the headers `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: same-origin`.
- Over HTTPS, the certificate is created and renewed automatically.

## Backups

- The tool backs itself up automatically. A backup contains the database and the evidence files.
- An administrator can restore a backup from the tool, after a confirmation.
- Keep a copy of the backups outside the server. Your IT team sets that up.

More details for IT: [Back up and restore](/docs/back-up-and-restore/), [Change the settings](/docs/change-the-settings/).
