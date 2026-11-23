---
title: "Get {name}"
description: "Three ways to get {name}: try it on your computer, install it on a server, or use managed hosting. The software is free."
order: 2
group: "Product"
---

{name} is free software, under the AGPL-3.0-or-later licence. The code, each version, and its notes are on GitHub:

- [Latest release](https://github.com/Probant-Reporting/probant/releases/latest)
- [Source code](https://github.com/Probant-Reporting/probant)
- [What's new in each version](/whats-new/)

Not sure yet? Take the [guided tour](/tour/), or use the [trial on the home page](/#try). You don't need to install anything for either.

## Try it on your computer

This is a trial, not a working installation. Use it to look around, on your own computer. For your team, install {name} on a server.

### The all-in-one version, for Windows or Mac

Try {name} on your computer (trial): download the all-in-one version for Windows or Mac, extract it and double-click Start. For one person only, not for team use or data you need to keep.

- [Download the all-in-one version for Windows](https://github.com/Probant-Reporting/probant/releases/latest/download/probant-windows.zip)
- [Download the all-in-one version for Mac](https://github.com/Probant-Reporting/probant/releases/latest/download/probant-mac.zip)

At the first start, a window asks what you want to try:

- **With the demo.** Type 1. {name} opens on Exemplia, an invented company with its organisations, its KPIs and three reporting years. The window shows the account and its password.
- **Empty.** Type 2. The setup wizard opens, and you set up your own structure: your levels, your organisations, your KPIs.

To change your mind, double-click Reset: it deletes your trial, and the next start asks again.

### With Docker

You need Docker and Git, on a Mac or a Linux computer. On Windows, use WSL. You choose at step 2: with the demo, or empty.

1. Get the code and start the tool:

   ```bash
   git clone https://github.com/Probant-Reporting/probant.git probant
   cd probant
   ./install.sh
   ```

   The first start takes 3 to 5 minutes. The script shows the address to open.

2. Choose how the tool starts:

   - **With the demo.** Before you open the address, load the demo company, Exemplia:

     ```bash
     docker compose exec web python manage.py load_demo
     ```

     The command shows the demo accounts and their password.

   - **Empty.** Run nothing more. Open the address: the setup wizard opens, and its first step creates your administrator account.

3. To delete the trial and all its data:

   ```bash
   docker compose down -v
   ```

## Install it on a server

This part is for your IT team. They need a 64-bit Linux server with Docker and Git. They don't need to know Python.

1. Get the code and go to its folder:

   ```bash
   git clone https://github.com/Probant-Reporting/probant.git probant
   cd probant
   ```

2. Run the installer:

   ```bash
   ./install.sh    # or: ./install.sh --domain reporting.example.com
   ```

   With `--domain`, the tool opens over HTTPS, and the certificate is created and renewed automatically.

3. Open the address that the script shows. You choose here how the tool starts:

   - **Empty.** This is how you start for real. The setup wizard opens, and its first step creates the administrator account. Do this step immediately.

   - **With the demo.** This is for an evaluation only. Before you open the address, load Exemplia, the demo company:

     ```bash
     docker compose exec web python manage.py load_demo
     ```

     The password of the demo accounts is public: do not leave this installation open to the internet. To start for real afterwards, delete the evaluation and its data (`docker compose down -v`), then run `./install.sh` again.

To update later, run `./update.sh` in the same folder. The script backs up the data first.

The Docker image of each version is also published as `ghcr.io/probant-reporting/probant`.

- [Installation guide in the repository](https://github.com/Probant-Reporting/probant/blob/main/docs/installation.md)
- The same guide on this site: [Prerequisites](/docs/prerequisites/), [Install the tool](/docs/install-the-tool/), [Update the tool](/docs/update-the-tool/)

## Managed hosting

If your IT team doesn't want to manage a server, a hosting provider can run {name}. The guide covers Clever Cloud, a French provider. It runs the tool, applies the system's security updates, and provides HTTPS.

- The deployment takes about 30 minutes.
- **Empty.** The application starts empty, and the setup wizard creates the administrator account. This is how you start for real.
- **With the demo.** For an evaluation only: right after the deployment, open an SSH console and run `python manage.py load_demo`. The password of the demo accounts is public. To start for real afterwards, delete the application and deploy again.
- You need a Clever Cloud account, and the settings of an email account for the reminders.
- You create a Python application from the repository, with two add-ons: PostgreSQL for the database, and FS Bucket for the evidence files and the backups.

You pay the provider for the hosting. {name} itself stays free.

- [Managed hosting guide in the repository](https://github.com/Probant-Reporting/probant/blob/main/docs/managed_hosting.md)
- The same guide on this site: [Managed hosting](/docs/managed-hosting/)

## Hear about new versions

- On GitHub, open the [repository](https://github.com/Probant-Reporting/probant), then choose **Watch › Custom › Releases**. GitHub then notifies you of each new version.
- Or follow the [RSS feed](/rss.xml) of this site in your feed reader.

There's no newsletter and no form: this site doesn't collect email addresses.
