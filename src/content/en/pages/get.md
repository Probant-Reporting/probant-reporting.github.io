---
title: "Get {name}"
description: "Three ways to get {name}: try it on your computer, install it on a server with one command or use managed hosting. The software is free."
order: 2
group: "Product"
replis: true
lead: false
---

{name} is free software, under the AGPL-3.0-or-later licence:

- [Latest release](https://github.com/Probant-Reporting/probant/releases/latest)
- [Source code](https://github.com/Probant-Reporting/probant)
- [What's new in each version](/whats-new/)

## Try it on your computer

### The all-in-one version, for Windows or Mac

Download it, extract it, then run Start. Only for discovery of the tool, not for team use or data you need to keep.

- [Download the all-in-one version for Windows](https://github.com/Probant-Reporting/probant/releases/latest/download/probant-windows.zip)
- [Download the all-in-one version for Mac](https://github.com/Probant-Reporting/probant/releases/latest/download/probant-mac.zip)

At the first start, a window asks what you want to try:

- **With the demo.** Type 1. {name} opens on Exemplia, an invented company with its organisations, its KPIs and three reporting years. The window shows the account and its password.
- **Empty.** Type 2. The setup wizard opens. You set up your own structure: your levels, your organisations, your KPIs.

To change your mind, double-click Reset. It deletes your trial. The next start asks the question again.

The all-in-one version has no sign-in with a company account, no copy of the backups outside the computer and no automatic updates. A server has them.

### With Docker

You need Docker and Git, on a Mac or a Linux computer. On Windows, use WSL.

1. Get the code from GitHub and start the tool:

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

   - **Empty.** Run nothing more. Open the address: the setup wizard opens. Its first step creates your administrator account.

3. To delete the trial and all its data:

   ```bash
   docker compose down -v
   ```

## Install it on a server

This part is for the IT team. They need a 64-bit Linux server with Docker and `curl`. On Debian or Ubuntu, the installer offers to install Docker. Before the installation, send them [What to prepare](/docs/it-request/) and the [Security overview](/docs/security-overview/).

### With one command

The command installs the latest published version of {name}, from its signed image. It checks each file against the signed list of the version before it puts it in place: without that list, or if one file doesn't match, it installs nothing. The command exists from version 1.1.0: if the [latest release](https://github.com/Probant-Reporting/probant/releases/latest) is older, install with Git (below).

1. On the server, run this command in the folder that will hold the tool, for example `/opt`:

   ```bash
   curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh | sudo sh -s -- --domain reporting.example.com
   ```

   With `--domain`, the tool opens over HTTPS, and the certificate is created and renewed automatically. Without it, the tool opens over HTTP on port 8000, for an internal network or a trial. The installation takes about 2 minutes. At the end, the command shows the address to open and the folder of the tool, `probant`.

2. Open the address. You choose here how the tool starts:

   - **Empty.** To start for real. The setup wizard opens. Its first step creates the administrator account. Do this step immediately.

   - **With the demo.** This is for an evaluation only. Before you open the address, load Exemplia, the demo company, in the folder `probant`:

     ```bash
     docker compose exec web python manage.py load_demo
     ```

     The password of the demo accounts is public: do not leave this installation open to the internet. To start for real afterwards, delete the evaluation and its data (`docker compose down -v`), then run `./install.sh` in the same folder.

After this installation, the server installs each new version at night, 3 days after its publication. It backs up the data first, and goes back to the previous version if the new one doesn't respond. In the tool, a space manager can choose **Notify only** or **Off** instead. To install without the automatic updates, add `--auto-update off` to the command.

### Check the server first

The check reads Docker, the memory, the disk, the ports, the domain name, the network and the clock. It says what is missing and changes nothing. The installer runs the same check before a new installation.

```bash
curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh | sudo sh -s -- --check --domain reporting.example.com
```

### Without Internet access

Each version has an offline package on its release page, from version 1.1.0: the image of the tool, the image of Caddy for HTTPS and the installation files, signed. Docker must already be on the server. Copy the package to the server, extract it, then run `./install.sh --offline` with the image archive. The package doesn't hold PostgreSQL. See [Install without Internet access](/docs/install-the-tool/#install-without-internet-access).

### On a company network

Caddy can serve the HTTPS certificate of your company (`--cert` and `--key`), without Let's Encrypt and without access from the internet. The tool can also trust the certificate authority of your company for its outgoing connections, for example to your email server (`--ca-cert`). See [Company network](/docs/install-the-tool/#company-network).

### With Git

Use this way on an `arm64` server (the published image is for `x86_64`), or to follow the code with `git pull`. The server builds the image: 3 to 5 minutes.

```bash
git clone https://github.com/Probant-Reporting/probant.git probant
cd probant
./install.sh    # or: ./install.sh --domain reporting.example.com
```

### After the installation

- To update by hand, run `./update.sh` in the folder of the tool. The script backs up each space first.
- Emails, email alerts and the copy of the backups outside the server are set in the tool, in **Administration › Settings**, by a space manager. IT gives the settings of an email account, and a storage (S3-compatible or SFTP) for the copy. On a new installation, the email alerts are on as soon as the emails are set.
- Sign-in with a company account (OpenID Connect) is off by default. A space manager turns it on. See [Sign in with a company account](/docs/single-sign-on/).

The Docker image of each version is also published as `ghcr.io/probant-reporting/probant`, with its signature and its list of components. See [Verify the image](/docs/install-the-tool/#verify-the-image).

- [Installation guide in the repository](https://github.com/Probant-Reporting/probant/blob/main/docs/installation.md)
- The same guide on this site: [Prerequisites](/docs/prerequisites/), [Install the tool](/docs/install-the-tool/), [Update the tool](/docs/update-the-tool/)

## Managed hosting

If your IT team doesn't want to manage a server, a hosting provider can run {name}. The guide covers Clever Cloud, a French provider. It runs the tool, applies the system's security updates and provides HTTPS.

- The deployment takes about 30 minutes.
- **Empty.** To start for real. The application starts empty and the setup wizard creates the administrator account.
- **With the demo.** For an evaluation only: right after the deployment, open an SSH console and run `python manage.py load_demo`. The password of the demo accounts is public. To start for real afterwards, delete the application and deploy again.
- You need a Clever Cloud account and the settings of an email account for the reminders.
- You create a Python application from the repository, with two add-ons: PostgreSQL for the database, and FS Bucket for the evidence files and the backups.
- To update, you deploy the new version again. The automatic updates of a server don't exist with managed hosting.

You pay the provider for the hosting. {name} stays free.

- [Managed hosting guide in the repository](https://github.com/Probant-Reporting/probant/blob/main/docs/managed_hosting.md)
- The same guide on this site: [Managed hosting](/docs/managed-hosting/)

## From your computer to a server

You tried the all-in-one version and entered real data? You can move it to a server without losing anything: accounts and passwords, values, evidence and settings.

1. Close the window of the tool.
2. Make a `.zip` file of the `data` folder, next to Start.
3. Give it to your IT team in a safe way, for example on a USB key. Not in an ordinary email: it holds all your data.

Your IT team uses this folder as the data of the new server. A demo doesn't move: its accounts have a public password. See [From the all-in-one version to a server](/docs/from-pc-to-server/).

## Hear about new versions

- On GitHub, open the [repository](https://github.com/Probant-Reporting/probant), then choose **Watch › Custom › Releases**. GitHub then notifies you of each new version.
- Or follow the [RSS feed](/rss.xml) of this site in your feed reader.

There's no newsletter and no form: this site doesn't collect email addresses.
