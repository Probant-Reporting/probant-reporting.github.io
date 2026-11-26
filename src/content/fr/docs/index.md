---
title: "Vue d'ensemble"
description: "Ce guide s'adresse à l'équipe informatique. Il explique comment installer Probant sur un serveur Linux avec Docker, puis comment le mettre en place, le…"
order: 0
group: "Get started"
source: "docs/fr/installation.md"
---

Ce guide s'adresse à l'équipe informatique. Il explique comment installer Probant sur un serveur Linux avec Docker,
puis comment le mettre en place, le sauvegarder, le mettre à jour et le superviser. Vous n'avez pas besoin de
connaître Django ni Python.

L'outil tourne dans **un seul conteneur Docker**. Toutes ses données sont dans **un seul volume**, `/data` : base,
preuves, logo, sauvegardes et clé secrète.

Ce tableau indique la façon de faire selon votre cas :

| Votre cas | Suivez | Durée |
|---|---|---|
| Un serveur Linux qui a accès à Internet (le cas courant) | [Installer en une commande](/docs/install-the-tool/#installer-en-une-commande) | 2 minutes environ |
| Vous voulez que le serveur construise l'image à partir du code | [Installer avec Git](/docs/install-the-tool/#installer-avec-git) | 3 à 5 minutes |
| Un serveur sans accès à Internet | [Installer sans accès à Internet](/docs/install-the-tool/#installer-sans-accès-à-internet) | |
| Vous ne voulez pas gérer de serveur | [Hébergement clé en main (Clever Cloud)](/docs/managed-hosting/) | 30 minutes environ |
| Un essai par une personne, sur un ordinateur Windows ou Mac | La version tout-en-un : `probant-windows.zip` ou `probant-mac.zip` sur la page de la dernière release (https://github.com/Probant-Reporting/probant/releases/latest). Elle ne demande ni installation, ni droits d'administration. Pour passer ensuite ses données sur un serveur, voir [De la version tout-en-un à un serveur](/docs/from-pc-to-server/). | |

Avant de commencer, il vous faut un serveur Linux 64 bits avec 1 Go de mémoire, et un compte qui peut utiliser
`sudo`. Sur Debian ou Ubuntu, vous n'avez pas à installer Docker d'abord : l'installeur propose de l'installer. La
liste complète est à la section 1. La liste de ce que l'IT prépare est dans [Ce qu'il faut préparer](/docs/it-request/),
et le dossier pour une revue de sécurité est dans le [Dossier de sécurité](/docs/security-overview/).

Juste après l'installation, ouvrez l'adresse de l'outil et créez le compte administrateur (section 3).

Ce tableau présente les opérations courantes, dans le dossier de l'outil :

| Opération | Commande | Durée |
|---|---|---|
| Mettre à jour | `./update.sh` | 1 à 3 minutes |
| Sauvegarder | Rien : automatique chaque nuit. Tout de suite : `docker compose exec web python manage.py backup` | Quelques secondes |
| Restaurer | `docker compose exec web python manage.py restore <archive>` | Quelques secondes |
