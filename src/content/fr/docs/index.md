---
title: "Vue d'ensemble"
description: "Ce guide explique comment installer, mettre en place, sauvegarder, mettre à jour et superviser Probant avec Docker. Il s'adresse à l'équipe informatique.…"
order: 0
group: "Get started"
source: "docs/fr/installation.md"
---

Ce guide explique comment installer, mettre en place, sauvegarder, mettre à jour et superviser Probant avec
Docker. Il s'adresse à l'équipe informatique. Vous n'avez pas besoin de connaître Django ni Python.

L'outil tourne dans **un seul conteneur Docker**. Toutes ses données sont dans **un seul volume**, `/data` : base,
preuves, logo, sauvegardes et clé secrète.

Ce tableau présente les principales opérations :

| Opération | Commande | Durée |
|---|---|---|
| Installer, en une commande | `curl -fsSL https://github.com/Probant-Reporting/probant/raw/main/get.sh \| sudo sh` | 2 minutes environ |
| Installer, avec Git | `./install.sh` (le serveur construit l'image) | 3 à 5 minutes |
| Mettre à jour | `./update.sh` | 1 à 3 minutes |
| Sauvegarder | Automatique chaque nuit, ou `docker compose exec web python manage.py backup` | Quelques secondes |
| Restaurer | `docker compose exec web python manage.py restore <archive>` | Quelques secondes |

Si vous ne voulez pas gérer de serveur, voir [Hébergement clé en main (Clever Cloud)](/docs/managed-hosting/).
Pour passer les données de la version tout-en-un d'un ordinateur à un serveur, voir [De la version tout-en-un à un serveur](/docs/from-pc-to-server/).

Avant l'installation, la liste de ce que l'IT prépare est dans [Ce qu'il faut préparer](/docs/it-request/), et le dossier
pour une revue de sécurité est dans le [Dossier de sécurité](/docs/security-overview/).
