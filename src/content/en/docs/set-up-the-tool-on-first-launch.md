---
title: "Set up the tool on first launch"
description: "When you first open the tool, it has no account yet. The Setup wizard opens in place of the sign-in page. It has 8 steps."
order: 3
group: "Get started"
source: "docs/installation.md"
---

When you first open the tool, it has no account yet. The **Setup** wizard opens in place of the sign-in page. It has
8 steps.

> **Important: create the administrator account right away.** Until step 1 is done, the first person who opens the
> address of the tool creates the administrator account. After step 1, the wizard opens only for that account.

The tool asks for no installation code. As long as nothing is created, the tool holds no sensitive data. What
protects it is the order of the steps: you create the administrator account right after the installation, and
before you share the address.

To set up the tool:

1. Right after the installation (or deployment), open the address of the tool. The **Setup** wizard opens. To look at
   the demo instead, load it now, before step 1: see “Start empty, or with the demo”.
2. Complete step 1, **Administrator account**, before you share the address.
3. Complete the other steps, or give the address to the person who does the setup.

If step 1 has to wait, keep the tool unreachable from the Internet until then. For example, do not set the domain
name yet.

This table shows the 8 steps of the wizard:

| Step | Name | What you set |
|---|---|---|
| 1 | **Administrator account** | The account of the administrator |
| 2 | **Your organisation** | The name, logo, and colours of the tool |
| 3 | **Languages** | The default language and the content languages |
| 4 | **Organisation** | The levels of the tree and the organisations |
| 5 | **Frameworks** | The KPI frameworks: the KPIs to collect |
| 6 | **KPI sheet** | Description categories, units, types, and fields |
| 7 | **Team** | The accounts of contributors and validators |
| 8 | **First campaign** | The period, the dates, and the opening of data entry |

You can stop and continue later. The person who does the setup does not need the IT team, except for emails
(section 7).

The account of step 1 is also the first **space manager**. Only the space managers change the settings of the whole
installation: the email server, the email alerts, the automatic updates, the external copy of the backups, and the
company sign-in. The other administrators cannot change them. See docs/spaces.md.

After the setup, each person signs in with their email address. The **Dashboard** shows the progress of the
collection:

Data entry also works on a phone:

## Start empty, or with the demo

A new installation is empty: you set up your own structure with the wizard. This is the way to start for real.

To look at the tool first, you can load the demo instead: Exemplia, a fictitious company, with its organisations,
its KPIs and three reporting years. Do it before step 1 of the wizard, on the empty database:

```bash
docker compose exec web python manage.py load_demo
```

The command shows the demo accounts and their password.

> **Important:** the password of the demo accounts is public. Load the demo only on an installation that you use for
> an evaluation, and do not leave it open to the internet. The command refuses a database that already holds your
> data. To start for real afterwards, delete the evaluation and its data (`docker compose down -v`), then install
> again: the tool starts empty.
