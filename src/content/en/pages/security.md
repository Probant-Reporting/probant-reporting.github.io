---
title: "Security and data"
description: "Where your data lives, who can see it, how people sign in, the protections that are on by default, the signed image, the updates and the backups."
order: 1
group: "Trust"
---

Your data stays on the server you choose: your own server with Docker, or managed hosting with Clever Cloud. The tool sends no usage data and no statistics, to the people who develop it or to anyone else.

For a security review, send your security team the [Security overview](/docs/security-overview/): architecture, data kept, network flows, encryption, and short answers to the usual questions. The list of what IT prepares is in [What to prepare](/docs/it-request/).

## Who sees what

- The administrators create the accounts in the tool and give each person a role.
- Each person sees only the organisations and the KPIs that their role allows.
- The reader and the auditor have read-only access.
- The history records every change: who entered, changed or validated a value, and when.
- AI assistants can connect only if an administrator allows it. An assistant has the same rights as the person who connects it. Every call is recorded in the history.
- A closed year stays as it was published: its organisation tree and its figures are kept.

## How people sign in

- By default, with a password. After 5 failed sign-ins for the same identifier from the same address, sign-in is refused for 15 minutes.
- Or with their company account: Microsoft Entra ID, Google, Okta, Keycloak and the other services that follow the OpenID Connect standard. This is off by default. A space manager turns it on for the whole installation.
- The company account only proves who the person is. The tool creates no account and takes no role from the provider: the accounts and the roles stay in the tool.
- When company sign-in is on, only the space managers keep their password, as rescue accounts. A person that your company blocks at the provider can no longer sign in. A person who cannot sign in with a password cannot use an AI assistant either.
- The tool has no second factor of its own (a code on top of the password). With the company account, your provider applies its own. The tool doesn't support SAML or LDAP.

## Protections that are on by default

- The server runs without root rights.
- A session expires after 12 hours.
- Evidence files are served only after a permission check. A direct link is not enough to open one.
- The tool sends the headers `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and `Referrer-Policy: same-origin`.
- Over HTTPS, the certificate is created and renewed automatically. Or the tool uses the certificate of your company.
- The passwords and secrets that you save in the tool (email server, copy of the backups, company sign-in) are encrypted. The tool never shows them again, and asks for them again when their destination changes. Only a space manager changes these settings, which apply to the whole installation.

## Signed image and updates

- Each published image of the tool, from version 1.1.0, is signed: anyone can check that the official repository built it. Its list of components (SBOM) comes with it, and each release has a report of the known vulnerabilities.
- The installation and the updates check each file against the signed list of the version. If the list is missing or one file doesn't match, nothing changes.
- After an installation with one command, the server installs each new version at night, 3 days after its publication. It installs only an image with a verified signature, backs up each space first, and goes back to the previous version if the new one doesn't respond. A space manager can choose to be notified only, or turn this off.
- The tool itself never connects to the internet to look for a new version: a task of the server does that work.
- Security corrections come in the latest version only. To report a vulnerability, follow the [security policy](https://github.com/Probant-Reporting/probant/blob/main/SECURITY.md).

## Backups

- The tool backs itself up automatically. A backup contains the database and the evidence files.
- An administrator can restore a backup from the tool, after a confirmation. A space manager can also restore a backup of another installation (change of server, lost server, all-in-one version): the tool cannot check such a file, so it asks for two confirmations and gives the other accounts a temporary password to set.
- Keep a copy of the backups outside the server. Your IT team copies them. Or a space manager sets a destination in the tool, a storage space that your IT team provides (S3-compatible storage or SFTP server): the tool then copies each new backup there. By default, it deletes nothing at the destination.
- If a backup or a copy fails, an email alert tells you. On a new installation, the alerts are on as soon as the emails are set. On an installation that you update, they stay off until a space manager turns them on.
- The backups are signed, not encrypted. The encryption of the disk is up to your IT team.
- The all-in-one version, for a trial on a computer, has no copy outside the computer and no company sign-in.

More details for IT: [Back up and restore](/docs/back-up-and-restore/), [Update the tool](/docs/update-the-tool/), [Sign in with a company account](/docs/single-sign-on/), [Change the settings](/docs/change-the-settings/).
